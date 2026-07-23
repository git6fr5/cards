import ManaTrack from '@/app/_components/ManaTrack';
import PlayerShelf from './PlayerShelf';
import type { GameStatePlayer } from '../../types';

interface PlayerPanelProps {
  player: GameStatePlayer;
  label: string;
  isOwn: boolean;
  isActivePlayer: boolean;
  onSelectShelf: (shelfIndex: number) => void;
  onSelectPiece: (name: string) => void;
}

export default function PlayerPanel({ player, label, isOwn, isActivePlayer, onSelectShelf, onSelectPiece }: PlayerPanelProps) {
  const bodyColor = player.player_id === 0 ? 'steel' : 'gold';

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">
        {label}
      </span>
      <ManaTrack current={player.current_mana} total={player.total_mana} />
      <PlayerShelf
        shelf={player.shelf}
        bodyColor={bodyColor}
        isOwn={isOwn}
        isActivePlayer={isActivePlayer}
        onSelectShelf={onSelectShelf}
        onSelectPiece={onSelectPiece}
      />
    </div>
  );
}
