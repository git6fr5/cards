---
name: Design Brief
description: Colour palette, feel, and design style for this project
type: project
---

## Aesthetic

Fantasy web-based trading card game meets online chess battle arena. Dark, dramatic, tournament-ready — the interface evokes a candlelit match at a gilded card table. Surfaces feel like dark velvet and aged stone; cards feel like parchment and hand-painted vellum; accents read as antique gold trim and chessboard detail.

**Tone:** competitive, atmospheric, slightly archaic. Clean enough to parse at speed; rich enough to feel like a game.

---

## Typography

**Primary:** EB Garamond — the project font. Serif, classical, slightly condensed at large sizes. Use `font-garamond` across the UI. Loaded via Google Fonts in `globals.css`.

---

## Colour Palette

### Core surfaces
| Token | Hex | Role |
|---|---|---|
| `kingkiller-black` | `#1A1225` | Primary dark — a deep aubergine-purple void. Body backgrounds, dark panels, modal backdrops |
| `kingkiller-obsidian` | `#2A1F3D` | Secondary dark surface — panel interiors, sidebar backgrounds. One step lighter than `kingkiller-black`, same purple family |
| `kingkiller-white` | `#F0EAD8` | Warm parchment — card faces, light panels, primary text on dark |
| `kingkiller-hover` | `#E4DCC8` | Parchment hover — subtle hover background on light surfaces |
| `kingkiller-stone` | `#4A3F5C` | Muted purple-grey — borders and dividers on dark surfaces |

### Text & muted tones
| Token | Hex | Role |
|---|---|---|
| `kingkiller-grey` | `#7A7060` | Primary muted text on light surfaces; captions, labels |
| `kingkiller-grey-muted` | `#9A9080` | Very muted; timestamps, metadata |
| `kingkiller-grey-light` | `#D8D0C0` | Subtle divider or ghost background on parchment |

### Accents
| Token | Hex | Role |
|---|---|---|
| `kingkiller-gold` | `#C9A84C` | Antique gold — card borders, trim, active highlights, primary accent, focus ring |
| `kingkiller-gold-light` | `#F0D880` | Shimmer gold — hover on gold elements |
| `kingkiller-emerald` | `#2D6A4F` | Forest green — the board/arena table colour (light square), success states |
| `kingkiller-emerald-dark` | `#1F4D38` | Deeper forest green — the board/arena table colour (dark square) |

### Player identity
| Token | Hex | Role |
|---|---|---|
| `kingkiller-steel` | `#B8C2CC` | Player 0 piece body — cool, light steel-grey. Paired with `kingkiller-black` text/icon |
| `kingkiller-gold-deep` | `#8C6D2F` | Player 1 piece body — a deeper, more bronzed gold than the accent `kingkiller-gold`, so the legal-move highlight ring stays visibly distinct against a gold-bodied piece. Paired with `kingkiller-white` text/icon |

### Status & game semantics
| Token | Hex | Role |
|---|---|---|
| `kingkiller-crimson` | `#A32030` | Blood red — attack, power, errors, destructive actions |
| `kingkiller-crimson-light` | `#F0D4D4` | Pale crimson — error backgrounds |
| `kingkiller-amber` | `#C8901C` | Amber — warning states, mana cost, resource cost |
| `kingkiller-amber-light` | `#F5E8C0` | Pale amber — warning backgrounds |
| `kingkiller-arcane` | `#5A3085` | Deep purple — magic, mystical, link colour |
| `kingkiller-arcane-light` | `#D0C0E8` | Pale arcane — mystical/info backgrounds |
| `kingkiller-blue` | `#3E6B99` | Muted sapphire — mana track (filled/available pips) |
| `kingkiller-blue-light` | `#B8CFE0` | Pale sapphire — mana-adjacent backgrounds |

---

## Functional token mapping

The design system uses `kingkiller-black` and `kingkiller-white` as the primary dark/light pair for all base component `alt` inversion (light-on-dark and dark-on-light). All `Kingkiller*` base components accept an `alt` boolean that flips between this pair. Note that `kingkiller-black` is a deep purple, not neutral — it drives the page background as well as this alt pair.

- **Focus ring:** `ring-2 ring-kingkiller-gold` (antique gold, not black)
- **Primary accent:** `kingkiller-gold`
- **Error colour:** `kingkiller-crimson`
- **Warning colour:** `kingkiller-amber`
- **Info/link colour:** `kingkiller-arcane`
- **Board surface:** `kingkiller-emerald` / `kingkiller-emerald-dark` (alternating squares) — kept in its own green family, distinct from the purple page background, so the board reads as a physical table rather than blending into page chrome
- **Player piece identity:** `kingkiller-steel` (player 0) / `kingkiller-gold-deep` (player 1) — deliberately separate from `kingkiller-white`/`kingkiller-black` (still used for general UI) and from `kingkiller-gold` (still the general accent/highlight colour)
