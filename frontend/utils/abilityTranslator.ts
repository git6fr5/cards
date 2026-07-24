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

const POSSESSIVE_WORDS: Record<string, string> = {
  FRIENDLY: 'your',
  ENEMY: 'their',
  ANY: 'any',
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
  '<=': (v) => `less than or equal to ${v}`,
  '>': (v) => `greater than ${v}`,
  '>=': (v) => `greater than or equal to ${v}`,
  '=': (v) => `exactly ${v}`,
};

const ok = (text: string): TranslatedLine => ({ text, isFallback: false });
const asFallback = (rawLine: string): TranslatedLine => ({ text: rawLine.trim(), isFallback: true });

function humanizeToken(token: string): string {
  return token.toLowerCase().replace(/_/g, ' ');
}

function durationPhrase(turns: number): string {
  return turns >= PERMANENT_TURNS ? 'permanently' : `for ${turns} turn${turns === 1 ? '' : 's'}`;
}

// rawTokens is everything after COUNT (target) or VALUE (trigger) — may start with "WHERE", or be empty.
// Returns a full "Where ..." clause (sans the "Where" word itself) for embedding as its own line.
function translateFilterSentence(rawTokens: string[]): string | null {
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
      structurePhrases.push(`a ${rawValues.split('|').map((v) => v.toLowerCase()).join(' or ')}`);
    }
  }

  const structureText = structurePhrases.length > 0 ? structurePhrases.join(' and ') : null;
  const attributeText = attributePhrases.length > 0 ? attributePhrases.join(' and ') : null;

  if (structureText && attributeText) return `the piece is ${structureText} with ${attributeText}`;
  if (structureText) return `the piece is ${structureText}`;
  if (attributeText) return `the piece has ${attributeText}`;
  return null;
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

  const filterSentence = translateFilterSentence(filterParts);
  const base = phraseFn(n);
  return ok(filterSentence ? `${base}\nWhere ${filterSentence}` : base);
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
      switch (parts[1]) {
        case 'BOARD': return ok('Move to the board');
        case 'SHELF': return ok('Move to your hand');
        case 'BAG': return ok('Move to your bag');
        default: return asFallback(rawLine);
      }
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

// Zones are either a possessed pool (bag/hand — "From your bag") or a spatial board query
// (count + alignment + "on the board within <pattern> <size>").
function translateZonePhrase(
  zoneToken: string,
  alignmentToken: string,
  alignment: string,
  isAll: boolean,
  countNum: number | null,
): string | null {
  const segments = zoneToken.split(':');

  switch (segments[0]) {
    case 'SHELF':
      return segments.length === 1 ? `From ${POSSESSIVE_WORDS[alignmentToken]} hand` : null;

    case 'BAG':
      return segments[1] === 'SEE' && segments.length === 3 ? `From ${POSSESSIVE_WORDS[alignmentToken]} bag` : null;

    case 'BOARD': {
      if (segments[1] !== 'PATTERN' || segments.length !== 4) return null;
      const pieceWord = isAll || countNum !== 1 ? 'pieces' : 'piece';
      const countWord = isAll ? 'all' : countNum === 1 ? '' : String(countNum);
      const location = `on the board within ${segments[2]} ${segments[3]}`;
      return [countWord, alignment, pieceWord, location].filter(Boolean).join(' ');
    }

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

  const isAll = countToken === 'ALL';
  const countNum = isAll ? null : Number(countToken);
  if (!isAll && Number.isNaN(countNum)) return asFallback(rawLine);

  const zonePhrase = translateZonePhrase(zoneToken, alignmentToken, alignment, isAll, countNum);
  if (zonePhrase === null) return asFallback(rawLine);

  const filterSentence = translateFilterSentence(filterParts);
  return ok(filterSentence ? `${zonePhrase}\nWhere ${filterSentence}` : zonePhrase);
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
