import { useId } from 'react';
import { TEXT_EMBOSS_FILTER_ID } from './metalThemes';

interface NameTextProps {
  text: string;
  size: 'sm' | 'md' | 'lg';
}

export default function NameText({ text, size }: NameTextProps) {
  const pathId = useId();

  if (size === 'sm') return null;

  const radius = 44;

  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
      <path id={pathId} d={`M ${50 - radius},50 A ${radius},${radius} 0 0,1 ${50 + radius},50`} fill="none" />
      <text
        className="font-serif text-[7px] tracking-widest uppercase"
        fill="#000"
        stroke="#000"
        strokeWidth={0.6}
        paintOrder="stroke"
        style={{ filter: `url(#${TEXT_EMBOSS_FILTER_ID})` }}
      >
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          {text}
        </textPath>
      </text>
    </svg>
  );
}
