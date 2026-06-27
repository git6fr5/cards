import type { LucideIcon } from 'lucide-react';

export type BodyColor = 'white' | 'black';

export interface Archetype {
  name:  string;
  color: string;
  Icon: LucideIcon;
}

export interface Effect {
  label: string;
  Icon:  LucideIcon;
  color: string; // Tailwind text class, e.g. 'text-kingkiller-blue'
}

export interface PieceType {
  name: string;
  Icon: LucideIcon;
};

export interface TokenData {
  name:      string;
  piece_type: PieceType
  bodyColor: BodyColor;
  archetype: Archetype;
  movement:  number[][];
  effect:    (Effect | null)[][];
}

