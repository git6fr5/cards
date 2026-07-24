import { Cat, Flame, Ghost, ChessPawn, User, Crown, House } from 'lucide-react';
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
  WARLOCK: { name: 'Warlock', color: '#38BDF8', Icon: Ghost },
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
