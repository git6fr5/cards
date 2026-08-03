import ManaToken2 from './ManaToken2';

interface ManaTrack2Props {
  current: number;
  total: number;
}

export default function ManaTrack2({ current, total }: ManaTrack2Props) {
  return (
    <div className="flex flex-col gap-4 pt-12">
      {Array.from({ length: total }, (_, i) => {
        const state = i < current ? 'filled' : 'empty';
        return <ManaToken2 key={i} state={state} />;
      })}
    </div>
  );
}
