'use client';

import { useEffect, useMemo, useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { get, post, put } from '@/utils/api';
import RajaLoader from '@/components/layout/RajaLoader';
import { useEnsurePlayer } from '@/hooks/useEnsurePlayer';
import CatalogFilters from './_components/CatalogFilters';
import CatalogGrid from './_components/CatalogGrid';
import BagSelector from './_components/BagSelector';
import BagTable from './_components/BagTable';
import type { PieceFull, Bag, FilterState } from './types';
import { EMPTY_FILTERS, canAddPieceToBag } from './types';

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

export default function Catalog() {
  const { isReady, error: playerError } = useEnsurePlayer();

  const [pieces, setPieces] = useState<PieceFull[]>([]);
  const [bags, setBags] = useState<Bag[]>([]);
  const [selectedBagId, setSelectedBagId] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  async function handleCreateBag(name: string) {
    const bag = await post<Bag>('/bags', { name });
    await refreshBags();
    setSelectedBagId(bag.id);
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

  function handleIncrement(pieceName: string) {
    adjustPieceQuantity(pieceName, 1);
  }

  function handleDecrement(pieceName: string) {
    adjustPieceQuantity(pieceName, -1);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!selectedBag || event.over?.id !== 'bag-table') return;
    const piece = event.active.data.current?.piece as PieceFull | undefined;
    if (!piece) return;
    if (!canAddPieceToBag(piece, selectedBag.pieces, catalogByName)) return;
    adjustPieceQuantity(piece.name, 1);
  }

  if (!isReady) {
    const setupColor = playerError ? 'text-raja-chrome-error' : 'text-raja-grey-light';
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-raja-black">
        <RajaLoader alt size="lg" />
        <p className={`font-sans-serif text-sm ${setupColor}`}>
          {playerError ?? 'First time logging in — setting up.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-raja-black">
        <RajaLoader alt size="lg" />
      </div>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid min-h-screen grid-cols-[16rem_1fr_24rem] gap-6 bg-raja-black p-6">
        <CatalogFilters pieces={pieces} filters={filters} onChange={setFilters} />

        <div className="flex flex-col gap-4 overflow-y-auto">
          {error && <p className="font-sans-serif text-sm text-raja-chrome-error">{error}</p>}
          <CatalogGrid pieces={filteredPieces} />
        </div>

        <div className="flex flex-col gap-4">
          <BagSelector
            bags={bags}
            selectedBagId={selectedBagId}
            onSelect={setSelectedBagId}
            onCreate={handleCreateBag}
          />
          <BagTable
            bag={selectedBag}
            catalogByName={catalogByName}
            isLoading={false}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
          />
        </div>
      </div>
    </DndContext>
  );
}
