# MLB Situation Explorer

Interactive TeamRankings win / ATS / over-under situation board vs ESPN standings.

**Live:** https://christopher-gier.github.io/mlb-situation-explorer/

Static snapshot. Baseline years are a From/To picker (default 2021–2026). Filtered list shows “according to” the situations and optional home-dog + RD/G>0 (2026 ESPN snapshot, look-ahead).

## How to use this board

1. Open Bet board tab (hard-refresh if needed).
2. Singles list first — green only. Gray = pass. Amber = watch, not a bet.
3. Bluff scan sidebar: set Climate (clinched/chase/dead money) and Weather (IL/fatigue). Matches = “DK still fav despite…” candidates — not tickets.
4. Open a game card: DK line → Trends → Chart chip → New Bot → Miles. Miles kill/stand_down ends gray — no path around it.
5. Fade/size only if New Bot edge clears AND Miles is clear; fades size smaller. Paper until CLV clears.
6. Ignore Edge stack / maps / TR stars / hotness on this screen — fog, not the tell.

Chart line: chip green/amber/red = season Win%/RD screen only (LR under Climate). Tap for Win%/RD — not a ticket by itself.
- **Miles:** chip = clear / watch / kill / stand_down. Green on Miles only if clear. Kill or stand_down = gray end — tap for true / likely / kill text.
- **Kane:** after green clears New Bot + Miles, Kane sets units (fades smaller). Paper until CLV clears. No size from Bluff checkboxes alone.

## Edge Glass (Phase 1)

Self-contained under [`edge_glass/`](./edge_glass/) — sample data only, not validated edge, not wired to Bet.

- Standalone: open [`edge_glass.html`](./edge_glass.html) (or `edge_glass/`)
- Embedded: Situation Explorer → **Edge Glass** tab (thin host shell only)
- Details: [`edge_glass/README.md`](./edge_glass/README.md)

