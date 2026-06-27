import type { Piece } from '../types';
import PieceToken from './PieceToken';

interface BoardCellProps {
  piece: Piece | null;
  row: number;
  col: number;
}

export default function BoardCell({ piece, row, col }: BoardCellProps) {
  const shade = (row + col) % 2 === 0
    ? 'bg-kingkiller-obsidian'
    : 'bg-kingkiller-stone/30';

  return (
    <div className={`w-14 h-14 flex items-center justify-center ${shade}`}>
      {piece && <PieceToken piece={piece} />}
    </div>
  );
}
