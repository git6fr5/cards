export type { PieceAttributes, PieceFull, Bag } from '@/app/_components/types';
export { KING_ROLE_TYPE } from '@/app/_components/types';

export type AbilityViewMode = 'dsl' | 'text' | 'icons' | 'icons2';

export interface FilterState {
  search: string;
  archetype: string;
  role_type: string;
  movement_type: string;
  movement_distance: string;
  action_cost: string;
  summon_cost: string;
  trigger_type: string;
  effect_type: string;
}

export const EMPTY_FILTERS: FilterState = {
  search: '',
  archetype: '',
  role_type: '',
  movement_type: '',
  movement_distance: '',
  action_cost: '',
  summon_cost: '',
  trigger_type: '',
  effect_type: '',
};

