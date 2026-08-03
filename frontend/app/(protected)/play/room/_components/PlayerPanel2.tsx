import ManaTrack2 from '@/app/_components/ManaTrack2';
import PlayerShelf2 from './PlayerShelf2';
import EndTurnButton from './EndTurnButton';
import type { GameStatePlayer } from '../../types';
import type { PieceFull } from '@/app/_components/types';

interface PlayerPanel2Props {
  player: GameStatePlayer;
  catalogByName: Map<string, PieceFull>;
  label: string;
  isOwn: boolean;
  isActivePlayer: boolean;
  isSubmitting: boolean;
  onSelectShelf: (shelfIndex: number) => void;
  onSelectPiece: (name: string) => void;
  onEndTurn: () => void;
}

export default function PlayerPanel2({
  player,
  catalogByName,
  label,
  isOwn,
  isActivePlayer,
  isSubmitting,
  onSelectShelf,
  onSelectPiece,
  onEndTurn,
}: PlayerPanel2Props) {
  const ownerIndex = player.seat_index === 0 ? 0 : 1;

  return (
    <div 
      className="w-full flex flex-row gap-2 items-start justify-center"
      style={{ ['--width-shelf-tile' as string]: '5.5rem', ['--height-shelf-tile' as string]: '5.5rem' } as React.CSSProperties}
    >
    <div
      className="w-full h-full flex flex-col items-center gap-3 p-3 bg-raja-chrome-panel border-2 rounded-[10px] ring-2 ring-mauve-800 border-raja-chrome-action overflow-hidden"
      style={{ ['--width-shelf-tile' as string]: '6rem', ['--height-shelf-tile' as string]: '6rem' } as React.CSSProperties}
    >
      <span className="font-serif text-lg font-bold uppercase tracking-wide text-raja-chrome-text text-center">
        {label}
      </span>
      <div className="w-full flex flex-col flex-wrap gap-2 items-start justify-center">
        <PlayerShelf2
          shelf={player.shelf}
          catalogByName={catalogByName}
          ownerIndex={ownerIndex}
          isOwn={isOwn}
          isActivePlayer={isActivePlayer}
          onSelectShelf={onSelectShelf}
          onSelectPiece={onSelectPiece}
        />
      </div>
      <div className="w-full mt-auto">
        <EndTurnButton onClick={onEndTurn} disabled={!isActivePlayer || isSubmitting} loading={isSubmitting} fullWidth />
      </div>
    </div>
    <div >
    <ManaTrack2 current={player.current_mana} total={player.total_mana} />
    </div>
    </div>
  );
}
