'use client';

import type { DragEvent } from 'react';
import PieceIconCard2 from '@/app/_components/PieceIconCard2';
import type { PieceFull } from '@/app/_components/types';
import type { ShelfPiece } from '../../types';

const SHELF_SIZE = 7;

interface PlayerShelfProps {
  shelf: ShelfPiece[];
  catalogByName: Map<string, PieceFull>;
  ownerIndex: 0 | 1;
  isOwn: boolean;
  isActivePlayer: boolean;
  onSelectShelf: (shelfIndex: number) => void;
  onSelectPiece: (name: string) => void;
}

export default function PlayerShelf({ shelf, catalogByName, ownerIndex, isOwn, isActivePlayer, onSelectShelf, onSelectPiece }: PlayerShelfProps) {
  const canDrag = isOwn && isActivePlayer;

  function handleDragStart(e: DragEvent<HTMLDivElement>, index: number) {
    e.dataTransfer.setData('text/plain', `S${index}`);
  }

  function handleClick(piece: ShelfPiece, index: number) {
    if (isOwn) onSelectShelf(index);
    if (isOwn && !piece.hidden) onSelectPiece(piece.name);
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: SHELF_SIZE }, (_, i) => {
        const piece = shelf[i];
        if (!piece) {
          return <div key={i} className="w-[4.5cm] h-[4.5cm] border border-dashed border-raja-chrome-border" />;
        }
        if (piece.hidden) {
          return <div key={i} className="w-[4.5cm] h-[4.5cm] bg-raja-chrome-muted/40 border border-raja-chrome-border" />;
        }
        const fullPiece = catalogByName.get(piece.name);
        if (!fullPiece) return <div key={i} className="w-[4.5cm] h-[4.5cm]" />;
        return (
          <div
            key={i}
            draggable={canDrag}
            onDragStart={canDrag ? (e) => handleDragStart(e, i) : undefined}
            onClick={() => handleClick(piece, i)}
          >
            <PieceIconCard2 piece={fullPiece} ownerIndex={ownerIndex} />
          </div>
        );
      })}
    </div>
  );
}
