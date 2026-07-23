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
  isSelected: boolean;
  onSelect: (square: string) => void;
  onSelectPiece: (name: string) => void;
  onDrop: (source: string, target: string) => void;
}

export default function BoardSquare({ piece, row, col, square, isOwn, isActivePlayer, isHighlighted, isSelected, onSelect, onSelectPiece, onDrop }: BoardSquareProps) {
  const shade = (row + col) % 2 === 0
    ? 'bg-raja-wood'
    : 'bg-raja-wood-dark';
  const canInspect = !!piece;
  const canDrag = isActivePlayer && isOwn;
  const overlayClass = isSelected
    ? 'bg-raja-ink/50'
    : isHighlighted
      ? 'bg-raja-ink/25'
      : '';

  function handleClick() {
    if (canInspect) onSelect(square);
    if (piece) onSelectPiece(piece.name);
  }

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
      className={`relative w-28 h-28 flex items-center justify-center ${shade}`}
      draggable={canDrag}
      onDragStart={canDrag ? handleDragStart : undefined}
      onClick={piece ? handleClick : undefined}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {overlayClass && <div className={`pointer-events-none absolute inset-1 ${overlayClass}`} />}
      {piece && (
        <PieceToken
          name={piece.name}
          archetype={ARCHETYPES[piece.archetype]}
          pieceType={PIECE_TYPES.PAWN}
          bodyColor={piece.owner === 0 ? 'steel' : 'gold'}
          size="board"
        />
      )}
    </div>
  );
}
