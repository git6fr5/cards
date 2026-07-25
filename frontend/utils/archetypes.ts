import { Cat, Ghost, ChessPawn, User, Crown, House, Sword, Timer, Send, Castle } from 'lucide-react';
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
  SOLDIER: { name: 'Soldier', color: '#DC2626', Icon: Sword },
  WARLOCK: { name: 'Warlock', color: '#38BDF8', Icon: Ghost },
  TIMEKEEPER: { name: 'Timekeeper', color: '#CA8A04', Icon: Timer },
  MESSENGER: { name: 'Messenger', color: '#0EA5E9', Icon: Send },
  TURRET: { name: 'Turret', color: '#7C3AED', Icon: Castle },
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
