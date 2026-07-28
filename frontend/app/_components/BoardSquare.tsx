'use client';

import type { DragEvent } from 'react';
import PieceIconCard2 from './PieceIconCard2';
import type { BoardPiece, PieceFull } from './types';

interface BoardSquareProps {
  piece: BoardPiece | null;
  fullPiece: PieceFull | null;
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

export default function BoardSquare({ piece, fullPiece, row, col, square, isOwn, isActivePlayer, isHighlighted, isSelected, onSelect, onSelectPiece, onDrop }: BoardSquareProps) {
  const shade = (row + col) % 2 === 0
    ? 'bg-raja-chrome-panel'
    : 'bg-raja-orange';
  const canInspect = !!piece;
  const canDrag = isActivePlayer && isOwn;
  const overlayClass = isSelected
    ? 'bg-raja-chrome-text/50'
    : isHighlighted
      ? 'bg-raja-chrome-text/25'
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
      className={`relative w-[4.5cm] h-[4.5cm] flex items-center justify-center ${shade}`}
      draggable={canDrag}
      onDragStart={canDrag ? handleDragStart : undefined}
      onClick={piece ? handleClick : undefined}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {overlayClass && <div className={`pointer-events-none absolute inset-1 ${overlayClass}`} />}
      {fullPiece && piece && <PieceIconCard2 piece={fullPiece} ownerIndex={piece.owner === 0 ? 0 : 1} />}
    </div>
  );
}
