export interface Piece {
  piece_id: number;
  name: string;
  archetype: string;
  piece_type: string;
  body_color: string;
  movement: number[][];
  effect_grid: (string | null)[][];
  card_effects: unknown[];
  raw_effect_dsl: string;
  layer: 'BOARD' | 'SHELF' | 'BAG';
  position: [number, number] | null;
  owner_id: number;
  summon_cost: number;
  move_cost: number;
  move_count: number;
  is_alive: boolean;
  turns_on_board: number;
  kill_count: number;
  summon_cost_delta: number;
  move_count_delta: number;
  mod_turns_left: number;
}

export interface PlayerState {
  player_id: number;
  board: Record<string, Piece>;
  shelf: Piece[];
  bag: Piece[];
}

export interface GameState {
  room_id: number;
  turn: number;
  active_player: number;
  players: Record<string, PlayerState>;
  log: string[];
}

export interface TokenDefinition {
  id: number;
  name: string;
  archetype: string;
  piece_type: string;
  body_color: string;
  movement: number[][];
  effect_grid: (string | null)[][];
  effect_dsl: string | null;
  summon_cost: number;
  move_cost: number;
}

export interface SetResponse {
  tokens: TokenDefinition[];
}
