import ManaToken from './ManaToken';

const MAX_MANA = 7;

interface ManaTrackProps {
  current: number;
  total: number;
}

export default function ManaTrack({ current, total }: ManaTrackProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: MAX_MANA }, (_, i) => {
        const state = i < current ? 'filled' : i < total ? 'empty' : 'locked';
        return <ManaToken key={i} state={state} />;
      })}
    </div>
  );
}
