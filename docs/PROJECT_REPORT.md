# Project Report — Purrfect Supply Chain: Bullwhip Village

**A cozy, real-time, gamified supply-chain city simulation for learning the Bullwhip Effect.**

| | |
|---|---|
| **Project name** | Purrfect Supply Chain: Bullwhip Village |
| **Version** | 1.0.0 |
| **Type** | Single-player browser game (offline, no backend) |
| **Domain** | Supply Chain Management (SCM) education + cozy management sim |
| **Stack** | React 19 · Vite 6 · hand-authored SVG · layered PNG scene art · Web Audio API · plain CSS |
| **Status** | Playable end-to-end; production build verified |
| **Report date** | 2026-07-03 |
| **Repository** | https://github.com/Mah-era/cozy-cat-scm-bull-game |
| **Live URL** | https://mah-era.github.io/cozy-cat-scm-bull-game/ |

---

## 1. Executive Summary

Purrfect Supply Chain: Bullwhip Village is a fully offline browser game that teaches the
**Bullwhip Effect** — the phenomenon where small swings in customer demand get amplified
into large, costly swings upstream through a supply chain — while wrapping it in a cozy,
illustrated "cat cafe city" that players actually want to spend time in.

The player runs a six-location supply-chain city (Supplier Farm, Warehouse, Lavender Cafe,
Customer District, Port Hub, Analytics Office). Each week they forecast demand, place an
order, resolve a narrative situation, and choose a tactical action. Between decisions the
city is **alive in real time**: cafe tips trickle into the cash counter, locations earn XP,
and floating popups rise off the map. Locations **level up independently (1→5)**, each level
granting a permanent supply-chain perk. Performance is scored with weekly **stars and letter
grades**, **achievements**, and a final rank.

The project began as a functional but plain analytical simulator and was iteratively
transformed into a high-polish, dopamine-driven experience with a distinctive
hand-drawn "outlined flat illustration" art style (warm ink outlines, flat cream / matcha /
strawberry / latte colors), procedural audio, and a real-time engine layered on top of the
original turn-based core.

---

## 2. Goals & Design Pillars

1. **Teach the Bullwhip Effect experientially.** The math is real: order variance vs. demand
   variance is computed every week and surfaced as a "bullwhip ratio," and over-ordering after
   a mild spike is visibly punished.
2. **Cozy first, analytical underneath.** The interface reads like a warm illustrated cafe
   game, not a spreadsheet — but every KPI, formula, and chart from a serious SCM sim is present.
3. **Constant dopamine / real-time engagement.** Something is always moving or rewarding the
   player: passive tips, XP popups, level-ups, confetti, star ratings, streaks.
4. **Per-location progression.** The city is not one uniform difficulty curve — each location
   levels at its own pace and unlocks its own perk, giving the player many parallel goals.
5. **Offline & dependency-light.** No backend, no charting library, and no runtime asset
   downloads — the opening scene uses bundled layered PNG art, the rest of the UI uses custom
   SVG/CSS, and all audio is synthesized in the browser.

---

## 3. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| UI framework | **React 19** | Component model fits the screen/panel structure; hooks drive the real-time tick. |
| Build tool | **Vite 6** | Fast dev server + HMR, tiny config, modern ESM output. |
| Language | **JavaScript (JSX)** | No TypeScript to keep the footprint small and approachable. |
| Styling | **Plain CSS** (`styles.css`, ~4,900 lines) | Full control over the bespoke illustrated style, animations, cinematic opener, and textures; no utility framework. |
| Graphics | **Inline SVG + layered PNG opening art** | The live map, cats, and charts are SVG; the opening scene is a manifest-driven stack of alpha-matted PNG layers. |
| Audio | **Web Audio API** | Procedurally generated lo-fi music + SFX; zero audio files shipped. |
| Fonts | **Nunito** (Google Fonts, via `@import`) | Rounded, friendly typeface matching the cozy aesthetic. |
| Persistence | **`localStorage`** | Only used to remember the mute preference. |

**No runtime dependencies beyond React/ReactDOM.** Everything else (charts, animation,
audio, icons, and the layered opening assembly) is custom.

---

## 4. Repository Structure

