import { Crown } from 'lucide-react';
import { PATTERN_ICONS } from '@/utils/abilityTranslatorIcons';
import { ARCHETYPES } from '@/utils/archetypes';
import type { PieceFull } from '../types';
import { KING_ROLE_TYPE } from '../types';

interface PieceMovementIconProps {
  piece: PieceFull;
  size?: number;
  className?: string;
}

export default function PieceMovementIcon({ piece, size = 36, className = '' }: PieceMovementIconProps) {
  const archetype = ARCHETYPES[piece.archetype];
  const isKing = piece.role_type === KING_ROLE_TYPE;
  const PatternIcon = isKing ? Crown : PATTERN_ICONS[piece.movement_type];
  if (!PatternIcon) return null;
  return <PatternIcon size={size} color={archetype.color} className={className} />;
}
