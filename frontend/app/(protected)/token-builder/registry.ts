import { ARCHETYPES, PIECE_TYPES } from '@/utils/archetypes';
import type { TokenData } from './types';

export interface TokenDefinition {
  name:       string;
  archetype:  string;
  piece_type: string;
  movement:   number[][];
  ability:    string;
}

export function resolveTokenDefinition(td: TokenDefinition): TokenData {
  return {
    name:       td.name,
    archetype:  ARCHETYPES[td.archetype],
    piece_type: PIECE_TYPES[td.piece_type],
    movement:   td.movement,
    ability:    td.ability.split('\n')[0],
  };
}
