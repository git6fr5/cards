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
| `kingkiller-black` | `#0C0C16` | Primary dark — the void. Body backgrounds, dark panels, modal backdrops |
| `kingkiller-obsidian` | `#1C1C30` | Secondary dark surface — panel interiors, sidebar backgrounds |
| `kingkiller-white` | `#F0EAD8` | Warm parchment — card faces, light panels, primary text on dark |
| `kingkiller-hover` | `#E4DCC8` | Parchment hover — subtle hover background on light surfaces |
| `kingkiller-stone` | `#3A3558` | Muted purple-grey — borders and dividers on dark surfaces |

### Text & muted tones
| Token | Hex | Role |
|---|---|---|
| `kingkiller-grey` | `#7A7060` | Primary muted text on light surfaces; captions, labels |
| `kingkiller-grey-muted` | `#9A9080` | Very muted; timestamps, metadata |
| `kingkiller-grey-light` | `#D8D0C0` | Subtle divider or ghost background on parchment |

### Accents
| Token | Hex | Role |
|---|---|---|
| `kingkiller-gold` | `#C9A84C` | Antique gold — card borders, trim, active highlights, primary accent |
| `kingkiller-gold-light` | `#F0D880` | Shimmer gold — hover on gold elements |
| `kingkiller-emerald` | `#2D6A4F` | Forest green — the board/arena table colour; success states |

### Status & game semantics
| Token | Hex | Role |
|---|---|---|
| `kingkiller-crimson` | `#A32030` | Blood red — attack, power, errors, destructive actions |
| `kingkiller-crimson-light` | `#F0D4D4` | Pale crimson — error backgrounds |
| `kingkiller-amber` | `#C8901C` | Amber — warning states, mana cost, resource cost |
| `kingkiller-amber-light` | `#F5E8C0` | Pale amber — warning backgrounds |
| `kingkiller-arcane` | `#5A3085` | Deep purple — magic, mystical, link colour |
| `kingkiller-arcane-light` | `#D0C0E8` | Pale arcane — mystical/info backgrounds |

---

## Functional token mapping

The design system uses `kingkiller-black` and `kingkiller-white` as the primary dark/light pair for all base component `alt` inversion (light-on-dark and dark-on-light). All `Kingkiller*` base components accept an `alt` boolean that flips between this pair.

- **Focus ring:** `ring-2 ring-kingkiller-gold` (antique gold, not black)
- **Primary accent:** `kingkiller-gold`
- **Error colour:** `kingkiller-crimson`
- **Warning colour:** `kingkiller-amber`
- **Info/link colour:** `kingkiller-arcane`
- **Success/board colour:** `kingkiller-emerald`
