# Record: Ability DSL Translator

## Contents
1. [Breakdown of the engine's ability parser/resolver](#1-breakdown-of-the-engines-ability-parserresolver)
2. [Reusability scope and locked decisions](#2-reusability-scope-and-locked-decisions)
3. [Implementation and verification](#3-implementation-and-verification)

---

## 1. Breakdown of the engine's ability parser/resolver

### Context
User asked for a `/breakdown` of the backend engine's ability parser and how it translates into game effects, as prep for a frontend feature: a component that turns raw ability DSL text into human-readable text. Traced the mechanism: `engine/utils/parsers.py` (`parse_ability` + per-line parsers) turns a fixed 3-line DSL (Trigger/Effect/Target) into a `PieceAbility` dataclass; `engine/resolver.py` (`fire_trigger` → `resolve_targets` → `apply_effect`) applies it at runtime against real game events. `.context/engine_dsl_reference.md` (pre-existing doc) turned out to already have the full grammar spec (§2–7) plus worked card-text-to-DSL translations — sufficient on its own to build a frontend translator without reading the Python parser line by line.

### Discussion points
None — straightforward trace, confirmed via grep (`fire_trigger`/`resolve_targets`/`apply_effect` in `resolver.py`) before reporting.

### Decision
No code changes from the breakdown itself (read-only). Its output directly seeded the `/plan` that followed: since the grammar doc was already complete, the plan could scope straight to "full grammar coverage in one pass" instead of a phased MVP.

---

## 2. Reusability scope and locked decisions

### Context
User explicitly asked the component be "extremely reusable" — not catalog-specific — since ability text display will show up on multiple pages. Survey found `piece.ability` (the raw DSL string) is currently only rendered raw in `PieceDetailCard.tsx`; a second candidate call site (`PieceToken`'s `AbilityText.tsx`, engraving text along the coin's SVG rim) was found and explicitly ruled *out* of scope — that's decorative arc text, not a readable description, and forcing 3-line structured prose into it would break its visual design.

### Discussion points
Six scope questions were asked and answered, refining as follows:
- **Split**: pure translation logic (`frontend/utils/abilityTranslator.ts`, no JSX, named exports) separate from a thin rendering atom (`components/ui/RajaAbilityText.tsx`) — confirmed, for testability and reuse outside React.
- **Grammar coverage**: full grammar in one pass (all trigger conditions, effect ops, target/zone forms, filters, patterns) rather than a phased MVP — confirmed, made easy by the existing reference doc.
- **Fallback behavior**: an unrecognized line renders in red (reusing the existing `text-raja-chrome-error` token, no new color) rather than crashing or silently showing nothing — user's reasoning was that a translation gap should be visually obvious.
- **Empty ability**: renders nothing (`null`), not a placeholder string.
- **Output shape**: stays 3-line structured (`{ trigger, effect, target }`, each `{ text, isFallback }`) rather than collapsed into one sentence — mirrors the DSL's own shape so callers can lay out/style each line independently. Pattern tokens (`SQUARE 1`, `CROSS 2`) explicitly stay literal in the target line rather than being turned into prose — user corrected an early draft example ("nearby") back to the literal enum form.
- **Filter verbosity**: spelled out in full prose (`ARCHETYPE:DRAGON ATT:SUMMON_COST<=2` → "dragons with summon cost 2 or less") — user approved this exact phrasing when proposed.

### Decision
Plan wri­tten and saved to `.context/builds/ability_translator_plan.md` before building, per the `/plan` → `/build` handoff. One edge case was flagged but deliberately left unresolved rather than asked about: a non-empty ability with a line count ≠ 3 (shouldn't happen since the backend parser already validates it, but the TS translator is a separate implementation that could drift) — defaulted to rendering the whole raw DSL as a single red fallback line.

---

## 3. Implementation and verification

### Context
Built in slice order per the plan: `abilityTranslator.ts` (pure functions: `translateTrigger`/`translateEffect`/`translateTarget`/`translateZone`/`translateFilters`, each falling back to raw-line-plus-flag on an unrecognized shape) → `RajaAbilityText.tsx` (renders the 3 lines, red for fallback, `text-raja-chrome-text` otherwise) → migrated `PieceDetailCard.tsx`'s raw `{piece.ability}` paragraph to `<RajaAbilityText dsl={piece.ability} />`.

### Discussion points
- Caught mid-build: the ability text was previously `font-monospace` (leftover from when it displayed raw DSL). Per `frontend_typography.md`, monospace is explicitly wrong for prose ("hurts readability outside numeric contexts") — switched to `font-sans-serif` now that the content is translated human sentences, not tabular DSL.
- Verified with a throwaway `tsx` script (no dev server, no DB — pure function calls, allowed under the standing constraints) against all 6 canonical worked examples from `engine_dsl_reference.md` §9a (Baby Dragon, Dragon Prince, Goblin Bomber, Goblin Cheerleader, Goblin Pit's building-activate form, Dragon King) plus edge cases (empty string → `null`, all-3-lines-garbage → each line falls back independently rather than the whole ability going red). All matched expectations; script deleted after.

### Decision
Shipped as planned, no scope cuts needed — full grammar coverage held up against every canonical example without requiring the "safe cut" fallbacks (raw `WHERE` clause, skeleton-only trigger/effect/target) that were pre-planned in case filter/zone translation proved too heavy.
