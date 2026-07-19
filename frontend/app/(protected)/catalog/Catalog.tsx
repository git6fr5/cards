'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, DragOverlay, pointerWithin, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { get, post, put } from '@/utils/api';
import RajaLoader from '@/components/layout/RajaLoader';
import RajaToast from '@/components/layout/RajaToast';
import PieceToken from '@/app/_components/Piece';
import { ARCHETYPES, PIECE_TYPES } from '@/utils/archetypes';
import { useEnsurePlayer } from '@/hooks/useEnsurePlayer';
import CatalogFilters from './_components/CatalogFilters';
import CatalogGrid from './_components/CatalogGrid';
import BagTabs from './_components/BagTabs';
import BagTable from './_components/BagTable';
import type { PieceFull, Bag, FilterState } from './types';
import { EMPTY_FILTERS, getBagRejectionReason } from './types';

function matchesFilters(piece: PieceFull, filters: FilterState): boolean {
  if (filters.search && !piece.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
  if (filters.archetype && piece.archetype !== filters.archetype) return false;
  if (filters.role_type && piece.role_type !== filters.role_type) return false;
  if (filters.movement_type && piece.movement_type !== filters.movement_type) return false;
  if (filters.movement_distance && String(piece.movement_distance) !== filters.movement_distance) return false;
  if (filters.action_cost && String(piece.attributes.action_cost) !== filters.action_cost) return false;
  if (filters.summon_cost && String(piece.attributes.summon_cost) !== filters.summon_cost) return false;
  if (filters.trigger_type && piece.trigger_type !== filters.trigger_type) return false;
  if (filters.effect_type && piece.effect_type !== filters.effect_type) return false;
  return true;
}

function generateBagName(existing: Bag[]): string {
  const base = 'New Bag';
  const existingNames = new Set(existing.map((bag) => bag.name));
  if (!existingNames.has(base)) return base;
  let suffix = 2;
  while (existingNames.has(`${base} ${suffix}`)) suffix++;
  return `${base} ${suffix}`;
}

export default function Catalog() {
  const { isReady, error: playerError } = useEnsurePlayer();

  const [pieces, setPieces] = useState<PieceFull[]>([]);
  const [bags, setBags] = useState<Bag[]>([]);
  const [selectedBagId, setSelectedBagId] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDragPiece, setActiveDragPiece] = useState<PieceFull | null>(null);
  const [activeDragSource, setActiveDragSource] = useState<'catalog' | 'bag' | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const dropWasValidRef = useRef(false);
  const { setNodeRef: setCatalogDropRef, isOver: isOverCatalog } = useDroppable({ id: 'catalog-grid' });

  useEffect(() => {
    if (!isReady) return;

    async function loadData() {
      setError(null);
      setIsLoading(true);
      try {
        const [piecesData, bagsData] = await Promise.all([
          get<PieceFull[]>('/pieces/full'),
          get<Bag[]>('/bags'),
        ]);
        setPieces(piecesData);
        setBags(bagsData);
        if (bagsData.length > 0) {
          setSelectedBagId(bagsData[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [isReady]);

  const catalogByName = useMemo(() => new Map(pieces.map((piece) => [piece.name, piece])), [pieces]);
  const filteredPieces = useMemo(() => pieces.filter((piece) => matchesFilters(piece, filters)), [pieces, filters]);
  const selectedBag = bags.find((bag) => bag.id === selectedBagId) ?? null;

  async function refreshBags() {
    const bagsData = await get<Bag[]>('/bags');
    setBags(bagsData);
  }

  async function handleCreateBag() {
    setError(null);
    try {
      const bag = await post<Bag>('/bags', { name: generateBagName(bags) });
      await refreshBags();
      setSelectedBagId(bag.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handleRenameBag(bagId: number, name: string) {
    setError(null);
    try {
      await put<Bag>(`/bags/${bagId}/name`, { name });
      await refreshBags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function adjustPieceQuantity(pieceName: string, delta: number) {
    if (!selectedBag) return;
    setError(null);
    try {
      await put<Bag>(`/bags/${selectedBag.id}/pieces`, { delta_pieces: { [pieceName]: delta } });
      await refreshBags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const piece = event.active.data.current?.piece as PieceFull | undefined;
    const source = event.active.data.current?.source as 'catalog' | 'bag' | undefined;
    setActiveDragPiece(piece ?? null);
    setActiveDragSource(source ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const piece = event.active.data.current?.piece as PieceFull | undefined;
    const source = event.active.data.current?.source as 'catalog' | 'bag' | undefined;
    const droppedOnBagTable = event.over?.id === 'bag-table';

    let isValid = false;
    if (piece && selectedBag) {
      if (source === 'catalog' && droppedOnBagTable) {
        const rejectionReason = getBagRejectionReason(piece, selectedBag.pieces, catalogByName);
        if (rejectionReason) {
          setToast({ text: rejectionReason, tone: 'error' });
        } else {
          isValid = true;
          adjustPieceQuantity(piece.name, 1);
          setToast({ text: `Added ${piece.name} to ${selectedBag.name}.`, tone: 'success' });
        }
      } else if (source === 'bag' && !droppedOnBagTable) {
        isValid = true;
        adjustPieceQuantity(piece.name, -1);
        setToast({ text: `Removed ${piece.name} from ${selectedBag.name}.`, tone: 'success' });
      }
    }

    dropWasValidRef.current = isValid;
    setActiveDragPiece(null);
    setActiveDragSource(null);
  }

  if (!isReady) {
    const setupColor = playerError ? 'text-raja-chrome-error' : 'text-raja-chrome-muted';
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-raja-chrome-bg">
        <RajaLoader size="lg" />
        <p className={`font-sans-serif text-sm ${setupColor}`}>
          {playerError ?? 'First time logging in — setting up.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-raja-chrome-bg">
        <RajaLoader size="lg" />
      </div>
    );
  }

  return (
    <DndContext collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen overflow-hidden bg-raja-chrome-bg">
        <aside className="w-sidebar shrink-0 border-r border-raja-chrome-border overflow-y-auto p-4">
          <CatalogFilters pieces={pieces} filters={filters} onChange={setFilters} />
        </aside>

        <div className="flex flex-1 overflow-hidden">
          <div ref={setCatalogDropRef} className="relative flex-1 flex flex-col overflow-y-auto p-6">
            {isOverCatalog && activeDragSource === 'bag' && (
              <div className="absolute inset-0 bg-raja-chrome-text/20 pointer-events-none z-modal" />
            )}
            {error && <p className="font-sans-serif text-sm text-raja-chrome-error mb-4">{error}</p>}
            <CatalogGrid pieces={filteredPieces} />
          </div>

          <div className="flex-1 flex flex-col overflow-hidden border-l border-raja-chrome-border">
            <BagTabs
              bags={bags}
              selectedBagId={selectedBagId}
              onSelect={setSelectedBagId}
              onCreate={handleCreateBag}
              onRename={handleRenameBag}
            />
            <BagTable bag={selectedBag} catalogByName={catalogByName} isLoading={false} dragSource={activeDragSource} />
          </div>
        </div>
      </div>

      <DragOverlay modifiers={[snapCenterToCursor]} dropAnimation={dropWasValidRef.current ? null : undefined}>
        {activeDragPiece && (
          <div className="flex h-14 w-14 items-center justify-center border border-raja-chrome-border bg-raja-chrome-panel shadow-lg">
            <PieceToken
              name={activeDragPiece.name}
              archetype={ARCHETYPES[activeDragPiece.archetype]}
              pieceType={PIECE_TYPES[activeDragPiece.role_type]}
              bodyColor="steel"
              size="sm"
            />
          </div>
        )}
      </DragOverlay>

      {toast && (
        <RajaToast text={toast.text} tone={toast.tone} onDismiss={() => setToast(null)} />
      )}
    </DndContext>
  );
}
