interface ManaTokenProps {
  state: 'filled' | 'empty' | 'locked';
}

const STATE_CLASSES: Record<ManaTokenProps['state'], string> = {
  filled: 'bg-raja-ink',
  empty: 'border border-raja-ink',
  locked: 'border border-raja-stone opacity-disabled',
};

export default function ManaToken({ state }: ManaTokenProps) {
  return <div className={`w-3 h-3 rounded-full ${STATE_CLASSES[state]}`} />;
}
