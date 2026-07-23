import BoardSquare from './BoardSquare';
import type { BoardPiece } from './types';

const BOARD_WIDTH = 7;
const BOARD_HEIGHT = 7;

interface BoardProps {
  board: Record<string, BoardPiece>;
  selfPlayerId: number;
  isActivePlayer: boolean;
  flipped: boolean;
  highlightedSquares: string[];
  onSelectSquare: (square: string) => void;
  onSelectPiece: (name: string) => void;
  onDrop: (source: string, target: string) => void;
}

export default function Board({ board, selfPlayerId, isActivePlayer, flipped, highlightedSquares, onSelectSquare, onSelectPiece, onDrop }: BoardProps) {
  return (
    <div className="border border-raja-gold/40 inline-block">
      {Array.from({ length: BOARD_HEIGHT }, (_, i) => {
        const row = flipped ? i : BOARD_HEIGHT - 1 - i;
        return (
          <div key={row} className="flex">
            {Array.from({ length: BOARD_WIDTH }, (_, i2) => {
              const col = flipped ? BOARD_WIDTH - 1 - i2 : i2;
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
                  onSelectPiece={onSelectPiece}
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
