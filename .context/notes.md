---
name: Project Notes
description: Key game mechanics and design decisions not obvious from the code
type: project
---

## Token System

Tokens are the primary game pieces on the board. Each token is a circle.

**Visual design:**
- Token body: white or black (player/faction distinction)
- Token border: thick, colored by archetype
- Archetype color is the primary visual identity of the token

**Movement (3×3 matrix):**
- Each cell value = number of steps the token can move in that direction per turn
- Value 0 = cannot move in that direction; value N = can move N steps
- Displayed as N stacked Triangle icons in the corresponding direction around the token
- Token at center [1][1]; surrounding 8 cells map to the 8 directions

**Effects (3×3 matrix):**
- Applied to enemy tokens at end of turn, based on their position relative to this token
- Displayed on a 5×5 grid with the token at center; effect icons on tiles where the effect applies
- Inner 3×3 of the 5×5 is the effect area; outer ring is spatial context only

**Known effects:**
- `freeze` — enemy token in that tile cannot move next turn (Snowflake icon, blue)
- `fear` — mechanic TBD (Ghost icon, red)

**Known archetypes:**
- `GOBLIN` — green #16A34A
- `DRAGON` — red #DC2626

---

## Effect System (backend)

Effects are stored as a structured DSL string on each piece. The game loop parses and dispatches them server-side. No user-selected targeting — all targeting is deterministic from the DSL.

### DSL format

```
ON <TRIGGER> [PARAMS]
TARGET <SELECTION> [N], [FILTER], [ZONE]
<EFFECT_1> [PARAMS]
<EFFECT_2> [PARAMS]
...
```

Multiple effects after `TARGET` execute sequentially. Each effect line is a separate operation applied to the resolved target set.

### Triggers

| Key | When it fires | Params |
|-----|--------------|--------|
| `ON KILL` | This piece kills another | — |
| `ON DEATH` | This piece is killed | — |
| `ON MOVE` | This piece moves | — |
| `ON SUMMON` | This piece enters the board | — |
| `ON ACTIVATE` | Player manually activates | — |
| `ON TURN END [N]` | End of every Nth turn survived, modulo (default 1 = every turn) | N = turns survived modulo period |
| `ON PROMOTION` | Piece reaches the far rank | — |

**Rationale:** `ON ACTIVATE` is an explicit player-initiated action — separates passive auras from deliberate activated abilities. `ON TURN END N` allows timed transformations (Dragon Egg hatches after surviving 2 turns) without a separate counter field on the piece.

### Target spec

**Zone** — where to look:
- `BOARD` — pieces currently on the board
- `SHELF` — player's active hand (scrabble-shelf metaphor)
- `BAG` — player's draw pool (token bag / deck)
- Compositions: `BOARD | SHELF`, `SHELF | BAG`, etc.

**Selection** — which pieces from the zone:
- `SELF` — the piece that holds this effect
- `ALL` — every piece in the zone (after filters)
- `MATRIX [[r,r,r],[r,c,r],[r,r,r]]` — board tiles relative to this piece; 1 = included, 0 = excluded, center is SELF position
- `SPECIFIC <token_name>` — a named token type
- `RANDOM <n>` — n pieces chosen at random
- `MOST EXPENSIVE <n>` — n pieces with highest summon cost
- `LEAST EXPENSIVE <n>` — n pieces with lowest summon cost

**Filters** (applied after selection, combinable):
- `ARCHETYPE <value>` — e.g. `ARCHETYPE DRAGON`, `ARCHETYPE NOT GOBLIN`
- `SUMMON COST <op> <n>` — e.g. `SUMMON COST > 3`
- `MOVEMENT COST <op> <n>`
- `MOVEMENT COUNT <op> <n>`

### Effects (operations)

| Effect | Signature | Notes |
|--------|-----------|-------|
| `KILL TARGET` | `kill(target)` | Removes piece from board |
| `SUMMON <token_name>` | `summon(token, player, position)` | Position inferred or adjacent to self |
| `PUT <ZONE>` | `put(target, player, zone)` | `ZONE` ∈ `BOARD`\|`SHELF`\|`BAG`. Re-owns target to the acting player. `PUT BOARD` lands in the first free back-rank cell (P0: row 0→7, P1: row 7→0; cols L→R). Bare `PUT` defaults to `SHELF`. |
| `SUMMON COST TARGET <delta> TURNS <n>` | `set_attribute(target, 'summon_cost', delta, turns)` | Buff/debuff to summon cost |
| `MOVEMENT COUNT <delta> TURNS <n>` | `set_attribute(target, 'movement_count', delta, turns)` | Buff/debuff to movement count |

