'use client';

import type { DragEvent } from 'react';
import PieceToken from './Piece';
import { ARCHETYPES, PIECE_TYPES } from '@/utils/archetypes';
import type { BoardPiece } from './types';

interface BoardSquareProps {
  piece: BoardPiece | null;
  row: number;
  col: number;
  square: string;
  isOwn: boolean;
  isActivePlayer: boolean;
  isHighlighted: boolean;
  onSelect: (square: string) => void;
  onDrop: (source: string, target: string) => void;
}

export default function BoardSquare({ piece, row, col, square, isOwn, isActivePlayer, isHighlighted, onSelect, onDrop }: BoardSquareProps) {
  const shade = (row + col) % 2 === 0
    ? 'bg-kingkiller-emerald'
    : 'bg-kingkiller-emerald-dark';
  const canInspect = isActivePlayer && !!piece;
  const canDrag = isActivePlayer && isOwn;
  const highlightClass = isHighlighted ? 'ring-2 ring-kingkiller-gold' : '';

  function handleDragStart(e: DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('text/plain', square);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const source = e.dataTransfer.getData('text/plain');
    if (source) onDrop(source, square);
  }

  return (
    <div
      className={`w-14 h-14 flex items-center justify-center ${shade} ${highlightClass}`}
      draggable={canDrag}
      onDragStart={canDrag ? handleDragStart : undefined}
      onClick={canInspect ? () => onSelect(square) : undefined}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {piece && (
        <PieceToken
          name={piece.name}
          archetype={ARCHETYPES[piece.archetype]}
          pieceType={PIECE_TYPES.PAWN}
          bodyColor={piece.owner === 0 ? 'steel' : 'gold'}
          size="sm"
        />
      )}
    </div>
  );
}
