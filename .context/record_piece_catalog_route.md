# Record: piece_catalog_route

## Contents

1. [Motivating gap — no full piece data reachable over HTTP](#1-motivating-gap--no-full-piece-data-reachable-over-http)
2. [get_pieces_full / get_piece_full — built](#2-get_pieces_full--get_piece_full--built)

---

## 1. Motivating gap — no full piece data reachable over HTTP

### Context
Resumed the three-page frontend plan (see `record_signup_flow.md` section 1) at page 2: a single protected page combining the piece catalog browser and bag builder. User locked the route as `/catalog`. Before planning layout, surveyed `play/bag/crud.py` and `play/piece/crud.py` against what a catalog/builder page would actually need.

`Bag`/`BagPiece` routes were already complete and correctly player-scoped (`create_bag`, `read_bags`, `update_bag_pieces` via `delta_pieces`, etc.) — no gap there. `Piece`, though, was the blocker: `GET /pieces` only returns `{id, name}` (bare reference row, per the `play_foundation` record's original design — real definitions were deliberately kept out of the DB, living instead in `engine/.data/catalog/**/*.json`). Nothing exposed the actual catalog fields (`archetype`, `movement`, `ability`, `attributes.summon_cost`, etc.) over HTTP outside an active game's `GameState` packing — no route a catalog-browsing page could call.

### Discussion points
Asked whether to extend `GET /pieces` in place or add something new. User specified the exact shape: add `get_piece_full(name)` and `get_pieces_full(names | None)` to `play/piece/crud.py`, returning the full piece JSON — accepted as-is (another `get_`-prefixed naming exception, same pattern as `create_user_by_signup`'s earlier deviation from the codebase's usual verb convention).

Planning the route surfaced `backend_package_structure.md`'s rule that a pure-logic package (`engine`) should be consumed via a sibling CRUD package's `tools.py`, not called directly from a route file — so `play/piece/tools.py` (new) wraps `engine.loader.load_catalog()` rather than importing it straight into `crud.py`.

### Decision
Scoped and built as `get_pieces_full`/`get_piece_full` (section 2). The `/catalog` page's layout/component planning resumes after this lands.

---

## 2. get_pieces_full / get_piece_full — built

### Context
Saved as `.context/builds/piece_catalog_route_plan.md`, then built via `/build`.

### Discussion points
- `get_pieces_full` (`GET /pieces/full`) takes `names: list[str] | None = Query(None)` — all pieces when omitted, matching the existing "optional list-of-names/ids" idiom already used elsewhere in the codebase (`general_rules.md` Artefact #2). 404s if any given name doesn't match a DB `Piece` row, mirroring `update_bag_pieces`'s existing validation shape.
- `get_piece_full` (`GET /pieces/full/{name}`) is the single-item counterpart.
- Route placement: `GET /full` had to be registered **before** the pre-existing `GET /{piece_id}` — both single-segment, one static one dynamic, so the segment-collision rule (`creating_backend_routes.md`) applies; `GET /full/{name}` (2 segments) doesn't collide with anything and sits next to it.
- Response fields stay snake_case per project convention even though the source JSON uses `roleType` — mapped explicitly (`role_type=data["roleType"]`) rather than passed through.
- **First pass wrongly treated a real refactor as a data gap.** Initially built with a `can_target_own_pieces: bool` field, defaulting via `.get(..., False)` after finding 4 of 9 catalog files (`goblin-king`, `goblin-pit`, `ancient-dragon`, `dragon-king`) lacked the key. User corrected: it wasn't missing data, it was already-completed migration — `can_target_own_pieces` was folded into the `RoleType` enum (`UNIT`/`CANNIBAL`/`PACIFIST`) per `.context/engine_parser_consolidation_plan.md`. Checked the live `engine/entities/piece.py`: `can_capture_allies` derives purely from `roletype == RoleType.CANNIBAL` (line 128) — the bool is read nowhere in `engine/`. The 4 "missing" files were actually the already-cleaned-up ones; the other 5 still carry pre-refactor debris (always `false`, never `true` in any file — consistent with a field on its way out, not one anyone still sets meaningfully). Removed `can_target_own_pieces` from `PieceFullResponse` entirely — "can target own pieces" is already recoverable as `role_type == "CANNIBAL"`, no separate field needed.
- No integrity check added between DB `Piece` rows and catalog JSON entries more broadly (e.g. a `Piece` row with no matching JSON file at all) — trusting the existing fixture-seeding invariant that ties them 1:1, per "don't validate what can't happen."

### Decision
Added `play/piece/tools.py` (`resolve_catalog_entries`) and, in `play/piece/crud.py`: `PieceAttributesResponse`/`PieceFullResponse` (`id`, `name`, `archetype`, `role_type`, `movement`, `ability`, `attributes`) models, `_pack_full_piece` helper, `get_pieces_full`, `get_piece_full`. Verified via `py_compile` plus a standalone script (bypassing the crud module's import chain, which is still blocked by the pre-existing missing `argon2-cffi` dependency — unrelated, not fixed here) that ran every one of the 9 real catalog entries through the exact field-mapping logic used in `_pack_full_piece` — all packed cleanly.

Open follow-up: the `/catalog` frontend page itself is still unbuilt — this build was backend-only.

### Follow-up — dead field removed from source data

User asked to also strip `can_target_own_pieces` from the 5 catalog JSON files that still carried it (`goblin-warrior`, `goblin-bomber`, `goblin-cheerleader`, `baby-dragon`, `dragon-prince`), now that it's confirmed dead per the discussion above. Removed the key from all 5; re-verified every catalog file still parses as valid JSON and `engine.loader.load_catalog()` still loads all 9 pieces cleanly. The 4 files that never had the key needed no change.

---

## 3. GET /games/tokens/preview folded in, then removed

### Context
While planning `/catalog`'s data flow, found `play/game/preview.py`'s `GET /games/tokens/preview` already returned every catalog piece with a pre-computed 3×3 movement grid (`_movement_grid` + `Piece.load_movement`) — overlapping `get_pieces_full`/`get_piece_full`, which had no such grid. Checked its only consumer via grep: `token-builder`'s `TokenBuilder.tsx`, a design/dev art-preview tool unrelated to bags or games.

### Discussion points
Two options offered: leave both routes and have the frontend combine them, or fold the grid logic into the consolidated route and delete the preview one. User picked the latter — fold in, then remove the preview route outright (not keep it as a thin wrapper), and migrate `token-builder` to the surviving route.

### Decision
- `play/piece/tools.py` gained `compute_movement_grid(movement: str) -> list[list[int]]` — ports `preview.py`'s grid logic into one function (single caller now).
- `PieceFullResponse` gained `movement_grid: list[list[int]]` alongside the existing raw-DSL `movement: str` — additive.
- `play/game/preview.py` deleted; `play/__init__.py`'s import + `include_router(game_preview_router, ...)` removed. Grepped afterward — no dangling references (the only other "preview" hits are the unrelated `play/action/preview.py`, a move-validation preview, not a token one).
- `token-builder/registry.ts`'s `TokenDefinition` interface updated to the new field names (`piece_type`→`role_type`, `movement`→`movement_grid`); `resolveTokenDefinition` maps them into the unchanged internal `TokenData` shape, so `TokenDisplay`/`TokenGrid`/`TokenBuilder`'s own internals needed no changes. `TokenBuilder.tsx`'s fetch moved from `/games/tokens/preview` (wrapped `{tokens: [...]}`) to `/pieces/full` (bare list) — the now-unused `TokensResponse` wrapper interface removed.

Verified: DB-free script re-ran all 9 catalog entries through the real grid-computation logic (all packed correctly); `tsc --noEmit` clean on the frontend changes; `py_compile` clean on all edited/added Python files.

---

## 4. Flat filter fields (trigger_type, effect_type, movement_type, movement_distance) + dnd-kit

### Context
Scoping the `/catalog` page's filters (movement_type, movement_distance, movement_cost, summon_cost, archetype, trigger_type, effect_type, roletype) surfaced that most map directly to existing fields (`archetype`, `role_type`, `attributes.summon_cost`), but `trigger_type`/`effect_type`/`movement_type`/`movement_distance` were buried inside the multi-line `ability` DSL and the `"<PATTERN> <SIZE>"` `movement` string — nothing flat to filter on.

### Discussion points
- Confirmed "movement_cost" was a misspeak for `attributes.action_cost` — no separate field exists or was intended.
- Locked: reuse the engine's real DSL parser (`Piece.load_ability()` → `trigger_step.condition`/`effect_step.operation`, both `str, Enum`) for trigger/effect type rather than hand-rolling string parsing in either Python or JS. `movement_type`/`movement_distance` have no dedicated engine parser (trivial `"<PATTERN> <SIZE>"` split) — plain split is fine, no need to invent one.
- Confirmed bag-rule enforcement (1 king, max 20 pieces, max 2 of same piece) is deliberately **frontend-only** for this pass — `update_bag_pieces` still has zero such checks. User wants backend enforcement **eventually**, explicitly not in this build; flagged as an open gap, not fixed.
- User floated `dnd-kit` for the catalog→bag drag interaction; confirmed no DnD library existed in `package.json` yet (`Board.tsx`/`BoardSquare.tsx` use plain native HTML5 `draggable`/`dataTransfer`). Recommended `dnd-kit` over stretching native DnD further, given this page's richer needs (filterable source → ordered drop target, touch support) — accepted. User separately decided **all** DnD should move to `dnd-kit` eventually, including `Board.tsx`'s native implementation; recorded as a project-wide decision in `.context/notes.md` (new "Frontend — Drag and drop" section), not actioned on `Board.tsx` itself in this build.

### Decision
- `play/piece/tools.py` gained `parse_ability_types(ability: str) -> tuple[str, str]` and `parse_movement(movement: str) -> tuple[str, int]`.
- `PieceFullResponse` gained `movement_type`, `movement_distance`, `trigger_type`, `effect_type` — all flat, computed in `_pack_full_piece`.
- Added `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` to `frontend/package.json`.
- `.context/notes.md` gained a "Frontend — Drag and drop" section recording the project-wide `dnd-kit` decision.

Verified: DB-free script ran all 9 real catalog entries through the actual parsing logic — trigger/effect/movement types matched the DSL reference doc's worked examples exactly (e.g. Goblin Pit → `ACTIVATE`/`MODIFY`). `py_compile` clean; `tsc --noEmit` clean after the `dnd-kit` install (moderate `npm audit` findings are pre-existing `next`/`postcss` transitive issues, unrelated to this change — not fixed, would require a breaking `next` downgrade).

Open follow-up: the `/catalog` page itself — layout, components, drag interaction — is still unbuilt.
