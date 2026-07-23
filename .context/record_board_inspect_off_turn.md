# Record: Board Inspect Off-Turn

## Contents
1. [Highlight overlay sizing](#1-highlight-overlay-sizing)
2. [Non-mutable board/shelf actions blocked off-turn](#2-non-mutable-boardshelf-actions-blocked-off-turn)

---

## 1. Highlight overlay sizing

### Context
Selection/highlight overlay on board squares (`BoardSquare.tsx`) was rendered `absolute inset-0` — exactly the same size as the square itself, no visible margin against the square edge.

### Discussion points
None — straightforward sizing fix, no disagreement.

### Decision
Changed overlay to `inset-1`. Confirmed via `tailwind_rules.md` that no project spacing tokens exist (`globals.css` only defines color tokens), and the square itself (`w-28 h-28`) already uses a raw value — so a raw `inset-1` is consistent with existing convention, not a token gap.

---

## 2. Non-mutable board/shelf actions blocked off-turn

### Context
User wanted to inspect pieces (read-only: describe ability, show legal moves) even when it isn't their turn — e.g. reading an enemy piece. Investigation found the block existed in two independent places:

- **Frontend:** `BoardSquare.tsx`'s `canInspect` and `PlayerShelf.tsx`'s `canInteract` both gated the read-only click path on `isActivePlayer`, alongside the (correctly gated) mutating drag path.
- **Backend:** `/preview` (`preview.py`) had **no auth dependency at all** — anyone unauthenticated could call it. Worse, `read_raw_input` (`input_parser.py`) always bound the parsed command's handler to `game.players[game.active_player_index]` — i.e. every preview request, regardless of who actually sent it, executed as if the *active* player asked. This meant:
  - Reading an enemy piece "worked" only by coincidence (the active player owns it, so ownership checks in `show()` passed).
  - Reading your own piece off-turn produced a wrong "Not your piece!" toast, because `self` resolved to the opponent (active player), not the true requester.

The real mutating endpoint (`crud.py`) already did this correctly via `require_game_active_player_access`, and a turn-agnostic, seat-verified dependency (`require_game_access`, returning `GameAuthContext.seat_index`) already existed in `play/auth.py` — unused by `preview.py`.

### Discussion points
- Considered whether fixing this needed new backend infrastructure. It didn't — `require_game_access` already existed and was the exact shape needed; the fix is wiring, not new auth logic.
- Flagged as a side effect: fixing `preview.py`'s auth is a *tightening* (previously-reachable unauthenticated calls now 401/403), not purely a bugfix — called out explicitly since it changes external behavior.
- Flagged a related latent bug: `PlayerShelf.tsx`'s shelf-read gate (`S{n}#`) had the identical shape. User confirmed: fix it too, same pattern (`canInteract` split into `canDrag` for the mutating drag path, and the read-click gated on `isOwn` alone).
- Called out a visible behavior change once `viewer_index` is threaded correctly: inspecting an **enemy** piece off-turn will no longer show its legal-move highlight (since `show()`'s `self.owns(piece)` now correctly evaluates against the true requester, who doesn't own it) — the `#` read (ability description) still succeeds either way. User accepted this as correct behavior, not a regression.

### Decision
Threaded an optional `viewer_index` parameter through `read_raw_input` → `dispatch_input`, defaulting to `game.active_player_index` when omitted (preserves `loop.py` and internal log-replay behavior untouched). Wired `preview.py` to `Depends(require_game_access)` and passed `viewer_index=auth.seat_index`. Loosened `BoardSquare.tsx`'s `canInspect` and split `PlayerShelf.tsx`'s `canInteract` into `canDrag`/read-click, matching the pattern already used for board squares.

Full plan: `.context/builds/board_inspect_off_turn_plan.md`.
