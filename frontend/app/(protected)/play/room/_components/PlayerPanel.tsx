import ManaTrack from '@/app/_components/ManaTrack';
import PlayerShelf from './PlayerShelf';
import type { GameStatePlayer } from '../../types';

interface PlayerPanelProps {
  player: GameStatePlayer;
  label: string;
  isOwn: boolean;
  isActivePlayer: boolean;
  onSelectShelf: (shelfIndex: number) => void;
}

export default function PlayerPanel({ player, label, isOwn, isActivePlayer, onSelectShelf }: PlayerPanelProps) {
  const bodyColor = player.player_id === 0 ? 'steel' : 'gold';

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="font-garamond text-xs uppercase tracking-wide text-raja-grey-muted">
        {label}
      </span>
      <ManaTrack current={player.current_mana} total={player.total_mana} />
      <PlayerShelf
        shelf={player.shelf}
        bodyColor={bodyColor}
        isOwn={isOwn}
        isActivePlayer={isActivePlayer}
        onSelectShelf={onSelectShelf}
      />
    </div>
  );
}
