---
name: Ability DSL Reference
description: How the engine's piece-ability DSL parser works, how to write in it, and worked translations from card descriptions to DSL
type: project
---

# Ability DSL Reference

The piece **ability** language and the **pattern** (movement) language are parsed in
[`engine/utils/parsers.py`](../engine/utils/parsers.py). This doc explains the grammar,
how the parser turns text into typed objects, and translates each card's plain-English
effect into DSL (with the gaps called out).

> Status note: **parsing** is fully implemented. **Resolution** (actually applying a
> parsed ability during play) is still stubbed in `engine/resolver.py`, so the runtime
> *semantics* below describe intent, not yet-live behaviour.

---

## 1. The shape of an ability

Every ability is **exactly three non-blank lines**, in this fixed order:

```
<TRIGGER>      # when it fires
<EFFECT>       # what it does
<TARGET>       # who it does it to
```

`parse_ability()` strips blank lines and requires precisely 3 — anything else raises
`ValueError`. The three lines are parsed independently into a
`PieceAbility(trigger_step, effect_step, target_step)`.

**General rules the parser applies to every line:**
- Input is upper-cased, so casing in the source doesn't matter.
- Tokens are split on **spaces**; sub-tokens inside a zone are split on **colons** (`:`).
- Each parser is a `match`/`case` on the token shape. No matching case → `ValueError`
  (the DSL fails loud on anything malformed).

---

## 2. Trigger (line 1) — *when*

```
ON <CONDITION> <N> [WHERE <filter>]      # counter triggers
ON ACTIVATE                              # manual trigger (no N)
```

- `<N>` is a **modulo period**: the trigger fires whenever the counter attribute is an
  exact multiple of `<N>` (`attribute % N == 0`). Use **`1`** for "every time". **Confirmed
  decision** — resolves the earlier ambiguity between modulo, `>=` threshold, and
  consumed-on-fire readings.
- `[WHERE …]` optionally filters on the *firing* piece (see §5).
- `ON ACTIVATE` is special — player-initiated (buildings), takes **no** `N` or filter.

**Conditions** and the counter attribute each reads (`TRIGGER_ATTRIBUTE`):

| Condition | Fires when… | Counter attribute |
|---|---|---|
| `TURNEND` | end of a turn | `turns_on_board` |
| `MOVE` | the piece moves | `distance_moved_count` |
| `KILL` | the piece captures | `kill_count` |
| `DEATH` | the piece is captured | `death_count` |
| `SUMMON` | the piece enters the board | `summon_count` |
| `PROMOTION` | the piece is promoted | `promotion_count` |
| `ACTIVATE` | player activates (buildings) | — (manual) |

**King rule:** a king's ability fires when **any** of its owner's pieces meets the
condition (kings react to the whole army, not just themselves).

---

## 3. Effect (line 2) — *what*

| Syntax | Meaning |
|---|---|
| `KILL` | remove the target(s) from the board |
| `SUMMON <ALIGNMENT>` | summon a piece of that alignment |
| `PUT <ZONE>` | move the target into a zone (`BOARD` / `SHELF` / `BAG`) |
| `MODIFY <ATTR> <DELTA> TURNS <N>` | add a temporary modifier of `<DELTA>` to a numeric attribute for `<N>` turns |
| `CONVERT <FIELD> <VALUE>` | permanently change a type field (`ROLETYPE`/`ARCHETYPE`) to `VALUE` |
| `CONVERT <FIELD> <VALUE> TURNS <N>` | same, but only for `<N>` turns |

- `<DELTA>` is signed: `+1`, `-99`. `MODIFY` always requires `TURNS <N>`
  (use a big number like `99` for "permanent").
- `CONVERT`'s `<VALUE>` must be a member of that field's enum (`ROLETYPE` → `RoleType`,
  `ARCHETYPE` → `Archetype`); it's resolved to the enum at parse time.

---

## 4. Target (line 3) — *who*

```
SELF                                       # the piece holding the ability
DEFENDER                                   # the piece on the receiving end
<ALIGNMENT> <ZONE> <COUNT> [WHERE …]        # a query over a zone
```

- `DEFENDER` = the captured unit (on `KILL`/`DEATH`), or the unit a building activates on.
- The query form picks `<COUNT>` pieces of `<ALIGNMENT>` from `<ZONE>` that pass the filter.
- `<COUNT>` is an integer or `ALL` (parsed as `99`).

**Alignment:** `FRIENDLY` · `ENEMY` · `ANY`

