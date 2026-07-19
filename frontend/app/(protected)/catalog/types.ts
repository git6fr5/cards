export type { PieceAttributes, PieceFull, BagPiece, Bag } from '@/app/_components/types';
export { KING_ROLE_TYPE } from '@/app/_components/types';
import type { PieceFull, BagPiece } from '@/app/_components/types';
import { KING_ROLE_TYPE } from '@/app/_components/types';

export interface FilterState {
  search: string;
  archetype: string;
  role_type: string;
  movement_type: string;
  movement_distance: string;
  action_cost: string;
  summon_cost: string;
  trigger_type: string;
  effect_type: string;
}

export const EMPTY_FILTERS: FilterState = {
  search: '',
  archetype: '',
  role_type: '',
  movement_type: '',
  movement_distance: '',
  action_cost: '',
  summon_cost: '',
  trigger_type: '',
  effect_type: '',
};

export const MAX_BAG_SIZE = 20;
export const MAX_PER_PIECE = 2;
export const MAX_KING_QUANTITY = 1;

export function getBagRejectionReason(
  piece: PieceFull,
  bagPieces: BagPiece[],
  catalogByName: Map<string, PieceFull>,
): string | null {
  const totalQuantity = bagPieces.reduce((sum, bp) => sum + bp.quantity, 0);
  if (totalQuantity >= MAX_BAG_SIZE) return `Bag is full (max ${MAX_BAG_SIZE} pieces).`;

  const existing = bagPieces.find((bp) => bp.piece_name === piece.name);
  const currentQuantity = existing?.quantity ?? 0;

  if (piece.role_type === KING_ROLE_TYPE) {
    const hasDifferentKing = bagPieces.some((bp) => {
      if (bp.piece_name === piece.name) return false;
      return catalogByName.get(bp.piece_name)?.role_type === KING_ROLE_TYPE;
    });
    if (hasDifferentKing || currentQuantity >= MAX_KING_QUANTITY) {
      return 'Only one King is allowed in a bag.';
    }
    return null;
  }

  if (currentQuantity >= MAX_PER_PIECE) return `Max ${MAX_PER_PIECE} of the same piece allowed.`;
  return null;
}
