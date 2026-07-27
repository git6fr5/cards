import { Crown, Gem } from 'lucide-react';
import { translateAbilityToIcons, PATTERN_ICONS } from '@/utils/abilityTranslatorIcons';
import type { IconChip, IconLine } from '@/utils/abilityTranslatorIcons';
import { translateAbilityHalfIcon } from '@/utils/abilityHalfIconTranslator';
import { ARCHETYPES } from '@/utils/archetypes';
import type { PieceFull } from './types';
import { KING_ROLE_TYPE } from './types';

interface PieceIconCard2Props {
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
      <span
        className="inline-block rounded-full px-1.5 py-0.5 font-sans-serif text-[0.6rem] font-bold bg-raja-chrome-border/70 text-raja-chrome-text"
        style={chip.color ? { backgroundColor: `${chip.color}B3`, color: '#000000' } : undefined}
      >
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

function displayName(piece: PieceFull): string {
  return piece.name;
}

function triggerChips(ability: string): IconChip[] {
  const trigger = translateAbilityToIcons(ability)?.trigger;
  return trigger && trigger.kind === 'chips' ? trigger.chips : [];
}

// translateTriggerIcons (abilityTranslatorIcons.ts) shapes its trigger chips as
// [icon, count?, '(', ...filterChips, ')'?] — this reads that same shape rather than
// re-parsing the DSL, so it stays in sync with the trigger translator by construction.
function splitTriggerCorner(chips: IconChip[]): { count: string | null; filterChips: IconChip[] } {
  const rest = chips.slice(1);
  let index = 0;
  let count: string | null = null;
  if (rest[index] && !rest[index].Icon && rest[index].label && rest[index].label !== '(') {
    count = rest[index].label as string;
    index++;
  }
  const filterChips = rest[index]?.label === '(' ? rest.slice(index + 1, -1) : [];
  return { count, filterChips };
}

function targetFilterChips(ability: string): IconChip[] {
  const target = translateAbilityToIcons(ability)?.target;
  if (!target || target.kind !== 'chips') return [];
  const openIndex = target.chips.findIndex((chip) => chip.label === '(');
  return openIndex === -1 ? [] : target.chips.slice(openIndex + 1, -1);
}

export default function PieceIconCard2({ piece, className = '' }: PieceIconCard2Props) {
  const archetype = ARCHETYPES[piece.archetype];
  const isKing = piece.role_type === KING_ROLE_TYPE;
  const ability = translateAbilityHalfIcon(piece.ability);
  const { count: triggerCount, filterChips } = splitTriggerCorner(triggerChips(piece.ability));
  const targetFilters = targetFilterChips(piece.ability);
  const PatternIcon = PATTERN_ICONS[piece.movement_type];
  const MpsIcon = isKing ? Crown : PatternIcon;
  const mpsCount = Math.max(piece.attributes.action_count, 1);
  const mpsScale = Math.max(1 - 0.2 * (mpsCount - 1), 0.2);
  const mpsSize = Math.round((isKing ? 44 : 36) * mpsScale);

  return (
    <div
      className={`relative w-[4.5cm] h-[4.5cm] border-[3px] border-raja-orange bg-raja-chrome-panel px-1 pt-5 pb-5 ${className}`}
    >
      <div className="absolute left-0.5 top-0.5 flex flex-col items-center gap-0.5">
        <archetype.Icon size={18} color={archetype.color} />
        {triggerCount && <span className="font-monospace text-xs text-raja-chrome-text">{triggerCount}</span>}
        {filterChips.map((chip, index) => (
          <Chip key={index} chip={chip} />
        ))}
      </div>

      <div className="absolute right-0.5 top-0.5 flex flex-col items-center gap-0.5">
        <Gem size={18} className="text-raja-chrome-text" />
        <span className="font-monospace text-xs text-raja-chrome-text">{piece.attributes.summon_cost}</span>
      </div>

      <div className="absolute right-0.5 bottom-0.5 flex flex-col-reverse items-center gap-0.5">
        {targetFilters.map((chip, index) => (
          <Chip key={index} chip={chip} />
        ))}
      </div>

      <p className="absolute top-0.5 left-8 right-8 h-7 flex items-center justify-center font-serif text-xs font-bold uppercase text-raja-chrome-text text-center leading-tight">
        {displayName(piece)}
      </p>

      <div className="absolute inset-0 flex items-center justify-center">
        {MpsIcon && (
          <div className="flex flex-col items-center gap-1">
            <span className="font-monospace text-sm text-raja-chrome-text">{piece.attributes.action_cost}</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: mpsCount }, (_, index) => (
                <MpsIcon key={index} size={mpsSize} color={archetype.color} />
              ))}
            </div>
          </div>
        )}
      </div>

      {ability && (
        <div className="absolute bottom-0 left-9 right-9 h-10 flex flex-col items-center justify-center gap-0.5 bg-raja-orange px-1">
          <ChipRow line={ability.target} />
          <ChipRow line={ability.effect} />
        </div>
      )}
    </div>
  );
}
