# Record: Berserker color reuse (dragon red)

## Table of contents
1. [Berserker adopts former dragon red](#1-berserker-adopts-former-dragon-red)

---

## 1. Berserker adopts former dragon red

### Context
Berserker's color (`#7F1D1D`, dark red) was a never-confirmed placeholder from the dragon archetype rework (see `.context/record_dragon_archetype_rework.md`). User asked whether the old Dragon archetype's red (`#DC2626`) could be reused for Berserker now that Dragon is fully retired from active play. Retirement was confirmed: no `DRAGON` member in `Archetype` enum, no dragon catalog folder, no dragon default bag file on disk.

Two unrelated stale references surfaced during the check and were flagged but left untouched (out of scope for this build):
- `backend/engine/loader.py:36` — CLI/debug-only fallback still calls `load_default_bag("dragon")`; would `FileNotFoundError` if exercised since `dragon.txt` no longer exists.
- `frontend/app/(open)/rules/_components/AbilitiesPanel.tsx:74-84` — stale "Dragon King" example string in a DSL illustration.

### Discussion points
None — straightforward reuse once retirement was confirmed.

### Decision
Set `Archetype.BERSERKER` color to `#DC2626` (former dragon red) in both mirror locations:
- `backend/engine/enums/archetype.py:23`
- `frontend/utils/archetypes.ts:22`

This resolves the previously-flagged "never confirmed" placeholder status for Berserker's color.

Open (not actioned this build): the two stale dragon references above remain in the codebase.
