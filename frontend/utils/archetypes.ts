import { ChessPawn, User, Crown, House, Timer, Castle, Axe, SquareArrowUp, Footprints, Square, SquareArrowDown, Skull } from 'lucide-react';
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
  SOLDIER: { name: 'Soldier', color: 'var(--color-raja-archetype-soldier)', Icon: Square },
  TIMEKEEPER: { name: 'Timekeeper', color: 'var(--color-raja-archetype-timekeeper)', Icon: Timer },
  NOMAD: { name: 'Nomad', color: 'var(--color-raja-archetype-nomad)', Icon: Footprints },
  TURRET: { name: 'Turret', color: 'var(--color-raja-archetype-turret)', Icon: Castle },
  BERSERKER: { name: 'Berserker', color: 'var(--color-raja-archetype-berserker)', Icon: Axe },
  VANGUARD: { name: 'Vanguard', color: 'var(--color-raja-archetype-vanguard)', Icon: SquareArrowUp },
  DEMON: { name: 'Demon', color: 'var(--color-raja-archetype-demon)', Icon: SquareArrowDown },
  TRAP: { name: 'Trap', color: 'var(--color-raja-archetype-trap)', Icon: Skull },
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
