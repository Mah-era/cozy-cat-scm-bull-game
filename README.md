# Purrfect Supply Chain: Bullwhip Village

A complete local browser game for learning and analyzing the Bullwhip Effect in supply chain management. The player manages a cozy lavender cafe village supply chain across suppliers, warehouse, retail, logistics, customers, and analytics.

## Links

- Live game: [https://mah-era.github.io/cozy-cat-scm-bull-game/](https://mah-era.github.io/cozy-cat-scm-bull-game/)
- GitHub repository: [https://github.com/Mah-era/cozy-cat-scm-bull-game](https://github.com/Mah-era/cozy-cat-scm-bull-game)

## Tech Stack

- React
- Vite
- Custom SVG map/charts plus a layered PNG opening scene
- Browser-only simulation with no backend

## How to Run

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Open the URL printed by Vite. The Codex launch config prefers port 5199, but auto-porting may choose a nearby free port:

```text
http://127.0.0.1:5199/
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

The public deployment is served from the `gh-pages` branch. `vite.config.js` sets the base path to `/cozy-cat-scm-bull-game/` so hashed assets load correctly on GitHub Pages.

## Main Features

- Procedural Web Audio soundtrack: cozy lo-fi cafe music plus SFX (clicks, stamps, coins, alerts, fanfare, a meow) with a persistent mute toggle — no audio files needed.
- Juicy feedback layer: confetti celebrations, count-up cash counter, stamp slam-in animations, toast notifications, screen transitions, floating lavender petals, and an animated shimmering final rank.
- Opening-screen **How to Play** button with a visual in-game manual: quick-start flow, activity guide, progression reference, metric glossary, and strategy notes.
- Weekly goals: each week presents a rotating SCM challenge (Service Star, Whip Tamer, Calm Orders, and more) with cash rewards.
- Stability streak system: consecutive calm, high-service weeks build a glowing 🔥 streak multiplier with escalating bonuses.
- Animated SVG charts with gradient area fills, draw-in lines, and per-point hover tooltips.
- Cozy story mode about Lavender Cat Village and the cafe supply chain.
- Difficulty selection: Beginner, Medium, Hard, and Very Analytical / Expert.
- Character setup with five fixed SCM characters and light personalization.
- Clickable custom SVG supply chain village map.
- Animated game map with moving carts, boats, demand bubbles, route flow, and character emotion states.
- Strategy-game inspired operations layer with live activity feed, operations heat, command beacons, and drastic location commands.
- Hand-drawn "outlined flat illustration" interface: warm ink outlines, flat cozy colors, vector cats, paper-grain and dot-grid textures.
- Layer-only cinematic opening: a full-viewport illustrated village built from 38 active alpha-matted art layers loaded from the manifest (the flat reference plate is excluded). The video-like motion comes from the actual layer stack: camera sweep, mouse + scroll parallax, depth travel, water/cloud/foliage motion, and in-scene cats, boats, carts, lights, and warehouse activity.
- Real-time city engine: cafe tips, ambient XP, and floating map popups tick in live every ~2 seconds between decisions.
- Per-location leveling (1→5) with permanent supply-chain perks for each of the six locations.
- Weekly narrative Situations (wedding order, food critic, rival bakery, stray cat, and more) with trade-off choices that feed the simulation.
- Progression layer: weekly star ratings and letter grades, an 8-badge achievement Trophy Case, and stability streaks.
- Location activities for Supplier Negotiation, Inventory Sorting, Cafe Promotion Planning, Demand Signal Reading, Route Puzzle, and Miso Forecasting Challenge.
- Cause → Effect cards that explain why decisions changed KPIs, future risk, and character reactions.
- Branching story paths: Stable Planner, Chaotic Growth, Trust Crisis, and Emergency Recovery.
- Serious consequence systems for angry customers, supplier trust loss, route shutdown, bullwhip alerts, emergency procurement, and operations heat crisis.
- Weekly decision loop for demand forecasting and order placement.
- Village action cards: Steady Planner, Expedite Cart, Quality Tasting, Cafe Specials, and Shelf Prep.
- Field commands from each map location, such as Harvest Surge, Reserve Release, Route Reroute, and Miso Control Room.
- Inventory, incoming shipment, lead time, stockout, and cost simulation.
- Random events: demand spike, supplier delay, weather disruption, market change, and quality issue.
- Rule-based AI-style advisor, Miso, with analytical SCM recommendations.
- Full SCM dashboard with KPI cards and custom SVG charts.
- Bullwhip analytics including demand variance, order variance, bullwhip ratio, service level, forecast error, profit, satisfaction, and balanced score.
- Supplier trust, customer reputation, route stability, village reputation, customer patience, and operations heat meters.
- Final report screen with rank and export buttons.
- CSV and upgraded HTML report export with story branch, trust/reputation/stability meters, achievements, location levels, bonuses, penalties, and impact summaries.

## Documentation

- [docs/USER_MANUAL.md](docs/USER_MANUAL.md) — How to play and full mechanics reference.
- [docs/PROJECT_REPORT.md](docs/PROJECT_REPORT.md) — Detailed architecture, systems, and design report.

## Project Structure

```text
cozy-cat-scm-bull-game/
├── index.html              # Vite HTML entry
├── package.json            # Scripts + React/Vite deps
├── README.md               # This file
├── .gitignore
├── .claude/
│   └── launch.json         # Dev-server launch config (port 5199)
├── Cozy Supply Chain Layers Breakdown/  # opening-scene art: 39 PNGs + manifest; 38 active layers used
├── docs/
│   ├── PROJECT_REPORT.md   # Detailed project report
│   └── USER_MANUAL.md      # How to play + mechanics
├── dist/                   # Production build output (generated)
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # UI components + all screens
    ├── simulation.js       # Game engine, economy, leveling, scoring
    ├── gameContent.js      # Characters, activities, situations, story text
    ├── audio.js            # Procedural Web Audio music + SFX
    ├── juice.jsx           # Feedback FX (confetti, count-up, petals, toast)
    └── styles.css          # Design system + animations
```

## Limitations

- The game is single-player and browser-local only.
- Reports export as CSV and HTML rather than PDF.
- The charts are custom SVG charts, so they are lightweight and offline-friendly but not as interactive as a full charting library.
- Character animation is CSS/SVG-based rather than sprite-sheet animation.
