# How to Play

## 1. Overview

A chess-like game mixed with trading card game elements + deck-building. 

2 players play on a 7×7 board, their turn consists of:
- Drawing pieces from their bag of pieces to their rack (reference: drawing scrabble tiles and putting it on your rack)
- Spending their mana adding pieces from their shelf onto the board, or moving pieces.
- Goal: kill the opposing player's king.

Each player has:
- King piece
   - Starts on the board.
   - If this dies lose the game.
   - Its ability reacts to the whole army, not just itself: fires whenever any of that player's pieces meets the trigger.
- Unit pieces
   - Every piece has its own movement shape.
   - Some abilities that trigger on events like moving/killing, being summoned, or reaching the far edge (promotion).
- Buildings
   - Never move.
   - Action is "activate" instead of move: target an adjacent square, fire the ability on whatever's there.

## 2. Example Movements

Movement patterns are described by a keyword and then their distance (e.g. `<pattern> <distance>`)

Examples: 
`SQUARE 1`

```text
┌───┬───┬───┐
│ ● │ ● │ ● │
├───┼───┼───┤
│ ● │ P │ ● │
├───┼───┼───┤
│ ● │ ● │ ● │
└───┴───┴───┘
```

`FORWARD 1`

```text
┌───┬───┬───┐
│   │ ● │   │
├───┼───┼───┤
│   │ P │   │
├───┼───┼───┤
│   │   │   │
└───┴───┴───┘
```

`CROSS 2`

```text
┌───┬───┬───┬───┬───┐
│   │   │ ● │   │   │
├───┼───┼───┼───┼───┤
│   │   │ ● │   │   │
├───┼───┼───┼───┼───┤
│ ● │ ● │ P │ ● │ ● │
├───┼───┼───┼───┼───┤
│   │   │ ● │   │   │
├───┼───┼───┼───┼───┤
│   │   │ ● │   │   │
└───┴───┴───┴───┴───┘
```

`DIAGONAL 2`

```text
┌───┬───┬───┬───┬───┐
│ ● │   │   │   │ ● │
├───┼───┼───┼───┼───┤
│   │ ● │   │ ● │   │
├───┼───┼───┼───┼───┤
│   │   │ P │   │   │
├───┼───┼───┼───┼───┤
│   │ ● │   │ ● │   │
├───┼───┼───┼───┼───┤
│ ● │   │   │   │ ● │
└───┴───┴───┴───┴───┘
```

Importantly, the piece must have some way of visually communicating how it moves (either through symbols or some other way) so the player can quickly scan the board and understand where everything could possibly go.

## 3. Example Abilities

Abilities are described by three things:
- `TRIGGER`: what causes it to activate
- `EFFECT`: what this does
- `TARGET`: what it hits

Examples Triggers:

- `ON KILL` - when this piece captures something
- `ON PROMOTION` - when this piece reaches the far rank
- `ON MOVE` - fires every 3rd time this piece moves

Example Effects:

- `MODIFY` - modify one of the targets attributes (e.g. summoning cost, move distance etc)
- `SUMMON FRIENDLY` - put a new friendly piece onto the board

Example Targets:

- `SELF` - the piece holding the ability
- `DEFENDER` - the piece just captured
- `BOARD` - a piece on the board

Put all together:

```text
ON PROMOTION
KILL
ENEMY BOARD:CROSS:1
```

-> "On promotion, kill an adjacent enemy."

Importantly, the piece must have some way of visually communicating what its ability is (either through symbols or some other way) so the player can quickly scan the board and understand what everything could possibly do.

---

## 4. Game Zones

- Bag:
  - Like a deck of pieces from where the player draws (like a scrabble bag)
- Shelf:
  - Like a hand, visible only to its owner, pieces waiting to be summoned (similar to scrabble or Ramika)
- Board:
  - For the pieces in play to sit (7x7), visible to both players

---

## 5. Piece Roles

These change *how* a piece is played, so they should be visually distinct (e.g. different piece shapes, borders etc, however you want to go about this).

- UNIT:
  - Normal piece, moves, can capture enemy pieces only
- BUILDING:
  - Can't moves. Instead is "activated" to fire its ability
- KING:
  - Moves, summons the army, dies means game over, its ability is triggered by any piece in the army
  - e.g. if the King's ability triggers when "on capture", then if any of your units capture another piece, the King's ability is triggered.

---

## 6. What a piece needs to communicate

Every piece is a circular coin token: that form factor is fixed (see
`.context/design_brief.md` for material/palette direction). Everything else
is open. A player scanning the board should be able to tell, at a glance,
for each piece:

- Which player owns it
- Its faction such as Dragon, Goblin (but I would prefer you come up with something more interesting/flavourful based in south asian mythos/fantasy)
- Its role (unit, building, king)
- Splash art / actual piece identifier (e.g. Baby Dragon vs Ancient Dragon) still need to look different from each other
- some hint of what kind of ability it has (e.g. trigger/effect symbols).
- summon cost
- movement shape

---

## 7. What I need from you

1. First step is to come up with some archetypes (replacing Dragon and Goblin), then for each archetype, a King, 2 or 3 pieces (just a name + some splash art) and maybe one building for the archetype
2. Ideally, very simple sketches for now so we can iterate with low friction
3. Once we've settled on 1 or 2 archetypes, then I'll come up with a few abilities for the characters you've created
4. Then we try and come up with the actual piece design which combines the mechanics + art (looking at section 6)

From there we can see what needs to happen after (but eventually we will need to check off the art for the below):

- Each game zone (board, shelf, bag)
- The game UI (mana display, how it sits in the page, how indicators work etc)
- Movement-range and ability-indicator overlays (sections 2 and 3)
