import type { BoardPiece, Game, GamePlayerSeat } from '@/app/_components/types';

export type { BoardPiece, Game, GamePlayerSeat };

export interface VisibleShelfPiece {
  hidden: false;
  name: string;
  archetype: string;
  summon_cost: number;
}

export interface HiddenShelfPiece {
  hidden: true;
  name: null;
  archetype: null;
  summon_cost: null;
}

export type ShelfPiece = VisibleShelfPiece | HiddenShelfPiece;

export interface GameStatePlayer {
  player_id: number;
  current_mana: number;
  total_mana: number;
  shelf: ShelfPiece[];
  bag_count: number;
}

export interface GameState {
  board: Record<string, BoardPiece>;
  players: GameStatePlayer[];
  active_player_index: number;
  turn_count: number;
  is_game_over: boolean;
  log: string[];
}

export interface ActionResult {
  valid: boolean;
  outcome: string;
  state: GameState;
}

export interface PreviewActionResult {
  valid: boolean;
  outcome: string;
}
