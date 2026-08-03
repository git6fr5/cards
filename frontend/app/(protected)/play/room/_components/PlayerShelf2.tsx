'use client';

import { useDraggable } from '@dnd-kit/core';
import Piece_OnShelf from '@/app/_components/Piece/Piece_OnShelf';
import type { PieceFull } from '@/app/_components/types';
import type { ShelfPiece } from '../../types';

const SHELF_SIZE = 7;

interface PlayerShelf2Props {
  shelf: ShelfPiece[];
  catalogByName: Map<string, PieceFull>;
  ownerIndex: 0 | 1;
  isOwn: boolean;
  isActivePlayer: boolean;
  onSelectShelf: (shelfIndex: number) => void;
  onSelectPiece: (name: string) => void;
}

interface ShelfSlot2Props {
  index: number;
  piece: PieceFull;
  ownerIndex: 0 | 1;
  canDrag: boolean;
  onClick: () => void;
}

function ShelfSlot2({ index, piece, ownerIndex, canDrag, onClick }: ShelfSlot2Props) {
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

export default function PlayerShelf2({ shelf, catalogByName, ownerIndex, isOwn, isActivePlayer, onSelectShelf, onSelectPiece }: PlayerShelf2Props) {
  const canDrag = isOwn && isActivePlayer;

  function handleClick(piece: ShelfPiece, index: number) {
    if (isOwn) onSelectShelf(index);
    if (isOwn && !piece.hidden) onSelectPiece(piece.name);
  }

  return (
    <div className="grid grid-cols-2 gap-2">
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
          <ShelfSlot2
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
