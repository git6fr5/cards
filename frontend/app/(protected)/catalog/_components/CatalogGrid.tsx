import PieceCard from './PieceCard';
import type { PieceFull, AbilityViewMode } from '../types';
import { KING_ROLE_TYPE } from '../types';

interface CatalogGridProps {
  pieces: PieceFull[];
  abilityViewMode?: AbilityViewMode;
}

const MOVEMENT_ORDER: Record<string, number> = { SQUARE: 0, CROSS: 1, DIAGONAL: 2, FORWARD: 3, NONE: 4 };

function pieceOrderRank(piece: PieceFull): number {
  if (piece.role_type === KING_ROLE_TYPE) return -1;
  return MOVEMENT_ORDER[piece.movement_type] ?? MOVEMENT_ORDER.NONE;
}

function groupByArchetype(pieces: PieceFull[]): [string, PieceFull[]][] {
  const groups = new Map<string, PieceFull[]>();
  for (const piece of pieces) {
    const group = groups.get(piece.archetype) ?? [];
    group.push(piece);
    groups.set(piece.archetype, group);
  }
  for (const group of groups.values()) {
    group.sort((a, b) =>
      pieceOrderRank(a) - pieceOrderRank(b) ||
      a.attributes.summon_cost - b.attributes.summon_cost ||
      a.name.localeCompare(b.name),
    );
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default function CatalogGrid({ pieces, abilityViewMode = 'text' }: CatalogGridProps) {
  const groups = groupByArchetype(pieces);

  if (groups.length === 0) {
    return <p className="font-sans-serif text-sm text-raja-chrome-muted">No pieces match these filters.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map(([archetype, groupPieces]) => (
        <div key={archetype} className="flex flex-col gap-3">
          <h2 className="font-serif text-lg text-raja-chrome-text tracking-wide">{archetype}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4">
            {groupPieces.map((piece) => (
              <PieceCard key={piece.id} piece={piece} abilityViewMode={abilityViewMode} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
