import { Footprints, SquareArrowDown } from 'lucide-react';
import RajaArchetypeIcon from '@/components/ui/RajaArchetypeIcon';
import { translateAbilityToIcons, PATTERN_ICONS } from '@/utils/abilityTranslatorIcons';
import type { IconChip, IconLine } from '@/utils/abilityTranslatorIcons';
import type { PieceFull } from './types';

interface PieceIconCardProps {
  piece: PieceFull;
  className?: string;
}

interface ChipRowProps {
  line: IconLine;
}

interface ChipProps {
  chip: IconChip;
}

function Chip({ chip }: ChipProps) {
  if (chip.pill && chip.label) {
    return (
      <span className="inline-block rounded-full bg-raja-chrome-border px-1.5 py-0.5 font-sans-serif text-[0.6rem] font-bold text-raja-chrome-text">
        {chip.label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 font-monospace text-xs text-raja-chrome-text">
      {chip.Icon && <chip.Icon size={14} color={chip.color ?? 'currentColor'} />}
      {chip.label && <span>{chip.label}</span>}
    </span>
  );
}

function ChipRow({ line }: ChipRowProps) {
  if (line.kind === 'fallback') {
    if (!line.text) return null;
    return (
      <p className="w-full font-sans-serif text-xs text-raja-chrome-error text-center leading-tight">
        {line.text}
      </p>
    );
  }

  if (line.chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {line.chips.map((chip, index) => (
        <Chip key={index} chip={chip} />
      ))}
    </div>
  );
}

export default function PieceIconCard({ piece, className = '' }: PieceIconCardProps) {
  const ability = translateAbilityToIcons(piece.ability);
  const PatternIcon = PATTERN_ICONS[piece.movement_type];

  return (
    <div className={`relative w-[4.5cm] h-[4.5cm] border-[3px] border-raja-orange bg-raja-chrome-panel px-1 pt-5 pb-5 ${className}`}>
      <RajaArchetypeIcon archetype={piece.archetype} className="absolute left-0.5 top-0.5" />

      <div className="absolute right-0.5 top-0.5 flex flex-col items-center gap-0.5">
        <Footprints size={14} className="text-raja-chrome-text" />
        <span className="font-monospace text-xs text-raja-chrome-text">{piece.attributes.action_cost}</span>
      </div>

      <div className="absolute left-0.5 bottom-0.5 flex flex-col items-center gap-0.5">
        <span className="font-monospace text-xs text-raja-chrome-text">{piece.attributes.summon_cost}</span>
        <SquareArrowDown size={14} className="text-raja-chrome-text" />
      </div>

      <RajaArchetypeIcon archetype={piece.archetype} className="absolute right-0.5 bottom-0.5" />

      <p className="absolute top-0.5 left-8 right-8 h-7 flex items-center justify-center font-serif text-sm font-bold uppercase text-raja-chrome-text text-center leading-tight">
        {piece.name}
      </p>

      <div className="absolute bottom-0 left-11 right-11 h-9 flex items-center justify-center gap-0.5 bg-raja-orange">
        <Footprints size={14} className="text-raja-chrome-bg" />
        {PatternIcon && <PatternIcon size={14} className="text-raja-chrome-bg" />}
        <span className="font-monospace text-xs text-raja-chrome-bg">{piece.movement_distance}</span>
      </div>

      {ability && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 pt-5 pb-5">
          <ChipRow line={ability.trigger} />
          <ChipRow line={ability.effect} />
          <ChipRow line={ability.target} />
        </div>
      )}
    </div>
  );
}
