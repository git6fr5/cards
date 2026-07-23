'use client';

import type { DragEvent } from 'react';
import PieceToken from '@/app/_components/Piece';
import { ARCHETYPES, PIECE_TYPES } from '@/utils/archetypes';
import type { BodyColor } from '@/utils/archetypes';
import type { ShelfPiece } from '../../types';

const SHELF_SIZE = 7;

interface PlayerShelfProps {
  shelf: ShelfPiece[];
  bodyColor: BodyColor;
  isOwn: boolean;
  isActivePlayer: boolean;
  onSelectShelf: (shelfIndex: number) => void;
  onSelectPiece: (name: string) => void;
}

export default function PlayerShelf({ shelf, bodyColor, isOwn, isActivePlayer, onSelectShelf, onSelectPiece }: PlayerShelfProps) {
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
          return <div key={i} className="w-24 h-24 rounded-full border border-dashed border-raja-chrome-border" />;
        }
        if (piece.hidden) {
          return <div key={i} className="w-24 h-24 rounded-full bg-raja-chrome-muted/40 border border-raja-chrome-border" />;
        }
        return (
          <div
            key={i}
            draggable={canDrag}
            onDragStart={canDrag ? (e) => handleDragStart(e, i) : undefined}
            onClick={() => handleClick(piece, i)}
          >
            <PieceToken
              name={piece.name}
              archetype={ARCHETYPES[piece.archetype]}
              pieceType={PIECE_TYPES.PAWN}
              bodyColor={bodyColor}
              size="hand"
            />
          </div>
        );
      })}
    </div>
  );
}
