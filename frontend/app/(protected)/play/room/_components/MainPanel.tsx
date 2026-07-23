import Board from '@/app/_components/Board';
import RajaToast from '@/components/layout/RajaToast';
import PlayerPanel from './PlayerPanel';
import TurnStatus from './TurnStatus';
import EndTurnButton from './EndTurnButton';
import InviteLink from './InviteLink';
import type { ToastItem } from '@/hooks/useToastQueue';
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
  selectedSquare: string | null;
  toast: ToastItem | null;
  turnCount: number;
  activePlayerIndex: number;
  lastOutcome?: string;
  room: string;
  onSelectSquare: (square: string) => void;
  onSelectPiece: (name: string) => void;
  onDrop: (source: string, target: string) => void;
  onSelectShelf: (shelfIndex: number) => void;
  onEndTurn: () => void;
  onDismissToast: () => void;
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
  selectedSquare,
  toast,
  turnCount,
  activePlayerIndex,
  lastOutcome,
  room,
  onSelectSquare,
  onSelectPiece,
  onDrop,
  onSelectShelf,
  onEndTurn,
  onDismissToast,
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
          selectedSquare={selectedSquare}
          onSelectSquare={onSelectSquare}
          onSelectPiece={onSelectPiece}
          onDrop={onDrop}
        />
        <TurnStatus turnCount={turnCount} activePlayerIndex={activePlayerIndex} lastOutcome={lastOutcome} />
        {toast && (
          <RajaToast text={toast.text} tone={toast.tone} onDismiss={onDismissToast} />
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
