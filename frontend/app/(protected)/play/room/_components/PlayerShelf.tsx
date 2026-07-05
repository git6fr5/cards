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
}

export default function PlayerShelf({ shelf, bodyColor, isOwn, isActivePlayer, onSelectShelf }: PlayerShelfProps) {
  const canInteract = isOwn && isActivePlayer;

  function handleDragStart(e: DragEvent<HTMLDivElement>, index: number) {
    e.dataTransfer.setData('text/plain', `S${index}`);
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: SHELF_SIZE }, (_, i) => {
        const piece = shelf[i];
        if (!piece) {
          return <div key={i} className="w-12 h-12 rounded-full border border-dashed border-kingkiller-stone" />;
        }
        return (
          <div
            key={i}
            draggable={canInteract}
            onDragStart={canInteract ? (e) => handleDragStart(e, i) : undefined}
            onClick={canInteract ? () => onSelectShelf(i) : undefined}
          >
            <PieceToken
              name={piece.name}
              archetype={ARCHETYPES[piece.archetype]}
              pieceType={PIECE_TYPES.PAWN}
              bodyColor={bodyColor}
              size="md"
            />
          </div>
        );
      })}
    </div>
  );
}
