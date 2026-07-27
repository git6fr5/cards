# Record: Bag Composition Rules

## Contents
1. [Backend-enforced deck-building rules, default deck restructure](#1-backend-enforced-deck-building-rules-default-deck-restructure)
2. [seed_game.py regression: hardcoded bag name, fixed with deterministic random pick](#2-seed_gamepy-regression-hardcoded-bag-name-fixed-with-deterministic-random-pick)

---

## 1. Backend-enforced deck-building rules, default deck restructure

### Context
`/trace`d the bag-builder to orient first: the only place deck-composition rules existed
(`MAX_BAG_SIZE`, `MAX_PER_PIECE`, `MAX_KING_QUANTITY`, `getBagRejectionReason` in
`frontend/app/(protected)/catalog/types.ts`) was a client-side pre-check on the catalog page's
drag-and-drop handler — the actual API route, `PUT /bags/{id}/pieces`
(`backend/play/bag/crud.py`), accepted any delta as long as the target piece existed and the
resulting quantity didn't go negative. A direct API call bypassed every rule. Confirmed by reading
the seed data too: `dragon.txt` alone seeds 23 pieces (1 King + 11 pieces ×2), already exceeding
the old frontend cap of 20 — the two sources of truth had already drifted.

User wanted this moved server-side and the three flavor-named default decks
(`dragon`/`goblin`/`warlock`) replaced with three generic `bag_0`/`bag_1`/`bag_2`, under a new
chess-budget rule set: King (max 1), Square/Queen-pattern (max 2, max 1/name), Cross/Rook (max 4,
max 2/name), Diagonal/Bishop (max 4, max 2/name), Forward+`NONE`/Pawn (max 16, max 8/name) — 27
total, replacing the old `MAX_BAG_SIZE` of 20.

### Discussion points
- Whether `NONE`-movement pieces and turrets both needed special-casing into the pawn bucket —
  clarified over two rounds: true `NONE`-movement pieces (just `Egg` currently) fold into pawn:
  turrets do *not* get a blanket override — they bucket by their actual `movement` field like
  everything else (most turrets are `SQUARE`, one — `Stun Turret` — is `CROSS`). No special-casing
  needed at all; the original plan (bucket purely by `movement_type`) was already correct.
- 27-piece cap: confirmed as the new ceiling (replacing `MAX_BAG_SIZE`), not a mandatory exact
  size — bags can still be built smaller.
- Default deck piece lists ("you pick") and error UX ("drop the frontend pre-check entirely, rely
  on the backend's rejection message") were both delegated to the assistant's judgment.
- Mid-build discovery, not part of the original plan: `frontend/utils/api.ts`'s throwing helpers
  (`get`/`post`/`put`/`del`/`postForm`/`postFormData`) discarded the response body on failure,
  throwing a generic `"PUT ... failed with status 422"` instead of the backend's actual `detail`
  message — meaning "toast the backend's rejection reason" wouldn't have worked without this fix.
  Treated as a necessary implementation detail of the already-approved plan (and squares with
  `general_rules.md`'s standing "error schema in `api.ts` matching HTTPException shape" convention,
  which none of these helpers previously followed) rather than a separate ask.

### Decision
**New `backend/play/bag/tools.py`** (named `tools.py` per the package-structure convention, not
`rules.py`): `KING_ROLE_TYPE`, `MOVEMENT_BUCKETS` (`SQUARE`/`CROSS`/`DIAGONAL`→own bucket,
`FORWARD`/`NONE`→`pawn`), `BUCKET_CAPS` (`(total_cap, per_name_cap)` per bucket), `MAX_KING_QUANTITY
= 1`, `MAX_BAG_SIZE = 27`, and `validate_bag_composition(pieces: dict[name, qty]) ->
dict[str, bool]` — buckets every piece via the existing `resolve_catalog_entries`/`parse_movement`
(`play/piece/tools.py`, unchanged) and returns 10 named violation flags.

**`backend/play/bag/crud.py`**: `update_bag_pieces` now computes the *resulting* full bag state
(existing untouched entries + this delta, zero-quantity entries dropped), calls
`validate_bag_composition`, and feeds every flag through the existing `assert_preconditions`
pattern — 10 new static-message `ERRORS` entries, all 422. `create_bag` untouched (an empty bag
never violates a ceiling).

**Default decks**: deleted `dragon.txt`/`goblin.txt`/`warlock.txt`, added `bag_0.txt`/`bag_1.txt`/
`bag_2.txt` under `backend/engine/.data/default_bags/` — each a full legal 27-piece deck (1 King +
2 Square + 4 Cross + 4 Diagonal + 16 Pawn), picked for rough archetype variety (Berserker-flavored,
Nomad/Demon-flavored, Soldier/Trap-flavored respectively). `backend/fixtures/seed_bag.py`:
`DEFAULT_BAG_NAMES = ["bag_0", "bag_1", "bag_2"]`.

**Frontend**: `frontend/app/(protected)/catalog/types.ts` — deleted `getBagRejectionReason`,
`MAX_BAG_SIZE`, `MAX_PER_PIECE`, `MAX_KING_QUANTITY`, and the now-dead `BagPiece` re-export (its
only consumer was the deleted function). `Catalog.tsx`'s `handleDragEnd` is now `async` — no
pre-check, `adjustPieceQuantity` always attempts the API call on a valid drop target; success and
failure both toast (success message unchanged, failure now shows the caught error's `.message`,
which — thanks to the `api.ts` fix — is now the backend's actual rejection reason).
`frontend/utils/api.ts`: every throwing helper now calls a new `errorDetail(response, fallback)`
that reads the response body's `detail` field (falling back to the old generic message if the body
isn't JSON or has no `detail`).

Verified (all DB-free per the standing ban): `py_compile` clean on all touched Python files;
`tsc --noEmit` clean on all touched/new TypeScript files (same pre-existing unrelated `.next`
error ignored); `validate_bag_composition` run directly against real catalog data loaded from disk
(no DB engine/session) — all three new default decks validate with zero violations at exactly 27
pieces each; hand-verified negative cases (two Kings, 2× same Square piece, 3× same Cross piece, a
28-piece bag) each correctly trip their expected violation flag.

---

## 2. seed_game.py regression: hardcoded bag name, fixed with deterministic random pick

### Context
User ran the dev server themselves (not run by the assistant, per the standing "never start the
dev server" rule) and pasted a startup log ending in `[startup] DB connection failed: 1` right
after the `bag`/`friend`/`game` seed steps printed. Diagnosed read-only, no DB access: `dev.py`'s
lifespan wraps engine init *and* `seed_dev()` in one bare `except Exception`, mislabeling any
startup exception — DB-related or not — as a connection failure.

Root cause: `fixtures/seed_game.py` hardcoded `SEAT_BAG_NAME = "Goblin"` to pick each seeded
player's seat bag. That name only existed because the *old* `seed_bag.py` capitalized
`"goblin"` → `"Goblin"` (section 1, before this session's rename). With `DEFAULT_BAG_NAMES` now
`["bag_0", "bag_1", "bag_2"]` → `"Bag_0"`/`"Bag_1"`/`"Bag_2"`, no bag is ever named `"Goblin"`
again, so `seat_bag_by_player_id` came back empty and `seat_bag_by_player_id[player.id]` raised
`KeyError(1)` for the first player — `str(KeyError(1)) == "1"`, exactly matching the log's
`": 1"`. A missed cross-file consequence of section 1's rename.

### Discussion points
First fix proposed: drop the hardcoded name, pick each player's *first* seeded bag via
`dict.setdefault` over `bags` (which `seed_bag` builds player-major, deck-order-minor, so the
first bag encountered per player is always their first default deck, whatever it's named).
User asked to go further — pick a *random* one of each player's bags instead of always the first,
specifically flagging that it should stay deterministic across seeding runs (a fixed random seed,
not true randomness) rather than leaving picks to vary run-to-run.

### Decision
In `backend/fixtures/seed_game.py`: replaced `SEAT_BAG_NAME`/the name-filtered dict comprehension
with `bags_by_player_id: dict[int, list[Bag]]` (every bag grouped per player, built via
`setdefault(bag.player_id, []).append(bag)`) and a module-level `SEAT_BAG_RANDOM_SEED = 0` feeding
`random.Random(SEAT_BAG_RANDOM_SEED).choice(player_bags)` per player — one shared seeded `Random`
instance across all players, deterministic since dict/list insertion order is stable. No bag name
is referenced anywhere in this file anymore; renaming decks or adding a 4th default bag both just
work.

Verified: `py_compile` clean. Functional check with fabricated in-memory `Bag`-like objects (no
DB session/engine) confirmed the same seed produces the same picks across repeated runs.
