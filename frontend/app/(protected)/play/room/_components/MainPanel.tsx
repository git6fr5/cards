import Board from '@/app/_components/Board';
import RajaToast from '@/components/layout/RajaToast';
import PlayerPanel from './PlayerPanel';
import PlayerPanel2 from './PlayerPanel2';
import TurnStatus from './TurnStatus';
import InviteLink from './InviteLink';
import type { ToastItem } from '@/hooks/useToastQueue';
import type { BoardPiece, GameStatePlayer } from '../../types';
import type { PieceFull } from '@/app/_components/types';

interface MainPanelProps {
  board: Record<string, BoardPiece>;
  catalogByName: Map<string, PieceFull>;
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
  onSelectShelf: (shelfIndex: number) => void;
  onEndTurn: () => void;
  onDismissToast: () => void;
}

export default function MainPanel({
  board,
  catalogByName,
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
  onSelectShelf,
  onEndTurn,
  onDismissToast,
}: MainPanelProps) {
  return (
    <div className="flex w-full h-full items-center">
      <div className="flex-1.8 h-full flex flex-col items-center justify-start pt-4">
        <PlayerPanel2
          player={selfPlayer}
          catalogByName={catalogByName}
          label={selfLabel}
          isOwn
          isActivePlayer={isActivePlayer}
          isSubmitting={isSubmitting}
          onSelectShelf={onSelectShelf}
          onSelectPiece={onSelectPiece}
          onEndTurn={onEndTurn}
        />
      </div>

      <div className="flex-4 flex flex-col items-center justify-center gap-2">
        <Board
          board={board}
          catalogByName={catalogByName}
          selfPlayerId={selfPlayerId}
          isActivePlayer={isActivePlayer}
          flipped={flipped}
          highlightedSquares={highlightedSquares}
          selectedSquare={selectedSquare}
          onSelectSquare={onSelectSquare}
          onSelectPiece={onSelectPiece}
        />
        <TurnStatus turnCount={turnCount} activePlayerIndex={activePlayerIndex} lastOutcome={lastOutcome} />
        {toast && (
          <RajaToast text={toast.text} tone={toast.tone} onDismiss={onDismissToast} />
        )}
        <InviteLink room={room} otherPlayerIndex={otherPlayerIndex} />
      </div>

      <div className="flex-1 h-full flex flex-col items-center justify-start pt-8">
        <PlayerPanel
          player={opponentPlayer}
          catalogByName={catalogByName}
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
