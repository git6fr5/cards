// Standalone TS reimplementation of the grammar in backend/engine/utils/parsers.py.
// Grammar reference: .context/engine_dsl_reference.md — keep both in sync if the DSL changes.

export interface TranslatedLine {
  text: string;
  isFallback: boolean;
}

export interface TranslatedAbility {
  trigger: TranslatedLine;
  effect: TranslatedLine;
  target: TranslatedLine;
}

const PERMANENT_TURNS = 99;

const ALIGNMENT_WORDS: Record<string, string> = {
  FRIENDLY: 'friendly',
  ENEMY: 'enemy',
  ANY: '',
};

const ZONE_WORDS: Record<string, string> = {
  SHELF: 'hand',
  BAG: 'the bag',
};

const TRIGGER_PHRASES: Record<string, (n: number) => string> = {
  TURNEND: (n) => (n === 1 ? 'At the end of every turn' : `Every ${n} turns`),
  MOVE: (n) => (n === 1 ? 'Every time this piece moves' : `Every ${n} times this piece moves`),
  KILL: (n) => (n === 1 ? 'Every time this piece captures' : `Every ${n} captures by this piece`),
  DEATH: (n) => (n === 1 ? 'Every time this piece is captured' : `Every ${n} times this piece is captured`),
  SUMMON: (n) => (n === 1 ? 'Every time this piece is summoned' : `Every ${n} summons of this piece`),
  PROMOTION: (n) => (n === 1 ? 'Every time this piece is promoted' : `Every ${n} promotions of this piece`),
};

const COMPARATOR_PHRASE: Record<string, (value: string) => string> = {
  '<': (v) => `less than ${v}`,
  '<=': (v) => `${v} or less`,
  '>': (v) => `more than ${v}`,
  '>=': (v) => `${v} or more`,
  '=': (v) => `exactly ${v}`,
};

const ok = (text: string): TranslatedLine => ({ text, isFallback: false });
const asFallback = (rawLine: string): TranslatedLine => ({ text: rawLine.trim(), isFallback: true });

function humanizeToken(token: string): string {
  return token.toLowerCase().replace(/_/g, ' ');
}

function pluralize(token: string): string {
  const lower = token.toLowerCase();
  return lower.endsWith('s') ? lower : `${lower}s`;
}

function durationPhrase(turns: number): string {
  return turns >= PERMANENT_TURNS ? 'permanently' : `for ${turns} turn${turns === 1 ? '' : 's'}`;
}

// rawTokens is everything after COUNT (target) or VALUE (trigger) — may start with "WHERE", or be empty.
function translateFilters(rawTokens: string[]): string | null {
  if (rawTokens.length === 0 || rawTokens[0] !== 'WHERE' || rawTokens[1] === 'ANY') return null;

  const structurePhrases: string[] = [];
  const attributePhrases: string[] = [];
  const attrPattern = /^ATT:([A-Z_]+)(<=|>=|<|>|=)(\d+)$/;

  for (const criterion of rawTokens.slice(1)) {
    const attrMatch = criterion.match(attrPattern);
    if (attrMatch) {
      const [, name, comparator, value] = attrMatch;
      attributePhrases.push(`${humanizeToken(name)} ${COMPARATOR_PHRASE[comparator](value)}`);
      continue;
    }
    if (criterion.includes(':')) {
      const [, rawValues] = criterion.split(':');
      structurePhrases.push(rawValues.split('|').map(pluralize).join(' or '));
    }
  }

  const parts: string[] = [];
  if (structurePhrases.length > 0) parts.push(structurePhrases.join(' '));
  if (attributePhrases.length > 0) parts.push(`with ${attributePhrases.join(' and ')}`);

  return parts.length > 0 ? parts.join(' ') : null;
}

function translateTrigger(rawLine: string): TranslatedLine {
  const parts = rawLine.trim().toUpperCase().split(' ');
  if (parts[0] !== 'ON') return asFallback(rawLine);
  if (parts.length === 2 && parts[1] === 'ACTIVATE') return ok('When activated');
  if (parts.length < 3) return asFallback(rawLine);

  const [, condition, value, ...filterParts] = parts;
  const phraseFn = TRIGGER_PHRASES[condition];
  const n = Number(value);
  if (!phraseFn || Number.isNaN(n)) return asFallback(rawLine);

  const filterPhrase = translateFilters(filterParts);
  const base = phraseFn(n);
  return ok(filterPhrase ? `${base}, limited to ${filterPhrase}` : base);
}

