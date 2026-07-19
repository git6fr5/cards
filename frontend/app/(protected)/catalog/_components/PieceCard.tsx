'use client';

import { useDraggable } from '@dnd-kit/core';
import PieceToken from '@/app/_components/Piece';
import { ARCHETYPES, PIECE_TYPES } from '@/utils/archetypes';
import type { PieceFull } from '../types';

interface PieceCardProps {
  piece: PieceFull;
}

export default function PieceCard({ piece }: PieceCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `catalog-${piece.name}`,
    data: { piece },
  });

  const opacity = isDragging ? 'opacity-40' : '';

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex flex-col items-center gap-1 cursor-grab ${opacity}`}
    >
      <PieceToken
        name={piece.name}
        archetype={ARCHETYPES[piece.archetype]}
        pieceType={PIECE_TYPES[piece.role_type]}
        bodyColor="steel"
        size="md"
      />
      <span className="font-sans-serif text-xs text-raja-grey-light">{piece.name}</span>
      <span className="font-monospace text-xs text-raja-gold">{piece.attributes.summon_cost}</span>
    </div>
  );
}
