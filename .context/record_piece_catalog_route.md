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
