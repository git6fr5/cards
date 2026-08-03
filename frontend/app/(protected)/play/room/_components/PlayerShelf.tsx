'use client';

import { useDraggable } from '@dnd-kit/core';
import Piece_OnShelf from '@/app/_components/Piece/Piece_OnShelf';
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

interface ShelfSlotProps {
  index: number;
  piece: PieceFull;
  ownerIndex: 0 | 1;
  canDrag: boolean;
  onClick: () => void;
}

function ShelfSlot({ index, piece, ownerIndex, canDrag, onClick }: ShelfSlotProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `shelf-${ownerIndex}-${index}`,
    disabled: !canDrag,
    data: { piece, source: 'shelf' },
  });

  return (
    <div ref={setNodeRef} onClick={onClick} {...listeners} {...attributes}>
      <Piece_OnShelf piece={piece} ownerIndex={ownerIndex} />
    </div>
  );
}

export default function PlayerShelf({ shelf, catalogByName, ownerIndex, isOwn, isActivePlayer, onSelectShelf, onSelectPiece }: PlayerShelfProps) {
  const canDrag = isOwn && isActivePlayer;

  function handleClick(piece: ShelfPiece, index: number) {
    if (isOwn) onSelectShelf(index);
    if (isOwn && !piece.hidden) onSelectPiece(piece.name);
  }

  return (
    <div className="w-full grid grid-cols-[repeat(auto-fit,minmax(4rem,1fr))] content-start justify-items-center gap-2">
      {Array.from({ length: SHELF_SIZE }, (_, i) => {
        const piece = shelf[i];
        if (!piece) {
          return <div key={i} className="w-shelf-tile h-shelf-tile border border-dashed border-raja-chrome-border" />;
        }
        if (piece.hidden) {
          return <div key={i} className="w-shelf-tile h-shelf-tile bg-raja-chrome-muted/40 border border-raja-chrome-border" />;
        }
        const fullPiece = catalogByName.get(piece.name);
        if (!fullPiece) return <div key={i} className="w-shelf-tile h-shelf-tile" />;
        return (
          <ShelfSlot
            key={i}
            index={i}
            piece={fullPiece}
            ownerIndex={ownerIndex}
            canDrag={canDrag}
            onClick={() => handleClick(piece, i)}
          />
        );
      })}
    </div>
  );
}
