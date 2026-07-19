'use client';

import { useDroppable } from '@dnd-kit/core';
import RajaTableContainer from '@/components/table/RajaTableContainer';
import RajaTableMessage from '@/components/table/RajaTableMessage';
import BagTableRow from './BagTableRow';
import type { Bag, PieceFull } from './types';
import { KING_ROLE_TYPE } from './types';

interface BagTableProps {
  bag: Bag | null;
  catalogByName: Map<string, PieceFull>;
  isLoading: boolean;
  dragSource: 'catalog' | 'bag' | null;
  readOnly?: boolean;
}

const COLUMNS = [
  { label: 'Name',          width: 'w-40' },
  { label: 'Archetype',     width: 'w-28' },
  { label: 'SC',            width: 'w-16' },
  { label: 'AC',            width: 'w-16' },
  { label: 'Movement',      width: 'w-28' },
  { label: 'Trigger Type',  width: 'w-32' },
  { label: 'Quantity',      width: 'w-20' },
];

export default function BagTable({ bag, catalogByName, isLoading, dragSource, readOnly = false }: BagTableProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'bag-table' });
  const showDropOverlay = !readOnly && isOver && dragSource === 'catalog';

  if (isLoading) {
    return (
      <div ref={setNodeRef} className="relative flex-1 min-h-0">
        <RajaTableContainer className="h-full">
          <RajaTableMessage loading />
        </RajaTableContainer>
      </div>
    );
  }

  if (!bag) {
    return (
      <div ref={setNodeRef} className="relative flex-1 min-h-0">
        <RajaTableContainer className="h-full">
          <RajaTableMessage text="Select or create a bag to begin." muted />
        </RajaTableContainer>
      </div>
    );
  }

  const rows = bag.pieces
    .map((bp) => ({ piece: catalogByName.get(bp.piece_name), quantity: bp.quantity }))
    .filter((row): row is { piece: PieceFull; quantity: number } => row.piece !== undefined);

  const kingRow = rows.find((row) => row.piece.role_type === KING_ROLE_TYPE) ?? null;
  const otherRows = rows
    .filter((row) => row.piece.role_type !== KING_ROLE_TYPE)
    .sort((a, b) => a.piece.attributes.summon_cost - b.piece.attributes.summon_cost || a.piece.name.localeCompare(b.piece.name));
  const emptyMessage = readOnly ? 'This bag has no other pieces.' : 'Drag pieces here to add them to your bag.';

  return (
    <div ref={setNodeRef} className="relative flex-1 min-h-0">
      {showDropOverlay && <div className="absolute inset-0 bg-raja-chrome-text/20 pointer-events-none z-modal" />}
      <RajaTableContainer className="h-full">
        <table className="w-full table-fixed">
          <colgroup>
            {COLUMNS.map((col) => (
              <col key={col.label} className={col.width} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-dropdown bg-raja-chrome-bg">
            <tr className="border-b border-raja-chrome-border text-left">
              {COLUMNS.map((col) => (
                <th key={col.label} className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted truncate">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <BagTableRow piece={kingRow?.piece ?? null} quantity={kingRow?.quantity ?? 0} readOnly={readOnly} />
            {otherRows.map((row) => (
              <BagTableRow key={row.piece.name} piece={row.piece} quantity={row.quantity} readOnly={readOnly} />
            ))}
            {otherRows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-4 text-center font-sans-serif text-sm text-raja-chrome-muted">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </RajaTableContainer>
    </div>
  );
}
