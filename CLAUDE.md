# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run lint         # ESLint check
npm run build        # Vite production build
npm run preview      # Preview the production build
npm run parse-kb     # Regenerate src/data/ from the KB markdown (rarely runnable — see below)
npm run build:local  # parse-kb + build in one step
```

No test framework is configured.

A pre-push hook (`scripts/pre-push.sh`) runs `lint` then `build` before every push. Fix lint errors before pushing or the hook will block you.

## Architecture

**React 19 + Vite + Tailwind CSS + React Router v7.** Deployed to Cloudflare Pages at `departmentofeh.org` — every push to `main` triggers an automatic deploy.

### Data: live API + frozen KB overlay

Most stats are now **live**, fetched automatically by a Cloudflare Worker (in `worker/`) from the r6data.com API twice daily (6 AM / 6 PM EDT), stored in Cloudflare KV, and served to the frontend via Pages Functions in `functions/api/`:

- **`/api/stats`** — current-season per-player stats + operator breakdown + career history (built in `worker/src/index.js`, served from KV)
- **`/api/season?tracker=X&season=Y10S4`** — a player's full historical season (operator breakdown + computed stats), backfilled to Y6S1
- **`/api/operators`** — operator reference (roster, profiles, loadouts with weapon stats), inverted from r6data.com `/api/operators` + `/api/weapons`

The frontend resources in `src/data/*Resource.js` fetch these endpoints and merge them over the committed KB JSON:
- `playersResource.js` — live stats over `players.json`; also derives `_operatorStats` (operator→players inversion) and `_topAtkOps`/`_topDefOps`
- `operatorsResource.js` — live profiles/loadouts over `operators.json`; KB supplies editorial (gadget prose, strengths, weaknesses, playstyle); new ops appear automatically under a "New Operators" category
- `mapsResource.js` — `maps.json` only (see frozen data below)

**RIS** (Round Impact Score) is a custom metric computed in the Worker (`computeRIS`): weighted composite of KDA, ESR, WR, ClutchWR, HS%, scaled 25–75 (baseline 50), requires ≥30 matches.

### Frozen data — the KB

The committed `src/data/*.json` files come from a Markdown Knowledge Base outside this repo, parsed by `scripts/parse-kb.mjs`. **The KB lives in a different environment and is generally not accessible from this repo's machine**, so `parse-kb` usually cannot be run here. Treat the committed JSON as the source for anything not yet automated.

What is **still frozen** (KB-sourced, not live):
- **Map win rates** — team + per-player map stats (`maps.json`). No public API exposes these, so they cannot be automated. The UI labels them honestly as a dated snapshot via `src/utils/snapshot.js` (`MAP_SNAPSHOT_NOTE`, `SNAPSHOT_DATE`, derived from `meta.json`'s `parsedAt`). Surfaces: Maps pages, dashboard heatmap/best-map/ban-target, Compare's map tab.
- **Operator editorial** — gadget descriptions/mechanics/tips, strengths, weaknesses, playstyle, operator category taxonomy.
- **Map overviews** — the prose writeups on map detail Overview tabs.

`parse-kb.mjs` still generates some now-unused fields (`coaching*`, `atkOps`/`defOps`, `mapPerformance`, `prevSeason*`, `stratCount`) — dead but harmless; the frontend ignores them.

### Worker / deployment

- `worker/` is a separate Cloudflare Worker (cron-triggered) deployed by `.github/workflows/deploy-worker.yml` on pushes touching `worker/`. Secrets: `R6DATA_API_KEY` (Worker), `CLOUDFLARE_API_TOKEN` (GitHub Actions).
- The `R6_STATS` KV namespace is bound to both the Worker (writes) and the Pages project (reads, via the `functions/` endpoints).
- r6data.com free tier is 2,500 calls/month; current cadence uses well under that.

### Routing

All pages are lazy-loaded with `React.lazy` + `Suspense`. Routes (defined in `src/App.jsx`):
- `/` — dashboard
- `/players`, `/players/:name` — roster + player detail (career history expands per-season)
- `/maps`, `/maps/:mapName` — map pool + map detail (Overview + Stats tabs)
- `/operators`, `/operators/:name` — operator pool + detail (Wiki + Stack Stats tabs)

The roster page has a built-in Compare panel (`Compare.jsx`); there is no separate `/compare` route. Session-prep and the strat viewer were removed in the live-data overhaul.

### Player display names

`parse-kb.mjs` has a `DISPLAY_NAMES` object that maps KB folder names to website display names. The live Worker uses its own `PLAYERS` array (tracker username → display name) in `worker/src/index.js` — update that when the roster changes.

### Theming

Custom CSS variables defined in `src/index.css`, used with the `siege-` prefix: `siege-bg`, `siege-muted`, `siege-green`, `siege-red`, `siege-accent`, `siege-border`. Use these (not raw Tailwind colors) for any UI that should respect the site theme.

### Color thresholds

Two WR threshold systems live in `src/utils/constants.js`:

| Context | Green | Yellow | Red | Dark red |
|---------|-------|--------|-----|----------|
| Map-level WR | ≥60% | ≥50% | ≥40% | <40% |
| Operator/RIS WR | ≥58% | ≥48% | ≥38% | <38% |

Use `wrColor`/`wrBgColor` for map tiles and `opWrColor`/`opWrBgColor` for operator tables. RIS uses `risColor`/`risTextColor` (same thresholds as operator level). KD uses `kdColor` (thresholds: 1.3 / 0.9).
