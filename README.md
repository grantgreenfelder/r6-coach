# Department of Eh — R6 Siege Coaching Dashboard

A private coaching dashboard for the Department of Eh Rainbow Six Siege team. Surfaces player stats, map win rates, operator data, strat notes, and session prep from a markdown-based Knowledge Base into a browsable web UI.

**Live site:** [departmentofeh.org](https://departmentofeh.org)

---

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS
- **Deployment:** Cloudflare Pages (auto-deploys on push to `main`)
- **Data pipeline:** `scripts/parse-kb.mjs` — reads the KB markdown files and outputs JSON to `src/data/`

---

## How the data pipeline works

The Knowledge Base lives outside this repo on the host machine. The site never reads markdown directly — the parser converts it to JSON at commit time.

```
KB .md files  →  node scripts/parse-kb.mjs  →  src/data/*.json  →  Cloudflare build  →  live site
```

**Workflow for any KB update:**
1. Edit the relevant `.md` files in the Knowledge Base folder
2. Run `npm run parse-kb` from the repo root
3. Commit everything (`src/data/` JSON + any KB changes that belong here)
4. Push to `main` — Cloudflare auto-deploys

> JSON files in `src/data/` are the build artifact that gets committed. Do not edit them directly — edit the KB `.md` files instead.

---

## Local development

```bash
# Install dependencies
npm install

# Parse KB and start dev server
npm run parse-kb   # regenerate src/data/ from KB
npm run dev        # starts at http://localhost:5173

# Or parse + full build in one shot
npm run build:local
```

**Requirements:** Node 22+ (see `.nvmrc`)

---

## Key files

| File | Purpose |
|------|---------|
| `scripts/parse-kb.mjs` | KB → JSON parser. Run before every commit touching KB data. |
| `src/data/*.json` | Generated data files. Do not edit manually. |
| `public/_headers` | Cloudflare Pages cache control + security headers |
| `public/_redirects` | SPA catch-all for client-side routing |
| `src/utils/constants.js` | Win rate color thresholds (wrColor, wrTileClass, etc.) |
| `src/utils/glossary.js` | Tooltip text for HelpTip components |

---

## CI

GitHub Actions runs on every push to `main` and on pull requests: ESLint + production build. Cloudflare Pages also runs its own build on deploy — CI is a pre-flight check, not a replacement.

---

## Deployment

Cloudflare Pages auto-deploys on every push to `main`.

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Dashboard:** dash.cloudflare.com → Pages → r6-coach
