import type { Archetype, BodyColor } from '@/utils/archetypes';

export const TEXT_EMBOSS_FILTER_ID = 'piece-text-emboss';

export interface MetalTheme {
  gradientFrom: string;
  gradientTo:   string;
  rimHighlight: string;
  rimShadow:    string;
  diffuseColor: string;
}

export const METAL_THEMES: Record<BodyColor, MetalTheme> = {
  steel: {
    gradientFrom: '#E2E8F0',
    gradientTo:   '#8C96A0',
    rimHighlight: '#F4F7FA',
    rimShadow:    '#5A6470',
    diffuseColor: '#B8C2CC',
  },
  gold: {
    gradientFrom: '#E8C874',
    gradientTo:   '#8C6D2F',
    rimHighlight: '#F5DFA0',
    rimShadow:    '#5C4720',
    diffuseColor: '#C9A84C',
  },
};

// The specular highlight is tinted per-archetype (archetype.color), so the filter id must
// encode both axes — one filter per (bodyColor, archetype) pair, still defined once each
// in PieceFilterDefs and shared across every instance of that pair via url(#id).
export function pieceFilterId(bodyColor: BodyColor, archetype: Archetype): string {
  return `piece-emboss-${bodyColor}-${archetype.name.toLowerCase()}`;
}
