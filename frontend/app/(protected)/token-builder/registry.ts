import { Snowflake, Ghost, Skull, Cat, Flame, ChessPawn } from 'lucide-react';
import type { Archetype, Effect, PieceType, TokenData } from './types';

export const ARCHETYPES: Record<string, Archetype> = {
  GOBLIN: { name: 'Goblin', color: '#16A34A', Icon: Cat   },
  DRAGON: { name: 'Dragon', color: '#DC2626', Icon: Flame },
};

export const PIECE_TYPES: Record<string, PieceType> = {
  PAWN: { name: 'Pawn', Icon: ChessPawn },
};

export const EFFECTS: Record<string, Effect> = {
  FEAR:   { label: 'Fear',   Icon: Ghost,     color: 'text-kingkiller-crimson' },
  FREEZE: { label: 'Freeze', Icon: Snowflake,  color: 'text-kingkiller-blue'   },
  KILL:   { label: 'Kill',   Icon: Skull,      color: 'text-kingkiller-black'  },
};

export interface RawToken {
  name:      string;
  bodyColor: string;
  archetype: string;
  pieceType: string;
  movement:  number[][];
  effect:    (string | null)[][];
}

export function resolveToken(raw: RawToken): TokenData {
  return {
    name:       raw.name,
    bodyColor:  raw.bodyColor as TokenData['bodyColor'],
    archetype:  ARCHETYPES[raw.archetype],
    piece_type: PIECE_TYPES[raw.pieceType],
    movement:   raw.movement,
    effect:     raw.effect.map(row =>
      row.map(key => (key ? (EFFECTS[key] ?? null) : null)),
    ),
  };
}

export interface TokenDefinition {
  id:          number;
  name:        string;
  archetype:   string;
  piece_type:  string;
  body_color:  string;
  movement:    number[][];
  effect_grid: (string | null)[][];
  effect_dsl:  string | null;
  summon_cost: number;
  move_cost:   number;
}

export function resolveTokenDefinition(td: TokenDefinition): TokenData {
  return resolveToken({
    name:      td.name,
    bodyColor: td.body_color,
    archetype: td.archetype,
    pieceType: td.piece_type,
    movement:  td.movement,
    effect:    td.effect_grid,
  });
}
