const TONES = {
  neutral: 'bg-raja-chrome-panel text-raja-chrome-text',
  danger:  'bg-raja-chrome-error-light text-raja-chrome-error',
};

interface RajaBadgeProps {
  text: string;
  tone?: keyof typeof TONES;
  className?: string;
}

export default function RajaBadge({ text, tone = 'neutral', className = '' }: RajaBadgeProps) {
  const colors = TONES[tone];

  return (
    <span className={`inline-block px-2 py-0.5 font-sans-serif text-xs font-medium rounded-full whitespace-nowrap ${colors} ${className}`}>
      {text}
    </span>
  );
}
