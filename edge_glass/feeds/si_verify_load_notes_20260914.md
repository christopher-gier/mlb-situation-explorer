# SI verify load notes — 2026-09-14 (America/Chicago)

Marcus Bennett **URGENT refresh** for Christopher / Edge Glass. Schema: `edge_glass_si_verify_feed_v0`. Rules: `verify_feed_v0.md` v1.1.

## Files

| Feed | Path | Sport | Games |
|------|------|-------|------:|
| MLB Mon Sep 14 | `feeds/si_verify_20260914.json` | MLB | 10 |
| NFL TNF Sep 17 | `feeds/si_verify_20260917.json` | NFL | 1 |
| NFL Sun Sep 20 | `feeds/si_verify_20260920.json` | NFL | 14 |

**event_id scheme:** `{mlb|nfl}-YYYYMMDD-away-home` using lowercase ESPN abbreviations; `YYYYMMDD` = America/Chicago slate date (late-night UTC kickoffs still map to the CT slate day).

**generated_at:** MLB `2026-09-15T00:16:59Z`; NFL `2026-09-15T00:16:19Z` (UTC). Local ~ Mon 2026-09-14 evening CT.

## Counts by `si_action`

### MLB 2026-09-14 (10)
- **CLEAR_FOR_PRICE:** 7 — CHW@CLE, LAD@CIN, DET@TOR, BAL@NYM, SF@STL, SEA@LAA, MIA@ARI
- **WATCH:** 3 — ATL@CHC, NYY@MIN, SD@COL
- **STOP:** 0

### NFL 2026-09-17 TNF (1)
- **CLEAR_FOR_PRICE:** 0
- **WATCH:** 1 — DET@BUF (Allen/Goff Active; NWS BUF Thursday storms PoP ~66%)
- **STOP:** 0

### NFL 2026-09-20 (14)
- **CLEAR_FOR_PRICE:** 3 — CIN@HOU, WSH@DAL, MIA@SF
- **WATCH:** 9 — CAR@ATL, PHI@TEN, PIT@NE, GB@NYJ, CLE@TB, NO@BAL, JAX@DEN, LV@LAC, IND@KC
- **STOP:** 2 — see below

## STOP list (load-bearing unresolved)

| event_id | Matchup | stop field | Reason |
|----------|---------|------------|--------|
| `nfl-20260920-min-chi` | MIN@CHI | injury | Kyler Murray **QUESTIONABLE** — Kyler Murray QUESTIONABLE; Carson Wentz Active. Depth still Kyler Murray #1. |
| `nfl-20260920-sea-ari` | SEA@ARI | injury | Sam Darnold **DOUBTFUL** — Sam Darnold DOUBTFUL; Drew Lock Active. Depth still Sam Darnold #1. |

No MLB STOP: all games had ESPN SP listed (CONFIRMED/A in-progress; PROBABLE/B pregame). No TBD starter.

## Notable WATCH drivers (not STOP)

