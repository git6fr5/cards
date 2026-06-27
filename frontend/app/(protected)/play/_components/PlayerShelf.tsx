import type { Piece } from '../types';
import PieceToken from './PieceToken';

const SHELF_SIZE = 4;

interface PlayerShelfProps {
  shelf: Piece[];
  label: string;
}

export default function PlayerShelf({ shelf, label }: PlayerShelfProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="font-garamond text-xs uppercase tracking-wide text-kingkiller-grey-muted">
        {label}
      </span>
      <div className="flex gap-3">
        {Array.from({ length: SHELF_SIZE }, (_, i) => {
          const piece = shelf[i];
          return piece ? (
            <PieceToken key={piece.piece_id} piece={piece} />
          ) : (
            <div
              key={i}
              className="w-10 h-10 rounded-full border border-dashed border-kingkiller-stone"
            />
          );
        })}
      </div>
    </div>
  );
}
