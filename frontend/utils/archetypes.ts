import { Cat, Flame, ChessPawn } from 'lucide-react';
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
  DRAGON: { name: 'Dragon', color: '#DC2626', Icon: Flame },
};

// Shape differentiation per role type is deferred — all share the pawn icon for now.
export const PIECE_TYPES: Record<string, PieceType> = {
  PAWN: { name: 'Pawn', Icon: ChessPawn },
  UNIT: { name: 'Unit', Icon: ChessPawn },
  KING: { name: 'King', Icon: ChessPawn },
  BUILDING: { name: 'Building', Icon: ChessPawn },
};
