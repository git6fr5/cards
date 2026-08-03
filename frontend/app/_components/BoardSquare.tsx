'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import Piece_OnBoard from './Piece/Piece_OnBoard';
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
}

export default function BoardSquare({ piece, fullPiece, row, col, square, isOwn, isActivePlayer, isHighlighted, isSelected, onSelect, onSelectPiece }: BoardSquareProps) {
  const shade = (row + col) % 2 === 0
    ? 'bg-raja-chrome-panel'
    : 'bg-raja-chrome-action';
  const canInspect = !!piece;
  const canDrag = isActivePlayer && isOwn;
  const overlayClass = isSelected
    ? 'bg-raja-chrome-text/50'
    : isHighlighted
      ? 'bg-raja-chrome-text/25'
      : '';

  const { attributes, listeners, setNodeRef: setDragRef } = useDraggable({
    id: square,
    disabled: !canDrag,
    data: fullPiece ? { piece: fullPiece, source: 'board' } : undefined,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: square });

  function setRefs(node: HTMLDivElement | null) {
    setDragRef(node);
    setDropRef(node);
  }

  function handleClick() {
    if (canInspect) onSelect(square);
    if (piece) onSelectPiece(piece.name);
  }

  return (
    <div
      ref={setRefs}
      className={`relative w-tile h-tile flex items-center justify-center ${shade} ${piece ? 'z-10' : 'z-0'}`}
      onClick={piece ? handleClick : undefined}
      {...listeners}
      {...attributes}
    >
      {overlayClass && <div className={`pointer-events-none absolute inset-1 ${overlayClass}`} />}
      {isOver && <div className="pointer-events-none absolute inset-0 z-20 ring-2 ring-inset ring-raja-chrome-text" />}
      {fullPiece && piece && <Piece_OnBoard piece={fullPiece} ownerIndex={piece.owner === 0 ? 0 : 1} />}
    </div>
  );
}
