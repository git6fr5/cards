// Icon-composition counterpart to abilityTranslator.ts — same DSL grammar, chip/icon output
// instead of prose. Grammar reference: .context/engine_dsl_reference.md.

import type { LucideIcon } from 'lucide-react';
import {
  Timer, Footprints, Axe, Skull, SquareArrowDown, SquareArrowUp, Castle,
  CornerRightDown, Pencil, Handbag, InspectionPanel, ShelvingUnit,
  ChessQueen, ChessPawn, ChessRook, ChessBishop, Dot, Gem, Shield,
} from 'lucide-react';
import { ARCHETYPES, PIECE_TYPES } from '@/utils/archetypes';

export interface IconChip {
  Icon?: LucideIcon;
  color?: string;
  label?: string;
  pill?: boolean;
}

export type IconLine =
  | { kind: 'chips'; chips: IconChip[] }
  | { kind: 'fallback'; text: string };

export interface IconAbility {
  trigger: IconLine;
  effect: IconLine;
  target: IconLine;
}

const PERMANENT_TURNS = 99;

const TRIGGER_ICONS: Record<string, LucideIcon> = {
  TURNEND: Timer,
  MOVE: Footprints,
  KILL: Axe,
  DEATH: Skull,
  SUMMON: SquareArrowDown,
  PROMOTION: SquareArrowUp,
};

const ALIGNMENT_COLORS: Record<string, string | undefined> = {
  FRIENDLY: '#16A34A',
  ENEMY: '#8C2E22',
  ANY: undefined,
};

const ZONE_ICONS: Record<string, LucideIcon> = {
  BOARD: InspectionPanel,
  BAG: Handbag,
  SHELF: ShelvingUnit,
};

export const PATTERN_ICONS: Record<string, LucideIcon> = {
  SQUARE: ChessQueen,
  FORWARD: ChessPawn,
  CROSS: ChessRook,
  DIAGONAL: ChessBishop,
  NONE: Dot,
};

const COMPARATOR_GLYPHS: Record<string, string> = {
  '<': '<',
  '<=': '≤',
  '>': '>',
  '>=': '≥',
  '=': '=',
};

// Attribute -> concept-icon chips (excluding the trailing comparator/value chips).
const ATTRIBUTE_ICON_CHIPS: Record<string, IconChip[]> = {
  SUMMON_COST: [{ Icon: SquareArrowDown }, { Icon: Gem }],
  ACTION_COST: [{ Icon: Footprints }, { Icon: Gem }],
  ACTION_COUNT: [{ Icon: Footprints }],
  TURNS_ON_BOARD: [{ Icon: Timer }],
  KILL_COUNT: [{ Icon: Axe }],
  DEATH_COUNT: [{ Icon: Skull }],
  SUMMON_COUNT: [{ Icon: SquareArrowDown }],
  PROMOTION_COUNT: [{ Icon: SquareArrowUp }],
  DISTANCE_MOVED_COUNT: [{ Icon: Footprints }],
  ACTIONS_PERFORMED_COUNT: [{ Icon: Footprints }],
};

const chips = (chips: IconChip[]): IconLine => ({ kind: 'chips', chips });
const asFallback = (rawLine: string): IconLine => ({ kind: 'fallback', text: rawLine.trim() });

// PERMANENT_TURNS (99) is also used card-wide as a "practically infinite" magnitude convention
// for MODIFY deltas — render both as an infinity glyph rather than the literal number.
function formatNumber(n: number): string {
  if (n === PERMANENT_TURNS) return '∞';
  if (n === -PERMANENT_TURNS) return '-∞';
  return String(n);
}

