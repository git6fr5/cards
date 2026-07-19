'use client';

import RajaTextField from '@/components/ui/RajaTextField';
import RajaDropdown from '@/components/ui/RajaDropdown';
import RajaButton from '@/components/ui/RajaButton';
import type { PieceFull, FilterState } from '../types';
import { EMPTY_FILTERS } from '../types';

interface CatalogFiltersProps {
  pieces: PieceFull[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

function distinctOptions(values: (string | number)[]): { value: string; label: string }[] {
  const unique = Array.from(new Set(values.map(String))).sort();
  return unique.map((value) => ({ value, label: value }));
}

export default function CatalogFilters({ pieces, filters, onChange }: CatalogFiltersProps) {
  function updateFilter(key: keyof FilterState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const archetypeOptions        = distinctOptions(pieces.map((p) => p.archetype));
  const roleTypeOptions         = distinctOptions(pieces.map((p) => p.role_type));
  const movementTypeOptions     = distinctOptions(pieces.map((p) => p.movement_type));
  const movementDistanceOptions = distinctOptions(pieces.map((p) => p.movement_distance));
  const actionCostOptions       = distinctOptions(pieces.map((p) => p.attributes.action_cost));
  const summonCostOptions       = distinctOptions(pieces.map((p) => p.attributes.summon_cost));
  const triggerTypeOptions      = distinctOptions(pieces.map((p) => p.trigger_type));
  const effectTypeOptions       = distinctOptions(pieces.map((p) => p.effect_type));

  return (
    <div className="flex flex-col gap-4">
      <RajaTextField
        id="catalog-search"
        label="Search"
        value={filters.search}
        onChange={(e) => updateFilter('search', e.target.value)}
        placeholder="Piece name"
      />
      <RajaDropdown
        id="filter-archetype"
        label="Archetype"
        placeholder="Any"
        options={archetypeOptions}
        value={filters.archetype}
        onChange={(e) => updateFilter('archetype', e.target.value)}
      />
      <RajaDropdown
        id="filter-role-type"
        label="Role Type"
        placeholder="Any"
        options={roleTypeOptions}
        value={filters.role_type}
        onChange={(e) => updateFilter('role_type', e.target.value)}
      />
      <RajaDropdown
        id="filter-movement-type"
        label="Movement Type"
        placeholder="Any"
        options={movementTypeOptions}
        value={filters.movement_type}
        onChange={(e) => updateFilter('movement_type', e.target.value)}
      />
      <RajaDropdown
        id="filter-movement-distance"
        label="Movement Distance"
        placeholder="Any"
        options={movementDistanceOptions}
        value={filters.movement_distance}
        onChange={(e) => updateFilter('movement_distance', e.target.value)}
      />
      <RajaDropdown
        id="filter-action-cost"
        label="Action Cost"
        placeholder="Any"
        options={actionCostOptions}
        value={filters.action_cost}
        onChange={(e) => updateFilter('action_cost', e.target.value)}
      />
      <RajaDropdown
        id="filter-summon-cost"
        label="Summon Cost"
        placeholder="Any"
        options={summonCostOptions}
        value={filters.summon_cost}
        onChange={(e) => updateFilter('summon_cost', e.target.value)}
      />
      <RajaDropdown
        id="filter-trigger-type"
        label="Trigger Type"
        placeholder="Any"
        options={triggerTypeOptions}
        value={filters.trigger_type}
        onChange={(e) => updateFilter('trigger_type', e.target.value)}
      />
      <RajaDropdown
        id="filter-effect-type"
        label="Effect Type"
        placeholder="Any"
        options={effectTypeOptions}
        value={filters.effect_type}
        onChange={(e) => updateFilter('effect_type', e.target.value)}
      />
      <RajaButton
        alt
        variant="action"
        text="Clear Filters"
        onClick={() => onChange(EMPTY_FILTERS)}
      />
    </div>
  );
}