```text
cozy-cat-scm-bull-game/
├── .claude/
│   └── launch.json            # Dev-server launch config (port 5199, strict)
├── .gitignore                 # node_modules, dist, OS junk
├── README.md                  # Overview, run instructions, feature list
├── index.html                 # Vite HTML entry; mounts #root
├── package.json               # Scripts + React/Vite deps
├── package-lock.json
├── Cozy Supply Chain Layers Breakdown/ # opening art: 39 PNGs + manifest; 38 active layers used
├── dist/                       # Production build output (generated)
├── docs/
│   ├── PROJECT_REPORT.md       # This document
│   └── USER_MANUAL.md          # How-to-play + full mechanics reference
└── src/
    ├── main.jsx                # React entry point (10 lines)
    ├── App.jsx                 # All UI components + screens (~2,580 lines)
    ├── simulation.js           # Game engine, economy, leveling, scoring (~1,730 lines)
    ├── gameContent.js          # Static content: characters, activities, situations (~690 lines)
    ├── audio.js                # Procedural Web Audio music + SFX (~170 lines)
    ├── juice.jsx               # Feedback FX: confetti, count-up, petals, toast (~110 lines)
    └── styles.css              # Full design system + animations (~4,890 lines)
```

Total hand-written source: **~10,400 lines** across 7 source files.

### 4.1 Module Responsibilities

- **`main.jsx`** — Mounts `<App/>` into `#root` under React StrictMode and imports the stylesheet.
- **`App.jsx`** — The entire view layer. Owns the phase machine (`start` → `setup` → `game`),
  the real-time `cityTick` interval, and ~45 presentational components (screens, cards, the
  SVG map, SVG cats, the layered opening scene, and the SVG line chart). *This is the largest file and
  the primary candidate for future splitting — see §10.*
- **`simulation.js`** — Pure(ish) game logic: difficulty tables, initial state, the weekly
  `simulateWeek` resolver, economy math, the real-time `cityTick`, per-location XP/leveling,
  bullwhip/variance calculations, story-branch logic, scoring, achievements, and CSV/HTML export.
- **`gameContent.js`** — Declarative content tables: character profiles/dialogue, per-location
  activities and their effect modifiers, the weekly **Situations** (narrative dilemmas), story
  branch flavor text, and metric tooltips.
- **`audio.js`** — A small synthesizer: an oscillator/noise `tone` helper, a named `sfx` map
  (click, select, confirm, coin, stamp, warning, crisis, fanfare, goal, meow), and a looping
  chord-progression `startMusic`. Respects a persisted mute flag.
- **`juice.jsx`** — Reusable "game feel" components: `ConfettiBurst`, animated `CountUp`,
  `FloatingPetals`, and `Toast`.
- **`styles.css`** — The design system: color tokens, the ink-outline treatment, paper-grain
  and dot-grid textures, the cinematic opening treatment, and every keyframe animation.

---

## 5. Gameplay Architecture

### 5.1 Application phases

`App` holds a `phase` state that moves through three top-level screens:

1. **`start`** — A full-viewport **living painted village**: one illustration decomposed into
   38 active alpha-matted layers (`Cozy Supply Chain Layers Breakdown/` — manifest + PNGs).
   The flat full-reference image is deliberately skipped; the video-like feeling comes from
   the actual layer stack: camera pull/sweep, mouse parallax, scroll-linked depth separation,
   drifting clouds, shimmering water, swaying foliage/awnings, bobbing boats, cafe service,
   carts, truck, forklift, dock worker, and cafe lights. The title and CTA sit over the scene;
   the **How to Play** modal mirrors the user manual with visual flow cards, activity
   references, metric glossary, and strategy notes.
2. **`setup`** — Choose difficulty, meet/rename the five cat characters, and choose accent colors.
3. **`game`** — The main loop, itself tab-switched between **Map**, **Decision**,
   **Weekly Result**, **Dashboard**, and **Final Report**.

### 5.2 The dual-clock model (key architectural decision)

The game runs on **two clocks simultaneously**:

- **The weekly clock (turn-based, strategic).** The player's deliberate decisions —
  forecast, order quantity, situation choice, action card — are resolved atomically by
  `simulateWeek(state, decision)`, which returns a brand-new immutable state.
- **The real-time clock (passive, dopamine).** A `setInterval` (~2.1s) in `App` calls
  `cityTick(state)`, which returns a new state plus a list of ephemeral events (cafe tips,
  ambient XP, level-ups). These drive floating map popups, the live cash counter, and
  occasional level-up celebrations — all without the player doing anything.

A `gameRef` (React ref mirroring the latest `game` state) lets the interval read fresh state
without resetting the timer on every tick, avoiding stale-closure bugs.

### 5.3 Per-location leveling

Each of the six locations has an independent `{ level, xp }` record in `state.locationLevels`.

