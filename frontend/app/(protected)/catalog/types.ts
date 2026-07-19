export interface PieceAttributes {
  summon_cost: number;
  action_cost: number;
  action_count: number;
}

export interface PieceFull {
  id: number;
  name: string;
  archetype: string;
  role_type: string;
  movement: string;
  movement_type: string;
  movement_distance: number;
  movement_grid: number[][];
  ability: string;
  trigger_type: string;
  effect_type: string;
  attributes: PieceAttributes;
}

export interface BagPiece {
  piece_name: string;
  quantity: number;
}

export interface Bag {
  id: number;
  name: string;
  created_at: string;
  player_id: number;
  pieces: BagPiece[];
}

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

export const KING_ROLE_TYPE = 'KING';
export const MAX_BAG_SIZE = 20;
export const MAX_PER_PIECE = 2;
export const MAX_KING_QUANTITY = 1;

export function canAddPieceToBag(
  piece: PieceFull,
  bagPieces: BagPiece[],
  catalogByName: Map<string, PieceFull>,
): boolean {
  const totalQuantity = bagPieces.reduce((sum, bp) => sum + bp.quantity, 0);
  if (totalQuantity >= MAX_BAG_SIZE) return false;

  const existing = bagPieces.find((bp) => bp.piece_name === piece.name);
  const currentQuantity = existing?.quantity ?? 0;

  if (piece.role_type === KING_ROLE_TYPE) {
    const hasDifferentKing = bagPieces.some((bp) => {
      if (bp.piece_name === piece.name) return false;
      return catalogByName.get(bp.piece_name)?.role_type === KING_ROLE_TYPE;
    });
    if (hasDifferentKing) return false;
    return currentQuantity < MAX_KING_QUANTITY;
  }

  return currentQuantity < MAX_PER_PIECE;
}
