interface ManaTokenProps {
  state: 'filled' | 'empty' | 'locked';
}

const STATE_CLASSES: Record<ManaTokenProps['state'], string> = {
  filled: 'bg-kingkiller-blue',
  empty: 'border border-kingkiller-blue',
  locked: 'border border-kingkiller-stone opacity-disabled',
};

export default function ManaToken({ state }: ManaTokenProps) {
  return <div className={`w-3 h-3 rounded-full ${STATE_CLASSES[state]}`} />;
}