function translateEffect(rawLine: string): TranslatedLine {
  const parts = rawLine.trim().toUpperCase().split(' ');

  switch (parts[0]) {
    case 'KILL':
      return parts.length === 1 ? ok('Kill the target') : asFallback(rawLine);

    case 'SUMMON': {
      if (parts.length !== 2) return asFallback(rawLine);
      const alignment = ALIGNMENT_WORDS[parts[1]];
      return alignment === undefined ? asFallback(rawLine) : ok(`Summon a${alignment ? ` ${alignment}` : ''} piece`);
    }

    case 'PUT': {
      if (parts.length !== 2) return asFallback(rawLine);
      const zone = ZONE_WORDS[parts[1]] ?? (parts[1] === 'BOARD' ? 'the board' : undefined);
      return zone ? ok(`Move the target to ${zone}`) : asFallback(rawLine);
    }

    case 'MODIFY': {
      if (parts.length !== 5 || parts[3] !== 'TURNS') return asFallback(rawLine);
      const [, attribute, delta, , turnsRaw] = parts;
      const deltaNum = Number(delta);
      const turns = Number(turnsRaw);
      if (Number.isNaN(deltaNum) || Number.isNaN(turns)) return asFallback(rawLine);
      const verb = deltaNum >= 0 ? 'Increase' : 'Decrease';
      return ok(`${verb} ${humanizeToken(attribute)} by ${Math.abs(deltaNum)} ${durationPhrase(turns)}`);
    }

    case 'CONVERT': {
      const hasTurns = parts.length === 5 && parts[3] === 'TURNS';
      if (parts.length !== 3 && !hasTurns) return asFallback(rawLine);
      const [, field, value] = parts;
      const turns = hasTurns ? Number(parts[4]) : PERMANENT_TURNS;
      if (Number.isNaN(turns)) return asFallback(rawLine);
      return ok(`Convert ${humanizeToken(field)} to ${value.toLowerCase()} ${durationPhrase(turns)}`);
    }

    default:
      return asFallback(rawLine);
  }
}

function translateZone(zoneToken: string): string | null {
  const segments = zoneToken.split(':');
  switch (segments[0]) {
    case 'SHELF':
      return segments.length === 1 ? `in ${ZONE_WORDS.SHELF}` : null;
    case 'BAG':
      return segments[1] === 'SEE' && segments.length === 3 ? `in ${ZONE_WORDS.BAG}` : null;
    case 'BOARD':
      return segments[1] === 'PATTERN' && segments.length === 4
        ? `on the board within ${segments[2]} ${segments[3]}`
        : null;
    default:
      return null;
  }
}

function translateTarget(rawLine: string): TranslatedLine {
  const parts = rawLine.trim().toUpperCase().split(' ');

  if (parts.length === 1 && parts[0] === 'SELF') return ok('This piece');
  if (parts.length === 1 && parts[0] === 'DEFENDER') return ok('The defending piece');
  if (parts.length < 3) return asFallback(rawLine);

  const [alignmentToken, zoneToken, countToken, ...filterParts] = parts;
  const alignment = ALIGNMENT_WORDS[alignmentToken];
  if (alignment === undefined) return asFallback(rawLine);

  const zonePhrase = translateZone(zoneToken);
  if (zonePhrase === null) return asFallback(rawLine);

  const isAll = countToken === 'ALL';
  const countNum = isAll ? null : Number(countToken);
  if (!isAll && Number.isNaN(countNum)) return asFallback(rawLine);

  const pieceWord = isAll || countNum !== 1 ? 'pieces' : 'piece';
  const countWord = isAll ? 'all' : String(countNum);
  const filterPhrase = translateFilters(filterParts);

  const sentence = [countWord, alignment, pieceWord, zonePhrase].filter(Boolean).join(' ');
  return ok(filterPhrase ? `${sentence} (${filterPhrase})` : sentence);
}

export function translateAbility(dsl: string): TranslatedAbility | null {
  const lines = dsl.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  if (lines.length !== 3) {
    return { trigger: asFallback(dsl), effect: ok(''), target: ok('') };
  }

  return {
    trigger: translateTrigger(lines[0]),
    effect: translateEffect(lines[1]),
    target: translateTarget(lines[2]),
  };
}
