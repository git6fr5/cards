'use client';

import { useDroppable } from '@dnd-kit/core';
import RajaTableContainer from '@/components/table/RajaTableContainer';
import RajaTableMessage from '@/components/table/RajaTableMessage';
import BagTableRow from './BagTableRow';
import type { Bag, PieceFull } from '../types';
import { KING_ROLE_TYPE, MAX_BAG_SIZE, MAX_PER_PIECE, MAX_KING_QUANTITY } from '../types';

interface BagTableProps {
  bag: Bag | null;
  catalogByName: Map<string, PieceFull>;
  isLoading: boolean;
  onIncrement: (pieceName: string) => void;
  onDecrement: (pieceName: string) => void;
}

const COLUMN_COUNT = 6;

export default function BagTable({ bag, catalogByName, isLoading, onIncrement, onDecrement }: BagTableProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'bag-table' });
  const dropRing = isOver ? 'ring-2 ring-raja-chrome-action' : '';

  if (isLoading) {
    return (
      <div ref={setNodeRef}>
        <RajaTableContainer>
          <table className="w-full"><tbody><tr><td colSpan={COLUMN_COUNT}><RajaTableMessage loading /></td></tr></tbody></table>
        </RajaTableContainer>
      </div>
    );
  }

  if (!bag) {
    return (
      <div ref={setNodeRef}>
        <RajaTableContainer>
          <table className="w-full"><tbody><tr><td colSpan={COLUMN_COUNT}><RajaTableMessage text="Select or create a bag to begin." muted /></td></tr></tbody></table>
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

  const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);

  function canIncrement(piece: PieceFull, quantity: number): boolean {
    if (totalQuantity >= MAX_BAG_SIZE) return false;
    const cap = piece.role_type === KING_ROLE_TYPE ? MAX_KING_QUANTITY : MAX_PER_PIECE;
    return quantity < cap;
  }

  return (
    <div ref={setNodeRef} className={dropRing}>
      <RajaTableContainer>
        <table className="w-full">
          <thead>
            <tr className="border-b border-raja-chrome-border text-left">
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">Name</th>
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">Archetype</th>
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">Summon Cost</th>
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">Movement</th>
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">Trigger Type</th>
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">Quantity</th>
            </tr>
          </thead>
          <tbody>
            <BagTableRow
              piece={kingRow?.piece ?? null}
              quantity={kingRow?.quantity ?? 0}
              canIncrement={false}
              onIncrement={() => {}}
              onDecrement={() => kingRow && onDecrement(kingRow.piece.name)}
            />
            {otherRows.map((row) => (
              <BagTableRow
                key={row.piece.name}
                piece={row.piece}
                quantity={row.quantity}
                canIncrement={canIncrement(row.piece, row.quantity)}
                onIncrement={() => onIncrement(row.piece.name)}
                onDecrement={() => onDecrement(row.piece.name)}
              />
            ))}
            {otherRows.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-3 py-4 text-center font-sans-serif text-sm text-raja-chrome-muted">
                  Drag pieces here to add them to your bag.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </RajaTableContainer>
    </div>
  );
}
