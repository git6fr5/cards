# Record: Ability DSL Translator

## Contents
1. [Breakdown of the engine's ability parser/resolver](#1-breakdown-of-the-engines-ability-parserresolver)
2. [Reusability scope and locked decisions](#2-reusability-scope-and-locked-decisions)
3. [Implementation and verification](#3-implementation-and-verification)
4. [Wording rewrite: possessive zones and embedded filter line](#4-wording-rewrite-possessive-zones-and-embedded-filter-line)
5. [PUT effect wording — Black Dragon](#5-put-effect-wording-black-dragon)

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

---

## 4. Wording rewrite: possessive zones and embedded filter line

### Context
User pasted the Dragon Queen catalog entry (`ON KILL 1` / `SUMMON FRIENDLY` / `FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:DRAGON ATT:SUMMON_COST<=1`) and a screenshot of the rendered card, wanting the target line reworded: `FRIENDLY BAG` → "From your bag" instead of "1 friendly piece in the bag", and the `WHERE` filter moved onto its own line rather than a trailing parenthetical.

### Discussion points
Five scope questions were asked before touching the translator, since some options would have changed `RajaAbilityText`'s public output shape (a breaking change for its only other consumer, `PieceDetailPanel`):
- **Output shape**: user kept the existing fixed `{ trigger, effect, target }` object rather than switching to a variable-length `lines[]` array — "ditched the second line thing for filters." Resolved by embedding the `Where ...` clause as a literal `\n` *inside* the existing `target.text` (and `trigger.text`, symmetrically) string — `AbilityLine` already renders with `whitespace-pre-line`, so the embedded newline renders as its own visual line without any type/shape change at all.
- **Zone scope**: `SHELF` (hand) gets the same "From your/their hand" possessive treatment as `BAG`; `BOARD` (spatial, pattern-based) keeps its existing count/alignment-prefixed phrasing unchanged, since it isn't a possessed pool.
- **Count omission**: confirmed — the count number is omitted only when it's exactly `1` (matches Dragon Queen's `1` disappearing entirely); still shown for `>1` and `ALL`.
- **Wording**: comparators spelled out in full site-wide (`<=` → "less than or equal to", `>=` → "greater than or equal to", `>` → "greater than", was previously "X or less"/"X or more"/"more than X"). The attribute-name rename to "summoning cost" was proposed and then reverted — user preferred keeping the existing generic "summon cost" wording.
- Filter phrasing itself also changed shape (not just placement): from a plural noun-list ("dragons with summon cost 2 or less") to a subject-verb sentence ("the piece is a dragon with summon cost less than or equal to 1") — necessary once it became a standalone "Where ..." line rather than a parenthetical modifying a preceding noun.

### Decision
Rewrote `translateFilters` → `translateFilterSentence` (structure criteria now singular "a `{value}`" joined with "and"/"or" as needed, sentence-assembled as "the piece is X [with Y]"); split zone translation into a dedicated `translateZonePhrase` that branches on possessed-pool (`BAG`/`SHELF`, via a new `POSSESSIVE_WORDS` map: `your`/`their`/`any`) vs spatial (`BOARD`, unchanged style) zones; both `translateTrigger` and `translateTarget` now append `\n` + `Where {sentence}` when a filter is present, instead of the old `, limited to ...` / `(...)` forms. Also fixed a layout bug surfaced by this change: `AbilityLine`'s `<p>` had no width constraint inside its flex-column parent, so a now-longer two-line target string could overflow the card's fixed width instead of wrapping — added `w-full` to both the translated and raw-mode `<p>` elements in `RajaAbilityText`. Verified via a throwaway `tsx` script against Dragon Queen (exact match to the requested output) plus all prior canonical examples — none regressed.

---

## 5. PUT effect wording — Black Dragon

### Context
User showed a screenshot of Black Dragon (`ON KILL 1` / `PUT SHELF` / `DEFENDER`, rendering as "Every time this piece captures / Move the target to hand / The defending piece") and proposed rewording to "Move to your hand" / "the captured piece". Asked for a `/bullet 4 12` cost-and-issues rundown before touching anything.

### Discussion points
The bullet answer flagged two issues with renaming `DEFENDER`'s target phrase to "the captured piece": `DEFENDER` also means a building's activated-on piece (not always something captured), and `translateTarget` translates each line independently — it has no visibility into whether the paired trigger was `KILL`/`DEATH`, so it can't conditionally pick "captured" vs some other phrasing. No issue was raised against the `PUT` effect reword itself (it doesn't reference `DEFENDER` at all). User's response: keep "The defending piece" as-is for now, but proceed with the `PUT` reword.

### Decision
`PUT`'s effect line switched from `Move the target to ${zone}` to zone-specific phrasing: `SHELF` → "Move to your hand", `BAG` → "Move to your bag", `BOARD` → "Move to the board" (no possessive — the board isn't a per-player pool). `DEFENDER`'s target phrase left untouched. Note: `PUT`'s DSL carries no alignment token, so "your" is an assumption baked into the wording, not something read off the DSL — flagged, not resolved, since the user didn't push back on it.
