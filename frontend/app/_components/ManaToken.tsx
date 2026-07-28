import { Gem } from 'lucide-react';

interface ManaTokenProps {
  state: 'filled' | 'empty' | 'locked';
}

const STATE_CLASSES: Record<ManaTokenProps['state'], string> = {
  filled: 'text-raja-chrome-blue',
  empty: 'text-raja-chrome-border',
  locked: 'text-raja-chrome-muted opacity-disabled',
};

export default function ManaToken({ state }: ManaTokenProps) {
  return <Gem size={14} className={STATE_CLASSES[state]} fill={state === 'filled' ? 'currentColor' : 'none'} />;
}
