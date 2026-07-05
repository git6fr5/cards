import type { BodyColor } from '@/utils/archetypes';

export const TEXT_EMBOSS_FILTER_ID = 'piece-text-emboss';

export interface MetalTheme {
  filterId:      string;
  gradientFrom:  string;
  gradientTo:    string;
  rimHighlight:  string;
  rimShadow:     string;
  diffuseColor:  string;
  specularColor: string;
}

export const METAL_THEMES: Record<BodyColor, MetalTheme> = {
  steel: {
    filterId:      'piece-emboss-steel',
    gradientFrom:  '#E2E8F0',
    gradientTo:    '#8C96A0',
    rimHighlight:  '#F4F7FA',
    rimShadow:     '#5A6470',
    diffuseColor:  '#B8C2CC',
    specularColor: '#FFFFFF',
  },
  gold: {
    filterId:      'piece-emboss-gold',
    gradientFrom:  '#E8C874',
    gradientTo:    '#8C6D2F',
    rimHighlight:  '#F5DFA0',
    rimShadow:     '#5C4720',
    diffuseColor:  '#C9A84C',
    specularColor: '#FFF3D0',
  },
};