- **XP thresholds:** `[0, 60, 150, 280, 460]`, max level **5**.
- **XP sources:** real-time ticks, running a location activity (+18), launching a field
  command (+14), and weekly performance tied to the location's specialty.
- **Perks (permanent, stack multiplicatively into `simulateWeek`):**

  | Location | Perk per level |
  |---|---|
  | Supplier Farm | −3% purchase cost |
  | Warehouse | −6% holding cost |
  | Cafe | +2% selling price |
  | Customer District | −5% demand noise |
  | Port | −6% delay risk |
  | Analytics Office | −5% bullwhip risk |

### 5.4 Weekly resolution pipeline (`simulateWeek`)

For each confirmed week the engine:

1. Merges active modifiers (activity effects + situation effects + location-level perks).
2. Rolls a random event (demand spike, supplier delay, weather, market trend, quality issue).
3. Computes actual demand from base demand + trend + noise, damped by chosen action/perks.
4. Advances the shipment pipeline, applies arrivals, quality loss, and emergency procurement.
5. Calculates the full cost stack: purchase, holding, stockout, ordering, disruption, action,
   emergency, and situation cash cost.
6. Computes KPIs: service level, forecast error, demand/order variance, and the **bullwhip
   ratio**.
7. Updates relationship meters (supplier trust, customer reputation, route stability, village
   reputation, patience) and operations heat.
8. Awards weekly bonuses/penalties, resolves the weekly goal, updates the stability streak.
9. Assigns the week a **balanced score → star rating (0–3) and letter grade (S/A/B/C/D)**.
10. Grants per-location XP, checks achievement unlocks, advances the story branch, and produces
    Miso's advice + cause→effect cards.

### 5.5 Scoring & progression systems

- **Balanced score** — weighted blend of profit, service level, bullwhip control, satisfaction,
  stability, and stockout performance.
- **Stars & grades** — per-week rating derived from the balanced score.
- **Stability streak** — consecutive weeks with ≥90% service and bullwhip < 2 build an
  escalating cash bonus.
- **Achievements (8)** — First Profit, Full House, Whip Whisperer, Warm Streak, Golden Ledger,
  Goal Getter, Friend of Bean, Three-Star Week.
- **Final rank** — Balanced Kingdom Score maps to titles from *Crisis Recovery Trainee* up to
  *Lavender Legend*.

---

## 6. Content Systems

- **Five characters** (Miso, Luna, Theo, Ivy, Noah) with roles, personalities, and
  emotion-keyed dialogue that reacts to game state.
- **Six location activities** (e.g. Supplier Negotiation, Route Puzzle, Forecasting Challenge),
  each with 3–4 choices that apply modifier bundles.
- **Weekly Situations** — narrative dilemmas (wedding preorder, food critic, rival bakery,
  tired crew, bridge repair, the stray cat "Bean", night market, harvest surplus), each with
  three trade-off choices that feed the simulation.
- **Weekly goals** — six rotating challenge types with cash rewards.
- **Story branches** — Stable Planner, Chaotic Growth, Trust Crisis, Emergency Recovery — with
  per-branch flavor text.
- **Random events** — seven event types affecting demand, lead time, cost, or quality.

---

## 7. Visual & Audio Design

### 7.1 Art direction — "outlined flat illustration"

Modeled on cozy mobile life-sim art: **warm brown ink outlines on every surface**, flat fills
in a tuned palette (latte, matcha, strawberry rose, lavender, sky, butter), rounded Nunito
type, subtle paper-grain and dot-grid **textures**, and hard offset "ink shadows" on buttons.

- **Vector cats** — a parametric `CatFace` SVG (ears, stripes, whiskers, blush, tail) whose
  expression changes with emotion (happy, worried, focused, proud, curious, crisis); they blink,
  twitch ears, and swish tails.
- **Layered opening scene** — a full-viewport painted village assembled from 38 active
  alpha-matted PNG layers (clouds, sea, barn, cafe, warehouse, dock, boats, truck, cats,
  crates, flowers). Each layer is positioned from the JSON manifest and animated as part of
  one cinematic diorama rather than as a flat static image.
- **Illustrated SVG scenes** — the live map, cats, charts, and cafe/interior details remain
  hand-authored SVG for crisp offline rendering.
- **Living map** — clickable SVG city with per-node level badges, moving cart/boat, drifting
  clouds, birds, water waves, cafe steam, twinkling string lights, and real-time floating popups.
- **Custom charts** — hand-built SVG line charts with gradient area fills, draw-in animation,
  and per-point hover tooltips.

### 7.2 Motion & "juice"

