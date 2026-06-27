'use client';

import type { BorderConfig, BorderColor, BorderWidth } from '../types';

interface ColorSwatch {
  color: BorderColor;
  bg: string;
}

const COLOR_SWATCHES: ColorSwatch[] = [
  { color: 'kingkiller-gold',       bg: 'bg-kingkiller-gold' },
  { color: 'kingkiller-gold-light', bg: 'bg-kingkiller-gold-light' },
  { color: 'kingkiller-crimson',    bg: 'bg-kingkiller-crimson' },
  { color: 'kingkiller-arcane',     bg: 'bg-kingkiller-arcane' },
  { color: 'kingkiller-emerald',    bg: 'bg-kingkiller-emerald' },
  { color: 'kingkiller-stone',      bg: 'bg-kingkiller-stone' },
  { color: 'kingkiller-obsidian',   bg: 'bg-kingkiller-obsidian' },
  { color: 'kingkiller-white',      bg: 'bg-kingkiller-white' },
];

const WIDTH_OPTIONS: BorderWidth[] = [0, 1, 2, 4];

interface BorderRowProps {
  label: string;
  config: BorderConfig;
  onChange: (patch: Partial<BorderConfig>) => void;
}

export default function BorderRow({ label, config, onChange }: BorderRowProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-10 shrink-0 font-garamond text-xs text-kingkiller-grey">{label}</span>
      <div className="flex gap-1.5">
        {COLOR_SWATCHES.map((s) => {
          const isActive = config.color === s.color;
          const ringCls = isActive
            ? 'ring-2 ring-kingkiller-gold ring-offset-1 ring-offset-kingkiller-black'
            : '';
          return (
            <button
              key={s.color}
              title={s.color}
              onClick={() => onChange({ color: s.color })}
              className={`h-4 w-4 rounded-full ${s.bg} ${ringCls}`}
            />
          );
        })}
      </div>
      <div className="flex gap-1">
        {WIDTH_OPTIONS.map((w) => {
          const isActive = config.width === w;
          const cls = isActive
            ? 'border-kingkiller-gold bg-kingkiller-gold text-kingkiller-black'
            : 'border-kingkiller-stone text-kingkiller-grey-muted hover:border-kingkiller-gold/50 hover:text-kingkiller-white';
          return (
            <button
              key={w}
              onClick={() => onChange({ width: w })}
              className={`border px-2 py-0.5 font-garamond text-xs ${cls}`}
            >
              {w}
            </button>
          );
        })}
      </div>
    </div>
  );
}