**TURNS param rationale:** Always explicit for now. `TURNS 99` approximates a permanent buff. Will add a `PERMANENT` keyword once the revert system is in place, but keeping it explicit during early development avoids hidden state bugs.

### Engine functions

```python
# Called once per piece per game event
check_effect_trigger(piece, effect_string, current_trigger_enum)
  -> parse_trigger(effect_string)
  -> if match: trigger_function(**trigger_params)

# Each trigger function resolves targets then applies effects
on_turn_end(piece, board, shelf, bag, turn_requirement, effect_string, target_spec)
  -> if piece.turns_survived < turn_requirement: return
  -> targets = select_target(piece, board, shelf, bag, target_spec)
  -> apply_effect(targets, effect_string)

# Parses and dispatches effect lines sequentially
apply_effect(targets, effect_string)
  -> parse_effects(effect_string)  # -> [(fn, params), ...]
  -> for each (fn, params): fn(**params)
```

### Examples

**Dragon Egg** — transforms after surviving 2 turns:
```
ON TURN END 2
TARGET SELF
KILL TARGET
SUMMON BABY DRAGON
```

**Dragon King (on activate)** — reduce cost of most expensive dragon in hand by 1:
```
ON ACTIVATE
TARGET MOST EXPENSIVE 1, FILTER ARCHETYPE DRAGON, ZONE SHELF
SUMMON COST TARGET -1 TURNS 99
```

**Ancient Dragon** — freezes all adjacent enemies each turn end:
```
ON TURN END
TARGET MATRIX [[1,1,1],[1,0,1],[1,1,1]], ZONE BOARD
MOVEMENT COUNT -99 TURNS 1
```

**Dragon Queen** — adds Dragon Egg to hand on kill:
```
ON KILL
TARGET SELF, ZONE SHELF
SUMMON DRAGON EGG
```
*(SUMMON to SHELF = add a copy of Dragon Egg to hand, not board)*

**Storm Dragon** — returns itself to hand on kill:
```
ON KILL
TARGET SELF
PUT SHELF
```

**Divine Dragon** — win after 4 kills (tracked via a separate `kill_count` field on piece):
```
ON KILL
TARGET SELF
WIN GAME IF KILL COUNT >= 4
```
*(WIN GAME IF is a conditional effect — will need parser support)*

---

## Open design questions

- Position inference for `SUMMON` when no position is specified: adjacent cell, same cell, or prompt? → deferred
- `ON ACTIVATE` targeting rules when selection is not SELF: **resolved** — **building** activations take an explicit player-selected target (the `@target` in move input); the building stays put and resolves its effect seeded from the chosen square (e.g. a `MATRIX` centered on the target, not on the building). **Units** get no separate target pick — their targeting is coupled to the move destination, if they have user targeting at all.
- TURNS revert system: how to clean up expired buffs cleanly at turn end → deferred, using TURNS 99 as stand-in
- Selection when a `ZONE` target has fewer candidates than requested `count`: **resolved** — random-N (`random.sample`, capped at available candidates), not take-first-N.
- `BAG:SEE:N` semantics: **resolved** — the bag has no ordering concept, so `SEE` is not modeled as a separate reveal step for now. `BAG:SEE:N` resolves identically to picking `N` random pieces directly from the bag (same random-N selection as above); the `SEE` sub-token is parsed but not given distinct resolution semantics yet.

---

## Frontend — Drag and drop

All drag-and-drop UI is standardizing on `@dnd-kit` (`@dnd-kit/core`, `+ @dnd-kit/sortable` where reordering is needed) — decided while building the `/catalog` page's catalog→bag drag interaction. `Board.tsx`/`BoardSquare.tsx`'s existing native HTML5 `draggable`/`dataTransfer` drag (board square → board square) predates this decision and is the one remaining holdout; it migrates to `dnd-kit` too when it's next touched, rather than staying as a second, inconsistent DnD implementation long-term.
