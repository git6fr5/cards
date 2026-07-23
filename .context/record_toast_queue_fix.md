# Record: Toast Queue Fix

## Contents
1. [Toast burying bug and queue-based fix](#1-toast-burying-bug-and-queue-based-fix)

---

## 1. Toast burying bug and queue-based fix

### Context
User reported: when multiple toasts fire at the same time, old ones get buried. Investigation
(via Explore agent) found the root cause: `RajaToast` (`frontend/components/layout/RajaToast.tsx`)
is a stateless presentational component, and every consumer held toast state as a single nullable
slot (`useState<{text, tone} | null>(null)`) — Catalog, Account, and PlayRoom (split across
`error`/`infoText`, combined via `error ?? infoText` in MainPanel). A new toast call always
overwrote the slot outright: no queue, no dedupe. `RajaToast`'s auto-dismiss timer is a `useEffect`
keyed on `[text, ...]`, so a new value tore down the old timer and started a fresh one for the
replacement — the old toast never displayed, it was silently replaced (not buried beneath, but
functionally the same visible symptom: lost message).

### Discussion points
Presented three fix options:
1. Convert `RajaToast` into a stacking `RajaToastStack` (array of toasts, own timer/offset each).
2. Central toast context/provider (`pushToast` from anywhere, single mounted instance).
3. Minimal patch — keep single-slot display, but queue overflow: new toasts wait in a queue and
   show serially, no stacking UI.

User picked option 3 (minimal, serialize only, no stacking visuals) via `/build`.

### Decision
Implemented option 3 as a small reusable hook, `frontend/hooks/useToastQueue.ts` — internal
`QueuedToast[]` array, exposes `{ active, push, dismiss }`. `active` is always `queue[0]`;
`dismiss` pops the front, promoting the next item automatically. `RajaToast` itself needed no
changes — its existing per-`text` `useEffect` timer already restarts correctly when `active`
changes to the next queued item.

Wired into all three toast-burying call sites named in scope:
- `Catalog.tsx` — replaced local `toast` state + `setToast` calls with the hook's `push`/`dismiss`.
- `Account.tsx` — same replacement in `handleStarted`/`handleError`.
- `PlayRoom.tsx` — bigger simplification: `infoText` state was only ever used to feed the
  `MainPanel` toast, so it was removed entirely in favor of `pushToast`. `error` state is kept
  (still needed for the pre-game "Game not found" fallback at line ~149), but is no longer piped
  into the toast merge — in-game action/preview failures now call `pushToast({tone: 'error', ...})`
  directly instead of `setError`, since by the time those handlers run `gameState` is guaranteed
  non-null (the `!gameState` fallback branch is unreachable from them). `MainPanel` prop shape
  changed from `infoText`/`error` to a single `toast: ToastItem | null`.

Verified with `npx tsc --noEmit` (clean, no errors) — DB-free per project rules, no dev server
started per project rules.
