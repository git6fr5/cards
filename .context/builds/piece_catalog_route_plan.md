# Plan: piece_catalog_route

Feature: two new read routes on the `Piece` resource that return the full catalog definition (archetype, movement, ability, attributes) instead of the bare `{id, name}` `PieceResponse` — surfaced as a prerequisite while planning the `/catalog` frontend page (catalog browser + bag builder combined).

Locked 2026-07-19.

## Scope

**In:**
- `play/piece/crud.py`: `get_pieces_full` (`GET /pieces/full`, optional `names: list[str] | None` query filter — all pieces if omitted) and `get_piece_full` (`GET /pieces/full/{name}`) — both return the full catalog-backed `PieceFullResponse`.
- `play/piece/tools.py` (new file): `resolve_catalog_entries(names: list[str] | None) -> dict[str, dict]` — thin wrapper over `engine.loader.load_catalog()`, filtered by name when given. Extracted because both new handlers need it (extraction threshold: shared across handlers).

**Out (explicit):**
- No change to existing `read_pieces`/`read_piece`/`read_piece_by_name` — bare `PieceResponse` stays as-is for callers that only need identity.
- No change to `Bag`/`BagPiece` routes — already complete and correctly player-scoped.
- Frontend `/catalog` page itself — separate slice, resumes after this lands.

**Migration impact:** none — no ORM/model change, reads existing `Piece` rows + filesystem catalog JSON.

## Decisions (locked)

1. Function names `get_piece_full`/`get_pieces_full` (user-specified, deviates from the codebase's usual `read_{resource}` prefix — accepted as-is, same as `create_user_by_signup`'s earlier naming exception).
2. `get_pieces_full` takes `names: list[str] | None = Query(None)` — all pieces when omitted, matching the existing "optional `ids`/`names` list" idiom already used elsewhere (`general_rules.md` Artefact #2). 404 `piece_not_found` if any given name doesn't match a DB `Piece` row (mirrors `update_bag_pieces`'s existing validation shape).
3. Catalog lookup goes through a new `play/piece/tools.py`, not inline in `crud.py` — meets the extraction threshold (duplicated across both new handlers) and matches `backend_package_structure.md`'s rule that the pure-logic `engine` package is consumed via a sibling CRUD package's `tools.py`, not called directly from route files.
4. No integrity check between DB `Piece` rows and catalog JSON entries (e.g. a `Piece` row with no matching JSON file) — trusting the existing fixture-seeding invariant that ties them 1:1, per "don't validate what can't happen."
5. Response field naming stays snake_case per project convention even though the source JSON uses `roleType` — mapped explicitly in the route (`role_type=data["roleType"]`), not passed through as-is.
6. `PieceFullResponse` has no `can_target_own_pieces` field. It looked like missing data (4 of 9 catalog files lack the key) but `.context/engine_parser_consolidation_plan.md` + the live `engine/entities/piece.py` (`can_capture_allies` derives from `roletype == RoleType.CANNIBAL`) confirm the bool was already folded into the `RoleType` enum and is dead everywhere in `engine/`. "Can target own pieces" is just `role_type == "CANNIBAL"`, already covered by the `role_type` field — no separate field needed. The leftover key in the other 5 files is pre-refactor debris, not consumed here or anywhere.
7. Route placement: `GET /full` must be registered **before** `GET /{piece_id}` in the file — both are single static/dynamic segments, so registration order matters per the segment-collision rule. `GET /full/{name}` (2 segments) doesn't collide with anything and can sit next to it.

## Backend structure

```
backend/play/piece/crud.py   [edit]
  + PieceAttributesResponse, PieceFullResponse   (new response models)
  + get_pieces_full   (GET /full, before read_piece in file order)
  + get_piece_full    (GET /full/{name})
backend/play/piece/tools.py   [new]
  + resolve_catalog_entries(names: list[str] | None) -> dict[str, dict]
```

## Route inventory

| file | fn | method/path | preconditions |
|---|---|---|---|
| `play/piece/crud.py` | `get_pieces_full` | `GET /pieces/full` | 404 `piece_not_found` (any given name not in DB) |
| `play/piece/crud.py` | `get_piece_full` | `GET /pieces/full/{name}` | 404 `piece_not_found` |

## Frontend

None this slice — deferred to the `/catalog` page plan (next).

## Slice sequence

1. Backend: add `play/piece/tools.py` + the two new routes/models in `play/piece/crud.py`.
2. Commit.
3. Resume `/catalog` page planning (Step 2 — layout directions) against this route.

## Risk flags

- Segment collision: `GET /full` (static, 1 seg) vs `GET /{piece_id}` (dynamic, 1 seg) — must register `/full` first, per rule. `GET /full/{name}` (2 seg) and `GET /name/{name}` (2 seg) don't collide with each other (different literal first segment).
- `engine/` is not a shared path (only `backend/accounts`, `backend/utils` are) — no shared-sync concern for this build.

## Safe cuts

- Nothing meaningfully cuttable — both routes are needed (single + bulk), and the `tools.py` extraction is required by convention, not optional polish.
