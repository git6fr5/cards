// Selective icon/raw-DSL hybrid of abilityTranslatorIcons.ts (full icons) — only effect/target
// lines; trigger stays full-icon (see PieceIconCard2). Text portions render the raw DSL tokens
// rather than translated prose. Grammar reference: .context/engine_dsl_reference.md.

import { Angry, Axe, CornerRightDown, CornerRightUp, Pencil, Shield, Smile } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PATTERN_ICONS } from '@/utils/abilityTranslatorIcons';
import type { IconChip, IconLine } from '@/utils/abilityTranslatorIcons';

export interface HalfIconAbility {
  effect: IconLine;
  target: IconLine;
}

const PERMANENT_TURNS = 99;

const ALIGNMENT_COLORS: Record<string, string | undefined> = {
  FRIENDLY: '#16A34A',
  ENEMY: '#8C2E22',
  ANY: undefined,
};

const ALIGNMENT_ICON: Record<string, LucideIcon | undefined> = {
  FRIENDLY: Smile,
  ENEMY: Angry,
  ANY: undefined,
};

const EFFECT_LEAD_ICON: Record<string, LucideIcon> = {
  PUT: CornerRightDown,
  MODIFY: Pencil,
  CONVERT: Pencil,
};

const SURGE_PATTERN = /^ACTION_COUNT \+(\d+) TURNS 1$/;
const STUN_PATTERN = /^ACTION_COUNT -(\d+) TURNS 1$/;
const QUICKEN_PATTERN = /^SPEED_INCREMENT \+(\d+) TURNS 1$/;
const SLOW_PATTERN = /^SPEED_INCREMENT -(\d+) TURNS 1$/;
const HASTE_PATTERN = /^ACTION_COST -(\d+) TURNS 1$/;
const ENCUMBER_PATTERN = /^ACTION_COST \+(\d+) TURNS 1$/;
const DISCOUNT_PATTERN = /^SUMMON_COST -(\d+) TURNS 99$/;
const INFLATE_PATTERN = /^SUMMON_COST \+(\d+) TURNS 99$/;

function resolveModifyKeyword(rest: string): string | undefined {
  const surge = rest.match(SURGE_PATTERN);
  if (surge) return `SURGE ${surge[1]}`;
  const stun = rest.match(STUN_PATTERN);
  if (stun) return `STUN ${stun[1]}`;
  const quicken = rest.match(QUICKEN_PATTERN);
  if (quicken) return `QUICKEN ${quicken[1]}`;
  const slow = rest.match(SLOW_PATTERN);
  if (slow) return `SLOW ${slow[1]}`;
  const haste = rest.match(HASTE_PATTERN);
  if (haste) return `HASTE ${haste[1]}`;
  const encumber = rest.match(ENCUMBER_PATTERN);
  if (encumber) return `ENCUMBER ${encumber[1]}`;
  const discount = rest.match(DISCOUNT_PATTERN);
  if (discount) return `DISCOUNT ${discount[1]}`;
  const inflate = rest.match(INFLATE_PATTERN);
  if (inflate) return `INFLATE ${inflate[1]}`;
  return undefined;
}

const chips = (chips: IconChip[]): IconLine => ({ kind: 'chips', chips });
const asFallback = (rawLine: string): IconLine => ({ kind: 'fallback', text: rawLine.trim() });

function formatNumber(n: number): string {
  if (n === PERMANENT_TURNS) return '∞';
  if (n === -PERMANENT_TURNS) return '-∞';
  return String(n);
}

function translateEffectHalfIcon(rawLine: string, isBoardPatternTarget: boolean): IconLine {
  const parts = rawLine.trim().toUpperCase().split(' ');

  switch (parts[0]) {
    case 'KILL':
      return parts.length === 1
        ? chips(isBoardPatternTarget ? [{ label: 'BOMB', pill: true }] : [{ Icon: Axe }])
        : asFallback(rawLine);

    case 'SUMMON': {
      if (parts.length !== 2 || !(parts[1] in ALIGNMENT_COLORS)) return asFallback(rawLine);
      const faceIcon = ALIGNMENT_ICON[parts[1]];
      return chips(
        faceIcon
          ? [{ Icon: faceIcon }, { Icon: CornerRightDown }, { label: 'BOARD' }]
          : [{ Icon: CornerRightDown }, { label: 'BOARD' }]
      );
    }

    case 'MODIFY': {
      if (parts.length < 2) return asFallback(rawLine);
      const rest = parts.slice(1).join(' ');
      const keyword = resolveModifyKeyword(rest);
      return chips(
        keyword ? [{ label: keyword, pill: true }] : [{ Icon: EFFECT_LEAD_ICON.MODIFY }, { label: rest }]
      );
    }

    case 'PUT':
    case 'CONVERT':
      return parts.length < 2
        ? asFallback(rawLine)
        : chips([{ Icon: EFFECT_LEAD_ICON[parts[0]] }, { label: parts.slice(1).join(' ') }]);

    default:
      return asFallback(rawLine);
  }
}

function translateTargetHalfIcon(rawLine: string): IconLine {
  const parts = rawLine.trim().toUpperCase().split(' ');

  if (parts.length === 1 && parts[0] === 'SELF') return chips([]);
  if (parts.length === 1 && parts[0] === 'DEFENDER') return chips([{ Icon: Shield }]);
  if (parts.length < 3) return asFallback(rawLine);

  const [alignmentToken, zoneToken, countToken] = parts;
  if (!(alignmentToken in ALIGNMENT_COLORS)) return asFallback(rawLine);

  const isAll = countToken === 'ALL';
  const countNum = isAll ? null : Number(countToken);
  if (!isAll && Number.isNaN(countNum)) return asFallback(rawLine);

  const zoneSegments = zoneToken.split(':');
  const result: IconChip[] = [];

  const alignmentColor = ALIGNMENT_COLORS[alignmentToken];

  const faceIcon = ALIGNMENT_ICON[alignmentToken];

  if (zoneSegments[0] === 'SHELF') {
    if (zoneSegments.length !== 1) return asFallback(rawLine);
    if (faceIcon) result.push({ Icon: faceIcon });
    result.push({ Icon: CornerRightUp }, { label: zoneSegments[0] });
  } else if (zoneSegments[0] === 'BAG') {
    if (!(zoneSegments[1] === 'SEE' && zoneSegments.length === 3)) return asFallback(rawLine);
    if (faceIcon) result.push({ Icon: faceIcon });
    result.push({ Icon: CornerRightUp }, { label: zoneSegments[0] });
  } else if (zoneSegments[0] === 'BOARD') {
    if (zoneSegments[1] !== 'PATTERN' || zoneSegments.length !== 4) return asFallback(rawLine);
    const patternIcon = PATTERN_ICONS[zoneSegments[2]];
    if (patternIcon) result.push({ Icon: patternIcon, color: alignmentColor }, { label: zoneSegments[3] });
  } else {
    return asFallback(rawLine);
  }

  if (isAll) result.push({ label: 'ALL', pill: true });
  else if (countNum !== 1) result.push({ label: formatNumber(countNum as number) });

  return chips(result);
}

export function translateAbilityHalfIcon(dsl: string): HalfIconAbility | null {
  const lines = dsl.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  if (lines.length !== 3) {
    return { effect: chips([]), target: chips([]) };
  }

  const targetParts = lines[2].trim().toUpperCase().split(' ');
  const isBoardPatternTarget = targetParts[1]?.split(':')[0] === 'BOARD';

  return {
    effect: translateEffectHalfIcon(lines[1], isBoardPatternTarget),
    target: translateTargetHalfIcon(lines[2]),
  };
}