**Zone** (colon-delimited sub-grammar, parsed by `parse_zone`):

| Zone | Meaning |
|---|---|
| `SHELF` | the player's hand |
| `BAG:SEE:<N\|ALL>` | the draw bag, seeing the top `N` |
| `BOARD:PATTERN:<PATTERN>:<SIZE>` | board tiles in a pattern around the piece (see §6) |

---

## 5. Filters (`WHERE …`)

Appended to a trigger or a zone-target. `WHERE ANY` (or no `WHERE`) means no filter.
Each space-separated criterion is one of:

- **Structure** — `<FIELD>:<VALUE>[|<VALUE>…]`
  e.g. `ARCHETYPE:DRAGON`, `ROLETYPE:UNIT|KING`.
  Filterable fields are the `PieceType` fields (`archetype`, `roletype`); values are
  uppercase enum members. Reads through `piecetype.get()`, so **active conversions count**.
- **Attribute** — `ATT:<NAME><OP><VALUE>`
  e.g. `ATT:SUMMON_COST<=2`. `<OP>` ∈ `<` `<=` `>` `>=` `=`; the parser stores the actual
  `operator` function. `<NAME>` is a numeric `PieceAttributes` field, compared via the
  modifier-aware `attributes.get()`.

A piece passes a filter only if it satisfies **all** criteria (`Piece.satisfies_filters`).

---

## 6. Patterns (movement, king summoning, board target areas)

```
<PATTERN> <SIZE>      # e.g. CROSS 2
NONE                  # no tiles (immobile / buildings)
```

`parse_pattern` scales a base pattern outward by `<SIZE>` steps.

| Pattern | Base tiles |
|---|---|
| `CROSS` | 4 orthogonal neighbours |
| `DIAGONAL` | 4 diagonal neighbours |
| `FORWARD` | one step in `+y` |
| `SQUARE` | `CROSS` + `DIAGONAL` (all 8 neighbours) |
| `NONE` | empty set |

Used by a piece's `movement`, a king's `summoning`, and the area inside
`BOARD:PATTERN:…` targets.

---

## 7. Enum quick reference

- **Archetype:** `DRAGON`, `GOBLIN`
- **RoleType:** `UNIT` (captures enemies), `CANNIBAL` (captures anyone), `PACIFIST`
  (captures no one), `BUILDING` (activates instead of moving), `KING`
- **Alignment:** `FRIENDLY`, `ENEMY`, `ANY`
- **Zone:** `BOARD`, `BAG`, `SHELF`
- **Numeric attributes** (for `MODIFY` / `ATT:` filters): `summon_cost`, `action_cost`,
  `action_count`, `turns_on_board`, `kill_count`, `death_count`, `promotion_count`,
  `summon_count`, `actions_performed_count`, `distance_moved_count`

---

## 8. How a line becomes an object

```
"ON KILL 1"        --parse_trigger_line-->  TriggerStep(KILL, {attribute, value, filters})
"MODIFY ... TURNS" --parse_effect_line--->  EffectStep(MODIFY, {attribute, delta, turns})
"FRIENDLY SHELF 1" --parse_target_line-->   TargetStep(ZONE, {alignment, zone, count, filters})
```

Each parser upper-cases, splits, and matches token shape; zones recurse into
`parse_zone` (`:`-split), filters into `parse_filters` (regex for `ATT:`, `|`-split for
structure values). The result is a `PieceAbility` of three `*Step` dataclasses whose
`.params` dicts carry already-resolved enums / operator functions / position sets.

---

## 9. Worked examples — card text → DSL

### 9a. Canonical (live in the catalog, parse-verified)

**Baby Dragon** — *on promotion, summon a cheap dragon from the bag*
```
ON PROMOTION 1
SUMMON FRIENDLY
FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:DRAGON ATT:SUMMON_COST<=2
```

**Dragon Prince** — *on promotion, summon an expensive dragon from the bag*
```
ON PROMOTION 1
SUMMON FRIENDLY
FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:DRAGON ATT:SUMMON_COST>2
```

**Goblin Bomber** *(catalog placeholder ability)* — *every 3rd move, kill an adjacent piece*
```
ON MOVE 3
KILL
ANY BOARD:PATTERN:CROSS:1 1 WHERE ANY
```

**Goblin Cheerleader** — *every 3rd move, buff nearby goblins*
```
ON MOVE 3
MODIFY ACTION_COUNT +1 TURNS 1
FRIENDLY BOARD:PATTERN:SQUARE:1 ALL WHERE ARCHETYPE:GOBLIN
```

