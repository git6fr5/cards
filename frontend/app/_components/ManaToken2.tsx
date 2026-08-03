import { Gem } from 'lucide-react';

interface ManaToken2Props {
  state: 'filled' | 'empty';
}

const STATE_CLASSES: Record<ManaToken2Props['state'], string> = {
  filled: 'text-raja-chrome-text',
  empty: 'text-raja-chrome-border',
};

export default function ManaToken2({ state }: ManaToken2Props) {
  return (
    <div className="w-[calc(var(--height-shelf-tile)/2)] h-[calc(var(--height-shelf-tile)/2)]">
      <Gem width="100%" height="100%" className={STATE_CLASSES[state]} fill="none" />
    </div>
  );
}
