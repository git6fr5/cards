import { ARCHETYPES, PIECE_TYPES } from '@/utils/archetypes';
import type { TokenData } from './types';

export interface TokenDefinition {
  name:          string;
  archetype:     string;
  role_type:     string;
  movement_grid: number[][];
  ability:       string;
}

export function resolveTokenDefinition(td: TokenDefinition): TokenData {
  return {
    name:       td.name,
    archetype:  ARCHETYPES[td.archetype],
    piece_type: PIECE_TYPES[td.role_type],
    movement:   td.movement_grid,
    ability:    td.ability.split('\n')[0],
  };
}
