# Edge Glass — Phase 1 (self-contained)

**Standalone Research Desk UI** (navy sidebar + light canvas). Live SI / AN_mirror feed preferred; sample fallback. Not a validated edge. Not wired to Bet board, Desk Floor, League Drift, or TR heatmaps.

This folder is meant to survive if Situation Explorer Bet/Drift/maps are deleted later — ship Glass as the replacement surface.

## Layout

```
edge_glass/
  README.md
  index.html                 # standalone entry (also ../edge_glass.html)
  edge_glass.js              # mount + table + spectrum + hard gates + odds helpers
  edge_glass.css             # self-contained tokens + UI
  feeds/edge_glass_sample.json
../edge_glass.html           # root alias → same standalone, zero app.js
```

Explorer host (`../index.html`) only:

- Tab button `data-tab="edgeglass"`
- Empty shell `#edgeglass-panel`
- `<link href="edge_glass/edge_glass.css">` + `<script src="edge_glass/edge_glass.js">`
- Thin `app.js` hook: `EdgeGlass.activate()` on tab select

Glass does **not** import `app.js`, `desk_floor.js`, Bet clear-bar, or Drift.

## Doctrine

- Banner: experimental / not validated edge
- `_example: true`, `_warning: not real odds`
- Decisions: `BUY_CANDIDATE` | `LEAN_CANDIDATE` | `WAIT_PRICE_DEPENDENT` | `BAD_PRICE` | `PASS_THE_BOARD` | `UNVERIFIED`
- No stake / Kelly fields
- Hard gate: never BUY/LEAN if stops nonempty, load-bearing C/D, or `|divergence_pp| > 12` without `investigation_note`

## How to open locally

```bash
cd /workspace/mlb-situation-explorer
python3 -m http.server 8765
```

| Surface | URL |
|---------|-----|
| **Standalone Glass** | http://127.0.0.1:8765/edge_glass.html |
| Folder entry | http://127.0.0.1:8765/edge_glass/ |
| Embedded tab | http://127.0.0.1:8765/ → **Edge Glass** tab |

## API (window.EdgeGlass)

- `bootStandalone(opts?)` — mount into `#eg-standalone-root`
- `activate(opts?)` — mount into explorer `#edgeglass-panel` (or `opts.host`)
- `mount(host, opts?)` — inject panel markup only
- `odds.*` — american / de-vig / fair / divergence / edge / EV (from spine `odds.py`)
- `applyHardGate(row)` — client gate

Feed URL resolves relative to `edge_glass.js`: prefers `feeds/edge_glass_live.json` (live SI + AN_mirror DK current), falls back to `feeds/edge_glass_sample.json`. Research Desk: metric cards · On the radar (≥5pp / STOP + mini spectrum) · The research board (Matchup · Most likely winner · Win estimate · Relative value side · DK archive + AN_mirror · Divergence · Status pills). Sidebar filters Today/MLB/NFL. Doctrine: PHASE 01 RESEARCH. Build the number. Then look at the price. No tickets / Kelly.

## Non-goals

- Live DK scrape / inventing odds
- Bet clear-bar / Miles / Kane wiring
- git push / PR from this scaffold

## Phase 1 trading surface label
**PRICE DIAGNOSTICS** (not WHAT TO BUY). Buy-to = p_low − 0.02 per Adrian v1.1. AN/mirror never BUY/LEAN.
