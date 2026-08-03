import { Circle, Gem } from 'lucide-react';
import { translateAbilityToIcons, PATTERN_ICONS } from '@/utils/abilityTranslatorIcons';
import type { IconChip, IconLine } from '@/utils/abilityTranslatorIcons';
import { translateAbilityHalfIcon } from '@/utils/abilityHalfIconTranslator';
import { ARCHETYPES } from '@/utils/archetypes';
import PieceMovementIcon from './PieceMovementIcon';
import type { PieceFull } from '../types';
import { KING_ROLE_TYPE } from '../types';

const CORNER_ICON_SIZE = 24;
const CHIP_ICON_SIZE = 14;
const DOT_SIZE = 8;
const KING_MPS_BASE_SIZE = 56;
const UNIT_MPS_BASE_SIZE = 52;
const PILL_TEXT_SIZE = 'text-[0.6rem]';
const BODY_TEXT_SIZE = 'text-xs';
const RING_DARKEN_PERCENT = 50;

interface Piece_OnDragProps {
  piece: PieceFull;
  ownerIndex?: 0 | 1;
  className?: string;
}

interface ChipRowProps {
  line: IconLine;
  light?: boolean;
}

interface ChipProps {
  chip: IconChip;
  light?: boolean;
}

function Chip({ chip, light }: ChipProps) {
  const textCls = light ? 'text-white' : 'text-raja-chrome-text';

  if (chip.pill && chip.label) {
    return (
      <span
        className={`inline-block rounded-full px-1.5 py-0.5 font-sans-serif ${PILL_TEXT_SIZE} font-bold bg-raja-chrome-border/70 ${textCls}`}
        style={chip.color ? { backgroundColor: `${chip.color}B3`, color: '#000000' } : undefined}
      >
        {chip.label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-0.5 font-monospace ${BODY_TEXT_SIZE} ${textCls}`}>
      {chip.Icon && <chip.Icon size={CHIP_ICON_SIZE} color={chip.color ?? 'currentColor'} />}
      {chip.label && <span>{chip.label}</span>}
    </span>
  );
}

function ChipRow({ line, light }: ChipRowProps) {
  if (line.kind === 'fallback') {
    if (!line.text) return null;
    return (
      <p className={`w-full font-sans-serif ${BODY_TEXT_SIZE} text-raja-chrome-error text-center leading-tight`}>
        {line.text}
      </p>
    );
  }

  if (line.chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {line.chips.map((chip, index) => (
        <Chip key={index} chip={chip} light={light} />
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

export default function Piece_OnDrag({ piece, ownerIndex, className = '' }: Piece_OnDragProps) {
  const archetype = ARCHETYPES[piece.archetype];
  const isKing = piece.role_type === KING_ROLE_TYPE;
  const ability = translateAbilityHalfIcon(piece.ability);
  const { count: triggerCount, filterChips } = splitTriggerCorner(triggerChips(piece.ability));
  const targetFilters = targetFilterChips(piece.ability);
  const hasMpsIcon = isKing || !!PATTERN_ICONS[piece.movement_type];
  const mpsCount = Math.max(piece.attributes.action_count, 1);
  const mpsScale = Math.max(1 - 0.2 * (mpsCount - 1), 0.2);
  const mpsSize = Math.round((isKing ? KING_MPS_BASE_SIZE : UNIT_MPS_BASE_SIZE) * mpsScale);
  const archetypeBorderColor = `color-mix(in srgb, ${archetype.color} 50%, transparent)`;
  const ringColor = `color-mix(in srgb, ${archetype.color} ${RING_DARKEN_PERCENT}%, black)`;

  return (
    <div
      className={`relative w-tile h-tile border-4 rounded-md shadow-sm ring-2 bg-raja-chrome-panel px-1 pt-5 pb-5 ${className}`}
      style={{ borderColor: archetypeBorderColor, ['--tw-ring-color' as string]: ringColor } as React.CSSProperties}
    >
      <div className="absolute left-0.5 top-0.5 flex flex-col items-center gap-0.5">
        <archetype.Icon size={CORNER_ICON_SIZE} color={archetype.color} />
        {triggerCount && <span className={`font-monospace ${BODY_TEXT_SIZE} text-raja-chrome-text`}>{triggerCount}</span>}
        {filterChips.map((chip, index) => (
          <Chip key={index} chip={chip} />
        ))}
      </div>

      <div className="absolute right-0.5 top-0.5 flex flex-col items-center gap-0.5">
        <Gem size={CORNER_ICON_SIZE} className="text-raja-chrome-text" />
        <span className={`font-monospace ${BODY_TEXT_SIZE} text-raja-chrome-text`}>{piece.attributes.summon_cost}</span>
      </div>

      <div className="absolute right-0.5 bottom-0.5 flex flex-col-reverse items-center gap-0.5">
        {targetFilters.map((chip, index) => (
          <Chip key={index} chip={chip} />
        ))}
      </div>

      <p className={`absolute top-0.5 left-8 right-8 h-7 flex items-center justify-center font-serif ${BODY_TEXT_SIZE} font-bold uppercase text-raja-chrome-text text-center leading-tight`}>
        {displayName(piece)}
      </p>

      <div className="absolute inset-0 flex items-center justify-center">
        {hasMpsIcon && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              {Array.from({ length: mpsCount }, (_, index) => (
                <PieceMovementIcon key={index} piece={piece} size={mpsSize} />
              ))}
            </div>
            <div className="flex flex-col items-center gap-0.5">
              {Array.from({ length: Math.ceil(piece.attributes.action_cost / 3) }, (_, row) => (
                <div key={row} className="flex items-center gap-0.5">
                  {Array.from({ length: Math.min(3, piece.attributes.action_cost - row * 3) }, (_, index) => (
                    <Circle key={index} size={DOT_SIZE} fill={archetype.color} color={archetype.color} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {ability && (
        <div
          className="absolute bottom-0 left-9 right-9 h-10 rounded-t-md flex flex-col items-center justify-center gap-0.5 px-1"
          style={{ backgroundColor: ringColor }}
        >
          <ChipRow line={ability.target} light />
          <ChipRow line={ability.effect} light />
        </div>
      )}
    </div>
  );
}
