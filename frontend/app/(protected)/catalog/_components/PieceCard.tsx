'use client';

import { useDraggable } from '@dnd-kit/core';
import PieceDetailCard from '@/app/_components/PieceDetailCard';
import PieceIconCard from '@/app/_components/PieceIconCard';
import type { PieceFull, AbilityViewMode } from '../types';

interface PieceCardProps {
  piece: PieceFull;
  abilityViewMode?: AbilityViewMode;
}

export default function PieceCard({ piece, abilityViewMode = 'text' }: PieceCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `catalog-${piece.name}`,
    data: { piece, source: 'catalog' },
  });

  const opacity = isDragging ? 'opacity-40' : '';

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="cursor-grab">
      {abilityViewMode === 'icons' ? (
        <PieceIconCard piece={piece} className={opacity} />
      ) : (
        <PieceDetailCard piece={piece} showRawDsl={abilityViewMode === 'dsl'} className={opacity} />
      )}
    </div>
  );
}
