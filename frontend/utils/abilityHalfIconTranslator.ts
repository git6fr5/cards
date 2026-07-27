// Selective icon/raw-DSL hybrid of abilityTranslatorIcons.ts (full icons) — only effect/target
// lines; trigger stays full-icon (see PieceIconCard2). Text portions render the raw DSL tokens
// rather than translated prose. Grammar reference: .context/engine_dsl_reference.md.

import { Axe, CornerRightDown, Pencil, Shield, SquareArrowDown } from 'lucide-react';
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

const EFFECT_LEAD_ICON: Record<string, LucideIcon> = {
  PUT: CornerRightDown,
  MODIFY: Pencil,
  CONVERT: Pencil,
};

const MODIFY_KEYWORDS: Record<string, string> = {
  'ACTION_COUNT +1 TURNS 1': 'AMP',
  'ACTION_COUNT -99 TURNS 1': 'STUN',
  'ACTION_COUNT -1 TURNS 1': 'SLOW',
};

const chips = (chips: IconChip[]): IconLine => ({ kind: 'chips', chips });
const asFallback = (rawLine: string): IconLine => ({ kind: 'fallback', text: rawLine.trim() });

function formatNumber(n: number): string {
  if (n === PERMANENT_TURNS) return '∞';
  if (n === -PERMANENT_TURNS) return '-∞';
  return String(n);
}

function translateEffectHalfIcon(rawLine: string): IconLine {
  const parts = rawLine.trim().toUpperCase().split(' ');

  switch (parts[0]) {
    case 'KILL':
      return parts.length === 1 ? chips([{ Icon: Axe }]) : asFallback(rawLine);

    case 'SUMMON': {
      if (parts.length !== 2 || !(parts[1] in ALIGNMENT_COLORS)) return asFallback(rawLine);
      return chips([{ Icon: SquareArrowDown, color: ALIGNMENT_COLORS[parts[1]] }]);
    }

    case 'MODIFY': {
      if (parts.length < 2) return asFallback(rawLine);
      const rest = parts.slice(1).join(' ');
      const keyword = MODIFY_KEYWORDS[rest];
      return chips([
        { Icon: EFFECT_LEAD_ICON.MODIFY },
        keyword ? { label: keyword, pill: true } : { label: rest },
      ]);
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

  if (zoneSegments[0] === 'SHELF') {
    if (zoneSegments.length !== 1) return asFallback(rawLine);
    result.push({ label: 'From' }, { label: zoneSegments[0], pill: true, color: alignmentColor });
  } else if (zoneSegments[0] === 'BAG') {
    if (!(zoneSegments[1] === 'SEE' && zoneSegments.length === 3)) return asFallback(rawLine);
    result.push({ label: 'From' }, { label: zoneSegments[0], pill: true, color: alignmentColor });
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

  return {
    effect: translateEffectHalfIcon(lines[1]),
    target: translateTargetHalfIcon(lines[2]),
  };
}
