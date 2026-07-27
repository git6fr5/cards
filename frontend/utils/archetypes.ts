import { Cat, Ghost, ChessPawn, User, Crown, House, Timer, Castle, Axe, SquareArrowUp, Footprints, Square } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type BodyColor = 'steel' | 'gold';

export interface Archetype {
  name: string;
  color: string;
  Icon: LucideIcon;
}

export interface PieceType {
  name: string;
  Icon: LucideIcon;
}

export const ARCHETYPES: Record<string, Archetype> = {
  GOBLIN: { name: 'Goblin', color: '#16A34A', Icon: Cat },
  SOLDIER: { name: 'Soldier', color: '#6B7280', Icon: Square },
  WARLOCK: { name: 'Warlock', color: '#38BDF8', Icon: Ghost },
  TIMEKEEPER: { name: 'Timekeeper', color: '#CA8A04', Icon: Timer },
  NOMAD: { name: 'Nomad', color: '#0EA5E9', Icon: Footprints },
  TURRET: { name: 'Turret', color: '#7C3AED', Icon: Castle },
  BERSERKER: { name: 'Berserker', color: '#7F1D1D', Icon: Axe },
  VANGUARD: { name: 'Vanguard', color: '#C026D3', Icon: SquareArrowUp },
};

// Shape differentiation for CANNIBAL/PACIFIST is deferred — they share the pawn icon for now.
export const PIECE_TYPES: Record<string, PieceType> = {
  PAWN: { name: 'Pawn', Icon: ChessPawn },
  UNIT: { name: 'Unit', Icon: User },
  KING: { name: 'King', Icon: Crown },
  BUILDING: { name: 'Building', Icon: House },
  CANNIBAL: { name: 'Cannibal', Icon: ChessPawn },
  PACIFIST: { name: 'Pacifist', Icon: ChessPawn },
};
