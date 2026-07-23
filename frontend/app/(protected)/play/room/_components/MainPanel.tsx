import Board from '@/app/_components/Board';
import PlayerPanel from './PlayerPanel';
import TurnStatus from './TurnStatus';
import EndTurnButton from './EndTurnButton';
import InviteLink from './InviteLink';
import type { BoardPiece, GameStatePlayer } from '../../types';

interface MainPanelProps {
  board: Record<string, BoardPiece>;
  selfPlayer: GameStatePlayer;
  opponentPlayer: GameStatePlayer;
  selfLabel: string;
  opponentLabel: string;
  selfPlayerId: number;
  otherPlayerIndex: number;
  isActivePlayer: boolean;
  isSubmitting: boolean;
  flipped: boolean;
  highlightedSquares: string[];
  infoText: string | null;
  error: string | null;
  turnCount: number;
  activePlayerIndex: number;
  lastOutcome?: string;
  room: string;
  onSelectSquare: (square: string) => void;
  onSelectPiece: (name: string) => void;
  onDrop: (source: string, target: string) => void;
  onSelectShelf: (shelfIndex: number) => void;
  onEndTurn: () => void;
}

export default function MainPanel({
  board,
  selfPlayer,
  opponentPlayer,
  selfLabel,
  opponentLabel,
  selfPlayerId,
  otherPlayerIndex,
  isActivePlayer,
  isSubmitting,
  flipped,
  highlightedSquares,
  infoText,
  error,
  turnCount,
  activePlayerIndex,
  lastOutcome,
  room,
  onSelectSquare,
  onSelectPiece,
  onDrop,
  onSelectShelf,
  onEndTurn,
}: MainPanelProps) {
  return (
    <div className="flex w-full h-full items-center">
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <PlayerPanel
          player={selfPlayer}
          label={selfLabel}
          isOwn
          isActivePlayer={isActivePlayer}
          onSelectShelf={onSelectShelf}
          onSelectPiece={onSelectPiece}
        />
        <EndTurnButton onClick={onEndTurn} disabled={!isActivePlayer || isSubmitting} loading={isSubmitting} />
      </div>

      <div className="flex-3 flex flex-col items-center justify-center gap-4">
        <Board
          board={board}
          selfPlayerId={selfPlayerId}
          isActivePlayer={isActivePlayer}
          flipped={flipped}
          highlightedSquares={highlightedSquares}
          onSelectSquare={onSelectSquare}
          onSelectPiece={onSelectPiece}
          onDrop={onDrop}
        />
        <TurnStatus turnCount={turnCount} activePlayerIndex={activePlayerIndex} lastOutcome={lastOutcome} />
        {infoText && (
          <p className="font-sans-serif text-xs text-raja-chrome-muted max-w-xs text-center">{infoText}</p>
        )}
        {error && (
          <p className="font-sans-serif text-xs text-raja-chrome-error">{error}</p>
        )}
        <InviteLink room={room} otherPlayerIndex={otherPlayerIndex} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <PlayerPanel
          player={opponentPlayer}
          label={opponentLabel}
          isOwn={false}
          isActivePlayer={isActivePlayer}
          onSelectShelf={onSelectShelf}
          onSelectPiece={onSelectPiece}
        />
      </div>
    </div>
  );
}
