'use client';

import { useDraggable } from '@dnd-kit/core';
import Piece_Card from '@/app/_components/Piece/Piece_Card';
import Piece_OnShelf from '@/app/_components/Piece/Piece_OnShelf';
import Piece_OnBoard from '@/app/_components/Piece/Piece_OnBoard';
import type { PieceFull, AbilityViewMode } from '../types';

interface PieceCardProps {
  piece: PieceFull;
  abilityViewMode?: AbilityViewMode;
}

export default function PieceCard({ piece, abilityViewMode = 'card' }: PieceCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `catalog-${piece.name}`,
    data: { piece, source: 'catalog' },
  });

  const opacity = isDragging ? 'opacity-40' : '';

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="cursor-grab">
      {abilityViewMode === 'shelf' ? (
        <Piece_OnShelf piece={piece} className={opacity} />
      ) : abilityViewMode === 'board' ? (
        <Piece_OnBoard piece={piece} className={opacity} />
      ) : (
        <Piece_Card piece={piece} className={opacity} />
      )}
    </div>
  );
}