Screen transitions, staggered card entrances, springy hovers, confetti bursts, animated cash
count-ups, slam-in stat pills, star pop-ins, a rotating grade "stamp", floating petals, toast
notifications, and a video-like opening built from camera motion plus real layer movement.
All heavy motion is disabled under `prefers-reduced-motion`.

### 7.3 Procedural audio

A cozy lo-fi loop (Fmaj7–Am7–Dm7–G7 pads + arpeggios + soft bass) and a full SFX set, all
synthesized via oscillators/noise buffers — no audio files. A floating toggle mutes everything
and persists the choice.

---

## 8. Build, Run & Deploy

```bash
npm install        # install React + Vite
npm run dev        # dev server; open the URL Vite prints
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

- **Entry:** `index.html` → `src/main.jsx` → `<App/>`.
- **Output:** `dist/` contains a single hashed JS bundle (~105 kB gzipped) + CSS (~15 kB gzipped)
  + `index.html`. Deployable to any static host.
- **Dev config:** `.claude/launch.json` prefers port 5199 with auto-porting when that port is busy.
- **Public repo:** `https://github.com/Mah-era/cozy-cat-scm-bull-game`.
- **GitHub Pages:** `https://mah-era.github.io/cozy-cat-scm-bull-game/`, served from the
  `gh-pages` branch. `vite.config.js` sets `base: "/cozy-cat-scm-bull-game/"` so assets resolve
  correctly under the repository subpath.

---

## 9. Educational Value

The game is a genuine teaching tool for an operations/SCM audience:

- **Live bullwhip demonstration** — players watch order variance outrun demand variance and
  feel the cost of overreacting to noise.
- **Explicit formulas** — service level, forecast error, holding/stockout cost, bullwhip ratio,
  and balanced score are all documented in-game and in the manual.
- **Cause → Effect cards** — every week explains *why* KPIs moved and what future risk was
  created.
- **Difficulty tiers** — from a guided Beginner to a noisy, tight-margin Expert season.
- **Exportable data** — CSV (for spreadsheet analysis) and a formatted HTML report for
  assignments or debriefs, including final rank, reputation/stability meters, achievements,
  location levels, bonuses/penalties, and the decision impact trail.

---

## 10. Known Limitations & Future Work

**Limitations**
- Single-player, browser-local only; no save/resume of an in-progress season (only mute persists).
- Reports export as CSV/HTML, not PDF.
- Charts are lightweight custom SVG, not fully interactive like a charting library.
- Minimum viewport width is ~1080px; the layout is desktop-first.

**Suggested future work**
1. **Split `App.jsx`** (~2,580 lines) into a `components/` tree — e.g. `screens/`, `map/`,
   `cats/`, `charts/` — the empty `src/components/` stub was removed but the intent stands.
2. **Persist game state** to `localStorage` so a season survives a refresh.
3. **Responsive/mobile layout** for tablet and phone play.
4. **Unit tests** for `simulation.js` (pure functions make this straightforward) — variance,
   scoring, leveling, and export are all testable in isolation.
5. **Accessibility pass** — keyboard navigation for the map nodes and ARIA live regions for the
   real-time popups.
6. **Content expansion** — more situations, seasonal events, and per-character mini-arcs.

---

## 11. Changelog Highlights (development arc)

1. **Baseline** — functional plain analytical bullwhip simulator (weekly loop, KPIs, charts).
2. **Juice & audio pass** — procedural Web Audio, confetti, count-ups, weekly goals, stability
   streaks.
3. **Art-direction pivot** — removed the scrapbook/collage look; introduced the outlined flat
   illustration style, vector cats, and an illustrated cafe hero.
4. **Situational depth** — added weekly narrative Situations with trade-off choices.
5. **Gamification & texture** — star ratings, letter grades, an 8-badge Trophy Case, and
   paper-grain/dot-grid textures.
6. **Opening showcase** — replaced the static/flat opener with a manifest-driven, layer-only
   cinematic village: 38 active PNG layers, camera sweep, mouse + scroll parallax, depth travel,
   and in-scene motion for water, clouds, foliage, boats, cats, truck, forklift, and cafe lights.
7. **City architecture + real-time engine** — reframed as a multi-location city with a ~2s live
   tick (tips, XP, popups) and independent per-location leveling with permanent perks.
8. **Documentation & housekeeping** — refreshed the user manual with a How-to-Play section,
   this project report, and a clean folder layout (`docs/`, `.gitignore`, removed empty stubs).
9. **In-game manual/report polish** — added the opening-screen How to Play modal and upgraded
   the HTML export into a fuller visual debrief.
