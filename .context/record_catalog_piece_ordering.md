# Record: Catalog Piece Ordering

## Contents
1. [Chess-rank ordering within archetype groups](#1-chess-rank-ordering-within-archetype-groups)

---

## 1. Chess-rank ordering within archetype groups

### Context
`/catalog`'s grid groups pieces by archetype, then sorted each group by `summon_cost` then name.
User wanted a more chess-flavored ordering instead: King first, then by movement pattern in
classic chess-piece order — Queen-like (`SQUARE`), Rook-like (`CROSS`), Bishop-like (`DIAGONAL`),
Pawn-like (`FORWARD`) — with `summon_cost`/name kept as the tiebreak within each tier.

### Discussion points
- Where do immobile/building pieces (`movement_type: NONE` — the `TURRET`/`ON ACTIVATE` family)
  land, since they weren't in the given King/Queen/Castle/Bishop/Pawn list? User confirmed last —
  buildings are their own separate thing, not part of the chess-piece analogy.

### Decision
`frontend/app/(protected)/catalog/_components/CatalogGrid.tsx`: added `MOVEMENT_ORDER` (`SQUARE:0,
CROSS:1, DIAGONAL:2, FORWARD:3, NONE:4`) and a `pieceOrderRank` helper (King via
`KING_ROLE_TYPE` → `-1`, else its movement tier). `groupByArchetype`'s per-group sort now ranks by
this first, falling back to the existing `summon_cost` then name comparator within a tier.

Verified: `tsc --noEmit` clean (same pre-existing unrelated `.next` error on
`(protected)/play/page.js` ignored). No dev server started, no DB access.
