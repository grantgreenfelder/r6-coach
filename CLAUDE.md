# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run lint         # ESLint check
npm run build        # Vite production build (assumes src/data/ already populated)
npm run parse-kb     # Run parse-kb.mjs to regenerate src/data/ from KB markdown
npm run build:local  # parse-kb + build in one step (use this for local deploys)
npm run preview      # Preview the production build
```

No test framework is configured.

A pre-push hook (`scripts/pre-push.sh`) runs `lint` then `build` before every push. Fix lint errors before pushing or the hook will block you.

## Architecture

**React 19 + Vite + Tailwind CSS + React Router v7.** Deployed to Cloudflare Pages at `departmentofeh.org` — every push to `main` triggers an automatic deploy.

### Data pipeline

Stats live in a Markdown-based Knowledge Base (KB) outside this repo, at:
```
/sessions/loving-inspiring-johnson/mnt/Claude/R6 Siege Coach/Knowledge Base
```

`scripts/parse-kb.mjs` reads the KB and writes JSON files into `src/data/`. These JSON files **are committed** — they are build artifacts that Cloudflare Pages reads at build time (the KB is not available in CI). Never edit `src/data/` files directly; always regenerate via `parse-kb`.

### Player display names

`parse-kb.mjs` has a `DISPLAY_NAMES` object (around line 254) that maps KB folder names to website display names:
```js
const DISPLAY_NAMES = { TazRathmus: 'Tyrone', fEHdelCastro: 'Cheese' }
```
Add entries here when a player's folder name should differ from what appears on the site.

### Routing

All pages are lazy-loaded with `React.lazy` + `Suspense`. Routes (defined in `src/App.jsx`):
- `/` — home
- `/players`, `/players/:name` — roster + player detail
- `/maps`, `/maps/:mapName`, `/maps/:mapName/:side/:site` — map pool + site breakdowns
- `/session-prep` — pre-session brief
- `/operators`, `/operators/:name` — operator pool
- `/compare` — redirects to `/players`

### Theming

Custom CSS variables defined in `src/index.css` and used throughout with the `siege-` prefix:
`siege-bg`, `siege-muted`, `siege-green`, `siege-red`, `siege-accent`, `siege-border`.

Only use these variables (not raw Tailwind color classes) for any UI that should respect the site theme.

### Color thresholds

Two separate WR threshold systems live in `src/utils/constants.js`:

| Context | Green | Yellow | Red | Dark red |
|---------|-------|--------|-----|----------|
| Map-level WR | ≥60% | ≥50% | ≥40% | <40% |
| Operator/RIS WR | ≥58% | ≥48% | ≥38% | <38% |

Use `wrColor`/`wrBgColor` for map tiles and `opWrColor`/`opWrBgColor` for operator tables. RIS uses `risColor`/`risTextColor` (same thresholds as operator level). KD uses `kdColor` (thresholds: 1.3 / 0.9).
