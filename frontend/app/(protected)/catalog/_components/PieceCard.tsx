'use client';

import { useDraggable } from '@dnd-kit/core';
import PieceDetailCard from '@/app/_components/PieceDetailCard';
import type { PieceFull } from '../types';

interface PieceCardProps {
  piece: PieceFull;
}

export default function PieceCard({ piece }: PieceCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `catalog-${piece.name}`,
    data: { piece, source: 'catalog' },
  });

  const opacity = isDragging ? 'opacity-40' : '';

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="cursor-grab">
      <PieceDetailCard piece={piece} className={opacity} />
    </div>
  );
}