**Goblin King** *(king)* — *"first goblin summoned each turn gains +1 movement"*
```
ON SUMMON 1
MODIFY ACTION_COUNT +1 TURNS 1
FRIENDLY BOARD:PATTERN:SQUARE:1 ALL WHERE ARCHETYPE:GOBLIN
```
Approximations: "first per turn" → fires on every summon; "movement" → `ACTION_COUNT`
(an extra action, not extra reach); targets goblins around the king (king fires on any
friendly summon).

**Goblin Pit** *(building)* — *"trap a picked unit for 3 turns"*
```
ON ACTIVATE
MODIFY ACTION_COUNT -99 TURNS 3
DEFENDER
```
`movement: CROSS 1` is the building's activation reach; `DEFENDER` is the picked tile's
occupant. The "destroy self + drop the unit on this square" part is not expressible.

**Dragon King** *(king)* — *"when your dragons capture, cheapen a dragon in hand"*
```
ON KILL 1
MODIFY SUMMON_COST -1 TURNS 99
FRIENDLY SHELF 1 WHERE ARCHETYPE:DRAGON
```
"Most expensive" isn't a selection the DSL has → picks one dragon in hand. `TURNS 99` ≈ permanent.

**Ancient Dragon** — *"units within SQUARE 1 cannot move"*
```
ON TURNEND 1
MODIFY ACTION_COUNT -99 TURNS 1
ANY BOARD:PATTERN:SQUARE:1 ALL
```
Modeled as a turn-end refresh freeze. `FLYING` movement modifier dropped (unsupported).

### 9b. Rest of the goblin roster — translations & gaps

| Card | Description | DSL | Status |
|---|---|---|---|
| **Goblin Dummy** | "can't capture enemy units" | — | ✅ no ability needed: set `roleType: PACIFIST` |
| **Goblin Helper** | "when summoned, draw a goblin" | `ON SUMMON 1` / `PUT SHELF` / `FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:GOBLIN` | ✅ "draw" = `PUT SHELF` a bag goblin |
| **Goblin Bomber** *(card text)* | "if a unit captures this, kill the capturer" | `ON DEATH 1` / `KILL` / *(attacker)* | ⚠️ trigger+effect fine, but there's no **ATTACKER** target (only `DEFENDER` = the captured one) |
| **Goblin Magician** | "on capturing, turn a random card in opponent's hand into Hobgoblin" | `ON KILL 1` / *(transform→named)* / `ENEMY SHELF 1` | ❌ no "transform card into a **named** piece" effect (`CONVERT` only swaps enum fields) |
| **Hobgoblin** | "if promoted, grows into Goblin Knight" | `ON PROMOTION 1` / *(transform→named)* / `SELF` | ❌ no transform-into-named-piece effect |
| **Goblin's Mime** | "copy a picked unit" | — | ❌ no copy/become-target effect; no "pick a unit" targeting |
| **Goblin Golden Knight** | "on summon, summon a Goblin Knight in every surrounding empty tile" | `ON SUMMON 1` / *(named summon ×N)* / … | ❌ `SUMMON` takes an alignment, not a named piece, and can't fan out to empty tiles |
| **Goblin Knight** | *(token, no ability)* | — | ❌ `roleType: TOKEN` doesn't exist (enum has UNIT/CANNIBAL/PACIFIST/BUILDING/KING) |
| **Cave** | "units with <2 movement cost get SQUARE movement" | — | ❌ movement isn't a convertible field; no continuous AURA + conditional |
| **Salt Goblin** | "can be summoned around any friendly unit" | — | ❌ a summon-placement rule, not an ability (summoning patterns are king-only today) |
| **Goblin Engineer** | "swap places with an ally goblin" | `ON ACTIVATE` / *(swap)* / `FRIENDLY BOARD:… 1 WHERE ARCHETYPE:GOBLIN` | ❌ no SWAP effect |

### 9c. Capability gaps these surface (future DSL/engine work)

- **Transform into a named piece** (Hobgoblin, Mime, Magician, Golden Knight) — biggest recurring gap.
- **`ATTACKER` target** (Bomber) and **player-picked targets** (Mime, Engineer).
- **Named `SUMMON`** + multi-tile placement (Golden Knight).
- **`TOKEN` role** (Goblin Knight) and **convertible `movement`** / continuous auras (Cave).
- **Ordered selections** like "most expensive" (Dragon King).
- **Per-turn-once** conditions ("first goblin each turn").
- **Custom summon-placement rules** (Salt Goblin).
