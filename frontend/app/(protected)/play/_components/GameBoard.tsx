import type { GameState, Piece } from '../types';
import BoardCell from './BoardCell';

interface GameBoardProps {
  gameState: GameState;
}

const BOARD_SIZE = 8;

export default function GameBoard({ gameState }: GameBoardProps) {
  const merged: Record<string, Piece> = {};
  for (const player of Object.values(gameState.players)) {
    for (const [key, piece] of Object.entries(player.board)) {
      merged[key] = piece;
    }
  }

  return (
    <div className="border border-kingkiller-gold/40 inline-block">
      {Array.from({ length: BOARD_SIZE }, (_, row) => (
        <div key={row} className="flex">
          {Array.from({ length: BOARD_SIZE }, (_, col) => (
            <BoardCell
              key={`${row},${col}`}
              row={row}
              col={col}
              piece={merged[`${row},${col}`] ?? null}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
