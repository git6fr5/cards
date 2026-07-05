import type { Archetype, PieceType } from '@/utils/archetypes';

export interface TokenData {
  name:      string;
  piece_type: PieceType;
  archetype: Archetype;
  movement:  number[][];
  ability:   string;
}

