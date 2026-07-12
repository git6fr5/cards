import BoardSquare from './BoardSquare';
import type { BoardPiece } from './types';

const BOARD_WIDTH = 7;
const BOARD_HEIGHT = 7;

interface BoardProps {
  board: Record<string, BoardPiece>;
  selfPlayerId: number;
  isActivePlayer: boolean;
  highlightedSquares: string[];
  onSelectSquare: (square: string) => void;
  onDrop: (source: string, target: string) => void;
}

export default function Board({ board, selfPlayerId, isActivePlayer, highlightedSquares, onSelectSquare, onDrop }: BoardProps) {
  return (
    <div className="border border-raja-gold/40 inline-block">
      {Array.from({ length: BOARD_HEIGHT }, (_, i) => {
        const row = BOARD_HEIGHT - 1 - i;
        return (
          <div key={row} className="flex">
            {Array.from({ length: BOARD_WIDTH }, (_, col) => {
              const square = `${String.fromCharCode(65 + col)}${row}`;
              const piece = board[square] ?? null;
              const isOwn = piece?.owner === selfPlayerId;
              return (
                <BoardSquare
                  key={square}
                  row={row}
                  col={col}
                  square={square}
                  piece={piece}
                  isOwn={isOwn}
                  isActivePlayer={isActivePlayer}
                  isHighlighted={highlightedSquares.includes(square)}
                  onSelect={onSelectSquare}
                  onDrop={onDrop}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
