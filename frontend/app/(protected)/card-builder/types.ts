export type Roundness = 'none' | 'sm' | 'md' | 'lg';

export type BorderColor =
  | 'kingkiller-gold'
  | 'kingkiller-gold-light'
  | 'kingkiller-crimson'
  | 'kingkiller-arcane'
  | 'kingkiller-emerald'
  | 'kingkiller-stone'
  | 'kingkiller-obsidian'
  | 'kingkiller-white';

export type BorderWidth = 0 | 1 | 2 | 4;

export interface BorderConfig {
  color: BorderColor;
  width: BorderWidth;
}

export type ArtInset = 0 | 1 | 2 | 3 | 4;
