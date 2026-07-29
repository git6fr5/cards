# Record: Bag Composition Rules

## Contents
1. [Backend-enforced deck-building rules, default deck restructure](#1-backend-enforced-deck-building-rules-default-deck-restructure)
2. [seed_game.py regression: hardcoded bag name, fixed with deterministic random pick](#2-seed_gamepy-regression-hardcoded-bag-name-fixed-with-deterministic-random-pick)
3. [Default bags never actually conformed to the new caps — rebalanced](#3-default-bags-never-actually-conformed-to-the-new-caps--rebalanced)

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

---

## 3. Default bags never actually conformed to the new caps — rebalanced

### Context
User asked to rework the default bags to follow the actual bag-building rules. Checked
`bag_0.txt`/`bag_1.txt`/`bag_2.txt` (section 1's replacements for `dragon`/`goblin`/`warlock`)
against `validate_bag_composition` and found all three had been hand-picked for "rough archetype
variety" without ever being run against the rules they were meant to demonstrate — each violated
at least one bucket cap despite landing on the correct total (27/27/26).

`bag_0`: square bucket at 4 (cap 2) from `Berserker Witch`+`Chieftess Berserker`+`Windwalker
Soldier`×2, and diagonal at 6 (cap 4) from `Whiplash Soldier`+`Storm Berserker`+`Exploding
Nomad`×2 each.
`bag_1`: pawn bucket at 22 (cap 16) — four extra pawn-bucket pieces (`Adrenaline Turret`,
`Graveyard Turret`, `Reaper Statue Demon`×2, `Golem Trap`×2) stacked on top of already-capped
`Impish Soldier`×8 + `Goblin Vanguard`×8.
`bag_2`: pawn bucket at 19 (cap 16) — `Summoning Turret` + `Giant Trap`×2 stacked on top of
already-capped `Salt Timekeeper`×8 + `Hobgoblin Vanguard`×8.

### Discussion points
Draft went through two rounds. First pass fixed the bucket violations by trimming overflow pieces
and backfilling freed slots from underused buckets (cross/diagonal), landing on 27/25/26 — user
then said all three must be exact 27. Second pass filled the remaining headroom: both `bag_1` and
`bag_2` only had room left in the square bucket (cross/diagonal/pawn already at cap), so each got
topped up with two distinct square-bucket pieces at the per-name cap of 1 (`bag_1`: `Windwalker
Soldier` + `Berserker Witch`; `bag_2`: `Windwalker Soldier` + `Chieftess Berserker`) — cross-
archetype borrows, consistent with `bag_0` already mixing Soldier pieces into a Berserker-flavored
deck.

### Decision
**`bag_0.txt`** (Berserker-flavored): dropped `Chieftess Berserker`'s extra square slot and
`Exploding Nomad` entirely; added `Divine Berserker`×2 + `Warden Berserker`×2 to fill the cross
bucket. Final: King 1, square 2 (`Witch`+`Chieftess`), cross 4 (`Divine`+`Warden`), diagonal 4
(`Whiplash`+`Storm`), pawn 16 (`Bob Bob`+`Royal`) = 27.

**`bag_1.txt`** (Nomad-flavored): dropped `Adrenaline Turret`, `Graveyard Turret`, `Reaper Statue
Demon`, `Golem Trap` (all pawn-bucket overflow); added `Wandering Ghost`×2 (diagonal) and
`Exploding Nomad`×2 (cross) to use the freed headroom, then `Windwalker Soldier`+`Berserker
Witch` (1 each) to fill the square bucket to exactly cap. Final: King 1, square 2, cross 4
(`Good News Nomad`+`Ghost`), diagonal 4 (`Nomad Priest`+`Exploding`), pawn 16 (`Impish`+`Goblin`)
= 27.

**`bag_2.txt`** (Timekeeper-flavored): dropped `Summoning Turret`, `Giant Trap` (pawn overflow);
added `Whiplash Soldier`×2 (diagonal) to fill that bucket to cap, then `Windwalker
Soldier`+`Chieftess Berserker` (1 each) to fill square to cap. Final: King 1, square 2, cross 4
(`Suave Soldier`+`Dying Timekeeper`), diagonal 4 (`Colossal Soldier`+`Whiplash`), pawn 16
(`Salt Timekeeper`+`Hobgoblin Vanguard`) = 27.

Verified (DB-free, per the standing ban): ran `validate_bag_composition` directly against all
three rewritten files using real catalog data loaded from disk (`load_catalog()`, no DB
engine/session) — all three report `total=27` with zero violation flags.