// rawTokens is everything after COUNT (target) or VALUE (trigger) — may start with "WHERE", or be empty.
// Distinct WHERE criteria are joined with a "&" chip; alternatives within one criterion stay "or".
function translateFilterChips(rawTokens: string[]): IconChip[] | null {
  if (rawTokens.length === 0 || rawTokens[0] !== 'WHERE' || rawTokens[1] === 'ANY') return null;

  const result: IconChip[] = [];
  const attrPattern = /^ATT:([A-Z_]+)(<=|>=|<|>|=)(\d+)$/;

  for (const criterion of rawTokens.slice(1)) {
    const criterionChips: IconChip[] = [];
    const attrMatch = criterion.match(attrPattern);

    if (attrMatch) {
      const [, name, comparator, value] = attrMatch;
      criterionChips.push(
        ...(ATTRIBUTE_ICON_CHIPS[name] ?? []),
        { label: COMPARATOR_GLYPHS[comparator] },
        { label: formatNumber(Number(value)) },
      );
    } else if (criterion.includes(':')) {
      const [field, rawValues] = criterion.split(':');
      rawValues.split('|').forEach((value, index) => {
        if (index > 0) criterionChips.push({ label: 'or' });
        if (field === 'ARCHETYPE' && ARCHETYPES[value]) {
          criterionChips.push({ Icon: ARCHETYPES[value].Icon, color: ARCHETYPES[value].color });
        } else if (field === 'ROLETYPE' && PIECE_TYPES[value]) {
          criterionChips.push({ Icon: PIECE_TYPES[value].Icon });
        }
      });
    }

    if (criterionChips.length === 0) continue;
    if (result.length > 0) result.push({ label: '&' });
    result.push(...criterionChips);
  }

  return result.length > 0 ? result : null;
}

function translateTriggerIcons(rawLine: string): IconLine {
  const parts = rawLine.trim().toUpperCase().split(' ');
  if (parts[0] !== 'ON') return asFallback(rawLine);
  if (parts.length === 2 && parts[1] === 'ACTIVATE') return chips([{ Icon: Castle }]);
  if (parts.length < 3) return asFallback(rawLine);

  const [, condition, value, ...filterParts] = parts;
  const Icon = TRIGGER_ICONS[condition];
  const n = Number(value);
  if (!Icon || Number.isNaN(n)) return asFallback(rawLine);

  const result: IconChip[] = [{ Icon }];
  if (n !== 1) result.push({ label: formatNumber(n) });

  const filterChips = translateFilterChips(filterParts);
  if (filterChips) result.push({ label: '(' }, ...filterChips, { label: ')' });

  return chips(result);
}

function translateEffectIcons(rawLine: string): IconLine {
  const parts = rawLine.trim().toUpperCase().split(' ');

  switch (parts[0]) {
    case 'KILL':
      return parts.length === 1 ? chips([{ Icon: Axe }]) : asFallback(rawLine);

    case 'SUMMON': {
      if (parts.length !== 2 || !(parts[1] in ALIGNMENT_COLORS)) return asFallback(rawLine);
      return chips([{ Icon: SquareArrowDown, color: ALIGNMENT_COLORS[parts[1]] }]);
    }

    case 'PUT': {
      if (parts.length !== 2) return asFallback(rawLine);
      const zoneIcon = ZONE_ICONS[parts[1]];
      return zoneIcon ? chips([{ Icon: CornerRightDown }, { Icon: zoneIcon }]) : asFallback(rawLine);
    }

    case 'MODIFY': {
      if (parts.length !== 5 || parts[3] !== 'TURNS') return asFallback(rawLine);
      const [, attribute, delta, , turnsRaw] = parts;
      const deltaNum = Number(delta);
      const turns = Number(turnsRaw);
      if (Number.isNaN(deltaNum) || Number.isNaN(turns)) return asFallback(rawLine);

      let deltaLabel: string;
      if (deltaNum === PERMANENT_TURNS) deltaLabel = '∞';
      else if (deltaNum === -PERMANENT_TURNS) deltaLabel = '-∞';
      else deltaLabel = `${deltaNum >= 0 ? '+' : ''}${deltaNum}`;

      const result: IconChip[] = [
        { Icon: Pencil },
        ...(ATTRIBUTE_ICON_CHIPS[attribute] ?? []),
        { label: deltaLabel },
      ];
      if (turns < PERMANENT_TURNS) result.push({ Icon: Timer }, { label: formatNumber(turns) });
      return chips(result);
    }

    case 'CONVERT': {
      const hasTurns = parts.length === 5 && parts[3] === 'TURNS';
      if (parts.length !== 3 && !hasTurns) return asFallback(rawLine);
      const [, field, value] = parts;
      const turns = hasTurns ? Number(parts[4]) : PERMANENT_TURNS;
      if (Number.isNaN(turns)) return asFallback(rawLine);

      let targetChip: IconChip | undefined;
      if (field === 'ARCHETYPE' && ARCHETYPES[value]) {
        targetChip = { Icon: ARCHETYPES[value].Icon, color: ARCHETYPES[value].color };
      } else if (field === 'ROLETYPE' && PIECE_TYPES[value]) {
        targetChip = { Icon: PIECE_TYPES[value].Icon };
      }
      if (!targetChip) return asFallback(rawLine);

      const result: IconChip[] = [{ Icon: Pencil }, targetChip];
      if (turns < PERMANENT_TURNS) result.push({ Icon: Timer }, { label: formatNumber(turns) });
      return chips(result);
    }

    default:
      return asFallback(rawLine);
  }
}

