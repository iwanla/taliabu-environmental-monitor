# DESIGN SYSTEM — Taliabu Environmental Monitor

Derived from `PRD.md` and `SYSTEM-DESIGN.md`. Companion to `index.html` (interactive reference).

## 1. Principles

- **Map first.** Chrome stays quiet; the map is always the primary surface.
- **Evidence over conclusion.** Every claim ships with source, date, and method. Data values are always set in monospace, never styled as a headline.
- **One color = one meaning.** The six layer categories are fixed identifiers, used identically across layer panel, legend, and badges.
- **One reserved accent.** Alert red appears only for a genuine detected change, a destructive action, or an error — never as decoration.

---

## 2. Color

### Base

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#14231D` | primary text, top bar |
| `--ink-soft` | `#3E4C44` | body text |
| `--ink-faint` | `#75816F` | captions, mono labels |
| `--paper` | `#EDEFE4` | page background |
| `--paper-raised` | `#F7F8F1` | panels, cards |
| `--paper-sunk` | `#E3E5D6` | inset/hover surfaces |
| `--line` | `#D2D5C1` | hairline borders |
| `--line-strong` | `#B9BDA5` | control borders |

### Layer categories (1:1 with `MapLayerDefinition.category`)

| Token | Hex | Category |
|---|---|---|
| `--cat-satellite` | `#5B5E8F` | satellite |
| `--cat-environment` | `#46743A` | environment (vegetation/NDVI) |
| `--cat-mining` | `#B4652A` | mining (bare land / permits) |
| `--cat-hydrology` | `#1F7A8C` | hydrology (rivers/watershed) |
| `--cat-coastal` | `#B8901E` | coastal |
| `--cat-terrain` | `#8A7048` | terrain |

### Semantic status

| Token | Hex | Meaning |
|---|---|---|
| `--accent-alert` | `#C1432B` | change detected / destructive / error (reserved) |
| `--status-good` | `#3F7A4C` | quality: high, inside permit, ready |
| `--status-medium` | `#B98A22` | quality: medium, degraded |
| `--status-low` | `#A63F2B` | quality: low, outside permit, unavailable |
| `--status-off` | `#8A8F7E` | insufficient data, off |

---

## 3. Typography

- **Archivo** — all UI text, headings, labels (weights 400/500/600).
- **IBM Plex Mono** — anything that is literally data: timestamps, scene IDs, coordinates, hectares, source strings.

| Style | Spec |
|---|---|
| h1 | Archivo 600, 2.75rem/1.15 |
| h2 | Archivo 600, 1.75rem/1.2 |
| h3 | Archivo 600, 1.25rem |
| Body | Archivo 400, 1rem/1.6, max 66ch |
| Data/mono | IBM Plex Mono 400, 0.8125rem |

---

## 4. Spacing & grid

| Token | Value |
|---|---|
| `--unit` | 8px base increment |
| space scale | 4 · 8 · 16 · 24 · 40 |
| `--radius-sm` | 3px (buttons, chips, ticks) |
| `--radius-md` | 5px (panels, cards, legends) |
| Sidebar width | 248px |
| Content max-width | 980px / 66ch text |

---

## 5. Components

### Buttons
- **Primary** (`--ink` fill) — one per view, e.g. Export, Draw AOI.
- **Secondary** (outlined) — reversible actions.
- **Ghost** — in-panel controls.
- **Alert** (`--accent-alert` fill) — destructive/irreversible only.

### Layer panel
Rows grouped by category header → category dot + name + opacity slider (raster layers) + toggle switch. Mirrors `MapLayerDefinition`: `id, category, type, defaultVisible, opacity`.

### Badges & status
- **Analysis quality:** high / medium / low — color + word, never color alone.
- **Permit classification:** inside boundary / outside boundary / insufficient data.
- **Imagery type:** optical / SAR — outline badge, category-colored dot.
- **System state:** loading / ready / degraded / unavailable / no data — matches `SYSTEM-DESIGN.md` §32 error states.

### Inspector card
Metrics stacked on top (label + mono value rows), permit/status badge at the bottom. One card per selection (scene, AOI, or polygon).

### Legend
Categorical: swatch + label list. Continuous indices (NDVI/NDWI): labelled gradient ramp, min/max in mono.

### Timeline & compare
Single track with date ticks + handle for date selection. Tab row beneath switches `compareMode`: none / swipe / split / blink / difference.

### Alerts
Left-accent card (`--accent-alert` border) — headline states what changed and where, body gives magnitude/context, mono meta line gives source + date + quality. Never a legal/chemical conclusion.

### Evidence metadata
Dashed-border definition list, always present on export: source, scene ID, acquired, analysis, period, AOI, generated timestamp.

---

## 6. Accessibility

| Requirement | Applied as |
|---|---|
| Color never sole signal | every badge/status chip pairs color with a word |
| Keyboard access | native controls (switch, tab, range) with visible focus rings |
| Legible legends | min 11px mono for data labels, 12.5–13.5px for legend rows |
| Responsive | sidebar collapses to a horizontal strip below 860px |
| Contrast | body text `#3E4C44` on `#EDEFE4` exceeds 7:1 |

---

## 7. Voice

Evidence-over-conclusion applies to copy, not just visuals.

**Do**
- "Vegetation loss detected"
- "Sediment/turbidity anomaly"
- "Outside known permit boundary"
- Pair every claim with its source and date

**Don't**
- "Illegal mining detected"
- "Water is chemically polluted"
- Unlabeled color-only status
- A metric with no source attached