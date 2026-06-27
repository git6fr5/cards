import type { BorderConfig } from '../types';

export const BORDER_COLOR_CLASSES: Record<BorderConfig['color'], string> = {
  'kingkiller-gold':       'border-kingkiller-gold',
  'kingkiller-gold-light': 'border-kingkiller-gold-light',
  'kingkiller-crimson':    'border-kingkiller-crimson',
  'kingkiller-arcane':     'border-kingkiller-arcane',
  'kingkiller-emerald':    'border-kingkiller-emerald',
  'kingkiller-stone':      'border-kingkiller-stone',
  'kingkiller-obsidian':   'border-kingkiller-obsidian',
  'kingkiller-white':      'border-kingkiller-white',
};

export const BORDER_WIDTH_CLASSES: Record<BorderConfig['width'], string> = {
  0: 'border-0',
  1: 'border',
  2: 'border-2',
  4: 'border-4',
};

export function borderCls({ color, width }: BorderConfig): string {
  if (width === 0) return 'border-0';
  return `${BORDER_WIDTH_CLASSES[width]} ${BORDER_COLOR_CLASSES[color]}`;
}