- **ATL@CHC / NYY@MIN:** NWS Tonight storm PoP elevated while games in progress.
- **SD@COL:** Coors altitude climate + shower chance.
- **CAR@ATL:** Penix Jr. + Tua **Out**; Cooper Rush Active_EXPECTED (depth chart still Penix #1) — known displacement, watch inactives.
- **GB@NYJ:** Josh Jacobs **Out**.
- **NO@BAL:** Alvin Kamara **Out**; Zay Flowers **Questionable**.
- **LV@LAC:** Brock Bowers **Out**; Ladd McConkey **Questionable**; SoFi `indoor=false` on ESPN — weather non-load / roof unverified (no fabricated forecast).
- **CLE@TB / PHI@TEN / PIT@NE / IND@KC:** heat and/or elevated Sunday storm PoP (NWS).
- **JAX@DEN:** Mile High climate; Bo Nix depth#1 (not on injuries list).
- **DET@BUF (TNF):** outdoor Thursday storm risk (PoP ~66% day / rain chance at kick).

## What changed since prior emit (2026-09-14T23:44Z)

- **Timestamp:** prior emit `generated_at=2026-09-14T23:44:47Z` / `fetched_at≈21:41Z` → this refresh `generated_at≈2026-09-15T00:16Z` (~7:16pm CT Mon Sep 14).
- **MLB game state:** 7 games now **IN_PROGRESS** (were all SCHEDULED/PROBABLE at prior emit). SP upgraded **PROBABLE/B → CONFIRMED/A** for those seven. Scores/innings written honestly on schedule facts + narratives.
- **MLB still pregame:** SD@COL, SEA@LAA, MIA@ARI remain PROBABLE/B.
- **MLB weather:** NWS Tonight refresh — ATL@CHC PoP~47% storms (WATCH), NYY@MIN PoP~56% storms (WATCH), SD@COL Coors climate + PoP~25% showers (WATCH). Progressive/GABP/Citi/Busch/Angel clear → CLEAR.
- **NFL injuries refreshed** from ESPN league injuries (`timestamp` ~2026-09-15T00:10Z) + core depth charts.
- **TNF DET@BUF:** Allen/Goff still Active; Ty Johnson Out (updated comment Mon practice); NWS Thursday still **Showers/T-storms Likely PoP 66%** → WATCH unchanged.
- **STOP unchanged:** `nfl-20260920-min-chi` Kyler Murray still **Questionable** (concussion protocol; Wentz Active). `nfl-20260920-sea-ari` Sam Darnold still **Doubtful** (glute; Lock Active, Rapoport lean).
- **Sunday CLEAR expanded:** prior only CIN@HOU; now also **WSH@DAL** (indoor) and **MIA@SF** (Levi's Mostly Sunny PoP 0%, no load-bearing skill Out on panel) → CLEAR_FOR_PRICE.
- **Sunday WATCH still driven by:** CAR@ATL (Penix+Tua Out / Rush Active_EXPECTED), GB@NYJ (Jacobs Out), NO@BAL (Kamara Out; Flowers Q), LV@LAC (Bowers Out; McConkey Q; SoFi roof unverified), CLE@TB / PHI@TEN / PIT@NE / IND@KC / JAX@DEN weather or climate, skill Q tags.
- **New skill tags vs prior panel:** TreVeyon Henderson Out (NE), Brian Thomas Jr. Q (JAX), Alec Pierce Q (IND), Jordan Mason Q (MIN), Dylan Sampson Q (CLE), Sean Tucker / Jalen McMillan Out (TB), Tory Horton Out (SEA).
- All `narrative_text` re-patched this emit.

## Data gaps / freshness

- **Sources used:** ESPN MLB scoreboard (probables/venues/live status), ESPN NFL scoreboard + league injuries + core depth charts, NWS `/points` forecasts. Curl/Web API only; **no invented names or odds**.
- **MLB hitter injury / official lineups:** not fully enumerated this emit (SP + weather/climate + live status focus). Missing lineup ≠ zero — consumers must not synthesize.
- **Injury TTL (60m normal):** many ESPN injury `date` stamps are hours old → `freshness_status=stale` on some facts. Acceptable for early-week NFL file; **refresh inside decision window** or STOP if hard-stale load-bearing.
- **NFL official inactives:** not yet posted for Sep 17/20 — QB Doubtful/Questionable correctly STOP; Out skill marked WATCH/scenarios.
- **Team-injury endpoints** (`/teams/{id}/injuries`) and site depthcharts returned 403; used league injuries + `sports.core.api.espn.com` depthcharts instead.
- **Rogers Centre / Chase Field:** indoor per ESPN — outdoor NWS omitted (climate roof fact only).

## Action legend (v1.1)

- Probable SP = **B** (may move line). Confirmed SP (game in/post) = **A**. TBD SP → STOP `starter`.
- C/D load-bearing → STOP. Missing ≠ zero.
- Unresolved load-bearing QB (Q/D) → STOP `injury`.
