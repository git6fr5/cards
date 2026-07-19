export interface BoardPiece {
  name: string;
  archetype: string;
  owner: number;
  is_building: boolean;
}

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

export const KING_ROLE_TYPE = 'KING';
