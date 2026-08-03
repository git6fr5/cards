import ManaTrack from '@/app/_components/ManaTrack';
import PlayerShelf from './PlayerShelf';
import type { GameStatePlayer } from '../../types';
import type { PieceFull } from '@/app/_components/types';

interface PlayerPanelProps {
  player: GameStatePlayer;
  catalogByName: Map<string, PieceFull>;
  label: string;
  isOwn: boolean;
  isActivePlayer: boolean;
  onSelectShelf: (shelfIndex: number) => void;
  onSelectPiece: (name: string) => void;
}

export default function PlayerPanel({ player, catalogByName, label, isOwn, isActivePlayer, onSelectShelf, onSelectPiece }: PlayerPanelProps) {
  const ownerIndex = player.seat_index === 0 ? 0 : 1;

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <span className="font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">
        {label}
      </span>
      <ManaTrack current={player.current_mana} total={player.total_mana} />
      <PlayerShelf
        shelf={player.shelf}
        catalogByName={catalogByName}
        ownerIndex={ownerIndex}
        isOwn={isOwn}
        isActivePlayer={isActivePlayer}
        onSelectShelf={onSelectShelf}
        onSelectPiece={onSelectPiece}
      />
    </div>
  );
}