function translateTargetIcons(rawLine: string): IconLine {
  const parts = rawLine.trim().toUpperCase().split(' ');

  if (parts.length === 1 && parts[0] === 'SELF') return chips([]);
  if (parts.length === 1 && parts[0] === 'DEFENDER') return chips([{ Icon: Shield }]);
  if (parts.length < 3) return asFallback(rawLine);

  const [alignmentToken, zoneToken, countToken, ...filterParts] = parts;
  if (!(alignmentToken in ALIGNMENT_COLORS)) return asFallback(rawLine);
  const color = ALIGNMENT_COLORS[alignmentToken];

  const isAll = countToken === 'ALL';
  const countNum = isAll ? null : Number(countToken);
  if (!isAll && Number.isNaN(countNum)) return asFallback(rawLine);

  const zoneSegments = zoneToken.split(':');
  const zoneIcon = ZONE_ICONS[zoneSegments[0]];
  if (!zoneIcon) return asFallback(rawLine);
  if (zoneSegments[0] === 'SHELF' && zoneSegments.length !== 1) return asFallback(rawLine);
  if (zoneSegments[0] === 'BAG' && !(zoneSegments[1] === 'SEE' && zoneSegments.length === 3)) return asFallback(rawLine);
  if (zoneSegments[0] === 'BOARD' && !(zoneSegments[1] === 'PATTERN' && zoneSegments.length === 4)) return asFallback(rawLine);

  const result: IconChip[] = [{ Icon: zoneIcon, color }];
  if (isAll) result.push({ label: 'ALL', pill: true });
  else if (countNum !== 1) result.push({ label: formatNumber(countNum as number) });

  if (zoneSegments[0] === 'BOARD') {
    const patternIcon = PATTERN_ICONS[zoneSegments[2]];
    if (patternIcon) result.push({ Icon: patternIcon }, { label: zoneSegments[3] });
  }

  const filterChips = translateFilterChips(filterParts);
  if (filterChips) result.push({ label: '(' }, ...filterChips, { label: ')' });

  return chips(result);
}

export function translateAbilityToIcons(dsl: string): IconAbility | null {
  const lines = dsl.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  if (lines.length !== 3) {
    return { trigger: asFallback(dsl), effect: chips([]), target: chips([]) };
  }

  return {
    trigger: translateTriggerIcons(lines[0]),
    effect: translateEffectIcons(lines[1]),
    target: translateTargetIcons(lines[2]),
  };
}
