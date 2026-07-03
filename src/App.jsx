import React, { useEffect, useRef, useState } from "react";
import layeredVillageManifest from "../Cozy Supply Chain Layers Breakdown/manifest/layers_manifest.json";
import { isMusicMuted, isSfxMuted, sfx, startMusic, toggleMusicMute, toggleSfxMute } from "./audio.js";
import { ConfettiBurst, CountUp, FloatingPetals, Toast } from "./juice.jsx";
import {
  ACHIEVEMENTS,
  LOCATION_PERKS,
  WEEKLY_GOALS,
  cityTick,
  xpForNextLevel,
  DEFAULT_CHARACTERS,
  DIFFICULTIES,
  FIELD_COMMANDS,
  LOCATIONS,
  VILLAGE_ACTIONS,
  applyFieldCommand,
  applyLocationActivity,
  downloadText,
  exportCsv,
  exportHtmlReport,
  getCharacterMood,
  getMapNodeState,
  getSuggestedForecast,
  getSuggestedOrder,
  getTooltip,
  initialState,
  simulateWeek,
  summarizeGame
} from "./simulation.js";
import { CHARACTER_PROFILES, LOCATION_ACTIVITIES, SITUATIONS } from "./gameContent.js";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const villageLayerSources = import.meta.glob(
  [
    "../Cozy Supply Chain Layers Breakdown/layers/*.png",
    "!../Cozy Supply Chain Layers Breakdown/layers/layer_background_full_reference.png"
  ],
  {
    eager: true,
    import: "default"
  }
);

const skippedOpeningLayers = new Set(["layer_background_full_reference"]);

const getVillageLayerSource = (layer) =>
  villageLayerSources[`../Cozy Supply Chain Layers Breakdown/${layer.file}`];

const getOpeningLayerMotion = (layer) => {
  const id = layer.id;
  if (id.includes("clean_plate")) return "opening-motion-plate";
  if (id.includes("sky")) return "opening-motion-sky";
  if (id.includes("cloud")) return "opening-motion-clouds";
  if (id.includes("sea")) return "opening-motion-water";
  if (id.includes("boat")) return "opening-motion-boat";
  if (id.includes("truck") || id.includes("forklift") || layer.group === "vehicles") return "opening-motion-vehicle";
  if (id.includes("light")) return "opening-motion-lights";
  if (id.includes("tree") || id.includes("flowers") || id.includes("awning") || id.includes("signboard")) {
    return "opening-motion-sway";
  }
  if (layer.group === "characters") return "opening-motion-character";
  if (layer.group === "buildings") return "opening-motion-building";
  if (layer.group === "props" || layer.group === "structures") return "opening-motion-prop";
  if (layer.group === "background") return "opening-motion-depth";
  return "opening-motion-idle";
};

const toCanvasPercent = (value, total) => `${((value / total) * 100).toFixed(4)}%`;
const toLayerClassName = (id) => `opening-id-${id.replace(/[^a-z0-9_-]/gi, "-")}`;

function App() {
  const [phase, setPhase] = useState("start");
  const [difficultyKey, setDifficultyKey] = useState("medium");
  const [characters, setCharacters] = useState(DEFAULT_CHARACTERS);
  const [game, setGame] = useState(null);

  const startSetup = () => {
    startMusic();
    sfx.meow();
    setPhase("setup");
  };

  const startGame = () => {
    startMusic();
    sfx.confirm();
    const fresh = initialState(difficultyKey, characters);
    setGame(fresh);
    setPhase("game");
  };

  const resetGame = () => {
    sfx.click();
    setPhase("start");
    setGame(null);
  };

  if (phase === "start") {
    return (
      <Shell>
        <StartMenu onStart={startSetup} />
      </Shell>
    );
  }

  if (phase === "setup") {
    return (
      <Shell>
        <CharacterSetup
          characters={characters}
          setCharacters={setCharacters}
          difficultyKey={difficultyKey}
          setDifficultyKey={setDifficultyKey}
          onBack={() => setPhase("start")}
          onStart={startGame}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <Game
        game={game}
        setGame={setGame}
        resetGame={resetGame}
      />
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <AmbientLife />
      <SoundToggle />
      {children}
    </main>
  );
}

// Cozy-maximalism ambient layer: petals, steam, sparkles and leaves drifting forever
const AMBIENT_SPRITES = ["🌸", "✨", "☕", "🍃", "🌸", "✨", "💛", "🍃", "🌸", "☕", "✨", "🌷", "🫧", "🍂"];
function AmbientLife() {
  return (
    <div className="ambient-life" aria-hidden="true">
      {AMBIENT_SPRITES.map((sprite, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 71 + 9) % 100}%`,
            animationDelay: `${(i * 2.3) % 18}s`,
            animationDuration: `${16 + (i % 6) * 3.5}s`,
            fontSize: `${0.8 + (i % 4) * 0.22}rem`
          }}
        >
          {sprite}
        </i>
      ))}
    </div>
  );
}

function SoundToggle() {
  const [musicMuted, setMusicMuted] = useState(isMusicMuted());
  const [sfxMuted, setSfxMuted] = useState(isSfxMuted());
  return (
    <div className="sound-toggles">
      <button
        className={`sound-toggle ${musicMuted ? "off" : ""}`}
        aria-label={musicMuted ? "Unmute music" : "Mute music"}
        title={musicMuted ? "Lo-fi music off" : "Lo-fi music on"}
        onClick={() => {
          startMusic();
          setMusicMuted(toggleMusicMute());
        }}
      >
        🎵
      </button>
      <button
        className={`sound-toggle ${sfxMuted ? "off" : ""}`}
        aria-label={sfxMuted ? "Unmute sound effects" : "Mute sound effects"}
        title={sfxMuted ? "Sound effects off" : "Sound effects on"}
        onClick={() => {
          startMusic();
          setSfxMuted(toggleSfxMute());
        }}
      >
        {sfxMuted ? "🔇" : "🔊"}
      </button>
    </div>
  );
}

function StartMenu({ onStart }) {
  const heroRef = useRef(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [scroll, setScroll] = useState(0);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const handleMove = (event) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    setParallax({
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * 2
    });
  };

  // Scroll progress across the first viewport drives layer parallax + reveals
  useEffect(() => {
    const onScroll = () =>
      setScroll(Math.min(1.4, window.scrollY / (window.innerHeight * 0.85)));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("revealed");
        }),
      { threshold: 0.16 }
    );
    document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const titleWords = ["Purrfect", "Supply", "Chain:", "Bullwhip", "Village"];

  return (
    <section
      className="start-layout fade-in opening-scrollytelling"
      ref={heroRef}
      onMouseMove={handleMove}
      style={{ "--px": parallax.x, "--py": parallax.y, "--scroll": scroll }}
    >
      <StartLights />
      <div className="opening-hero-viewport opening-cinematic">
        <div className="opening-stage opening-stage-full">
          <div
            className="hero-visual hero-reveal"
            style={{ "--reveal-delay": "300ms" }}
            role="img"
            aria-label="Supply chain city panorama"
          >
            <LayeredVillageOpeningScene parallax={parallax} scroll={scroll} />
          </div>
        </div>
        <OpeningAmbience />
        <div className="opening-hero-overlay">
          <p className="eyebrow hero-reveal" style={{ "--reveal-delay": "600ms" }}>Cozy SCM Simulation</p>
          <h1 className="hero-title" aria-label="Purrfect Supply Chain: Bullwhip Village">
            {titleWords.map((word, index) => (
              <span key={word} className="title-word" style={{ "--reveal-delay": `${750 + index * 130}ms` }}>
                {word}
              </span>
            ))}
          </h1>
          <p className="hero-tagline hero-reveal" style={{ "--reveal-delay": "1550ms" }}>
            One cozy supply-chain city. Five brave cats. One bullwhip to tame.
          </p>
          <div className="hero-cta hero-reveal" style={{ "--reveal-delay": "1750ms" }}>
            <button className="primary-button start-pulse hero-cta-start" onClick={onStart}>
              ☕ Start Village Shift
            </button>
            <button
              className="secondary-button how-play-button"
              onClick={() => {
                sfx.click();
                setShowHowToPlay(true);
              }}
            >
              📖 How to Play
            </button>
          </div>
        </div>
      </div>
      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
    </section>
  );
}

function DifficultyPicker({ difficultyKey, setDifficultyKey }) {
  return (
    <section id="difficulty" className="panel full-span">
      <div className="section-heading">
        <p className="eyebrow">Opening Menu</p>
        <h2>Pick Your Planning Challenge</h2>
      </div>
      <div className="difficulty-grid">
        {Object.entries(DIFFICULTIES).map(([key, difficulty]) => (
          <button
            key={key}
            className={`difficulty-card ${difficultyKey === key ? "selected" : ""}`}
            onClick={() => {
              sfx.select();
              setDifficultyKey(key);
            }}
          >
            <span>{difficulty.label}</span>
            <small>{difficulty.subtitle}</small>
            <strong>{difficulty.weeks} weeks</strong>
            <em>
              Volatility {(difficulty.volatility * 100).toFixed(0)}% · Lead time{" "}
              {difficulty.leadTimeBase}-{difficulty.leadTimeBase + difficulty.leadTimeVariation + 2}
            </em>
          </button>
        ))}
      </div>
    </section>
  );
}

const QUICK_START_STEPS = [
  ["1", "Pick difficulty", "Beginner is forgiving; Expert adds noisy demand, delay risk, and tight margins."],
  ["2", "Meet the crew", "Rename the five cats and set accent colors before entering Lavender Cat Village."],
  ["3", "Watch the live map", "Tips, XP, popups, carts, boats, queue bubbles, and location status change while you plan."],
  ["4", "Resolve the Situation", "Each week has a story dilemma with three trade-off choices before the forecast."],
  ["5", "Forecast and order", "Use suggested values or your own read, then pick one Village Action card."],
  ["6", "Review consequences", "Read bonuses, penalties, stars, grade, story branch, Miso advice, and Cause → Effect cards."]
];

const QUICK_STEP_ICONS = ["🎛️", "🐾", "🏙️", "📋", "📈", "🏆"];

const MANUAL_SECTIONS = [
  {
    title: "Core Loop",
    badge: "PLAY",
    items: [
      "Watch the city earn passively through cafe tips and ambient XP.",
      "Explore map locations, run one or more location activities, or launch a field command.",
      "Make the weekly forecast/order/action decision and resolve the consequence reveal.",
      "Level up locations, unlock achievements, protect service level, and keep bullwhip calm."
    ]
  },
  {
    title: "Location Activities",
    badge: "MAP",
    items: [
      "Supplier Farm: Cheap Batch, Reliable Batch, Flexible Batch.",
      "Central Warehouse: FIFO Focus, Safety Stock Wall, Fast Pick Zone.",
      "Lavender Cafe: Calm Shelf, Flash Bundle, Premium Display.",
      "Customer District: Social Buzz, Preorders, Foot Traffic, Miso Weighted Signal.",
      "Port/Transport Hub: Fast Bridge, Safe Canal, Cheap Road, Emergency Courier.",
      "Analytics Office: Smooth Forecast, Trend Forecast, Reactive Forecast, Manual Forecast."
    ]
  },
  {
    title: "Decision Tools",
    badge: "TACTICS",
    items: [
      "Village Action cards: Steady Planner, Expedite Cart, Quality Tasting, Cafe Specials, Shelf Prep.",
      "Weekly Goals pay cash if you hit targets like high service, low bullwhip, profit, or sharp forecasts.",
      "Field Commands are expensive map interventions such as Harvest Surge, Reserve Release, Route Reroute, and Miso Control Room.",
      "Repeating the same location activity in one week costs more, so use the map intentionally."
    ]
  },
  {
    title: "Progression",
    badge: "LEVEL",
    items: [
      "Each of the six locations levels from 1 to 5 through live ticks, activities, commands, and weekly performance.",
      "Location perks stack: cheaper purchasing, lower holding cost, better prices, calmer demand, lower delay risk, and reduced bullwhip.",
      "Achievements unlock for milestones like first profit, perfect service, goal completion, and stability streaks.",
      "Stability streaks build when service is 90%+ and bullwhip ratio stays under 2."
    ]
  },
  {
    title: "Final Goal",
    badge: "RANK",
    items: [
      "The Balanced Kingdom Score combines profit, service, satisfaction, bullwhip control, village reputation, supplier trust, customer reputation, and route stability.",
      "Final ranks range from Crisis Recovery Trainee up to Lavender Legend.",
      "Use CSV export for spreadsheet analysis and HTML export for a readable assignment report."
    ]
  }
];

const LOCATION_PERK_ROWS = [
  ["Supplier Farm", "-3% purchase cost per level"],
  ["Warehouse", "-6% holding cost per level"],
  ["Cafe", "+2% selling price per level"],
  ["Customer District", "-5% demand noise per level"],
  ["Port", "-6% delay risk per level"],
  ["Analytics Office", "-5% bullwhip risk per level"]
];

const METRIC_HELP = [
  ["Forecast Error", "How far your prediction was from real demand."],
  ["Service Level", "The percentage of customer demand you fulfilled."],
  ["Bullwhip Ratio", "When orders swing more wildly than customer demand."],
  ["Lead Time", "How many weeks an order takes to arrive."],
  ["Holding Cost", "The cost of keeping leftover inventory."],
  ["Stockout Cost", "The penalty for not having enough stock."]
];

function HowToPlayModal({ onClose }) {
  return (
    <div className="modal-scrim how-play-scrim" role="dialog" aria-modal="true" aria-label="How to play">
      <section className="how-play-modal scrapbook-panel">
        <button className="modal-close" onClick={onClose} aria-label="Close how to play">×</button>
        <header className="how-play-header">
          <ScrapbookBadge label="User Manual" tone="purple" />
          <h2>How to Play Purrfect Supply Chain</h2>
          <p>
            Run Lavender Cat Village like a cozy live city: explore the map, make one
            serious weekly SCM decision, level departments, and keep the bullwhip effect calm.
          </p>
          <ManualCityStrip />
        </header>

        <div className="manual-flow" aria-label="Quick start flow">
          {QUICK_START_STEPS.map(([step, title, text], index) => (
            <article key={step} className="manual-step-card">
              <b>{step}</b>
              <i>{QUICK_STEP_ICONS[index]}</i>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <div className="manual-card-grid">
          {MANUAL_SECTIONS.map((section) => (
            <article className="manual-paper-card" key={section.title}>
              <ScrapbookBadge label={section.badge} tone="yellow" />
              <h3>{section.title}</h3>
              <ul>
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          ))}
        </div>

        <div className="manual-visual-grid">
          <section className="manual-paper-card">
            <ScrapbookBadge label="Perks" tone="green" />
            <h3>Location Leveling</h3>
            <table className="manual-table">
              <tbody>
                {LOCATION_PERK_ROWS.map(([location, perk]) => (
                  <tr key={location}>
                    <th>{location}</th>
                    <td>{perk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="manual-paper-card">
            <ScrapbookBadge label="Metrics" tone="blue" />
            <h3>SCM Terms</h3>
            <div className="manual-metric-grid">
              {METRIC_HELP.map(([metric, help]) => (
                <span key={metric}>
                  <b>{metric}</b>
                  <small>{help}</small>
                </span>
              ))}
            </div>
          </section>
        </div>

        <section className="manual-paper-card manual-wide-card">
          <ScrapbookBadge label="Strategy Notes" tone="red" />
          <div className="manual-pill-row">
            <span>Avoid reacting too strongly to one demand spike.</span>
            <span>Count pipeline orders before ordering more.</span>
            <span>Promotions need inventory support.</span>
            <span>Bullwhip above 2 means order swings are getting risky.</span>
            <span>Use field commands for emergencies, not as a habit.</span>
          </div>
        </section>
      </section>
    </div>
  );
}

function ManualCityStrip() {
  return (
    <div className="manual-city-strip" aria-label="Supply chain route visual">
      {[
        ["Farm", "🌾"],
        ["Warehouse", "📦"],
        ["Cafe", "☕"],
        ["Customers", "💬"],
        ["Analytics", "📊"]
      ].map(([label, icon], index, list) => (
        <React.Fragment key={label}>
          <span>
            <i>{icon}</i>
            <b>{label}</b>
          </span>
          {index < list.length - 1 && <em>➜</em>}
        </React.Fragment>
      ))}
    </div>
  );
}

function CharacterSetup({ characters, setCharacters, difficultyKey, setDifficultyKey, onBack, onStart }) {
  const updateCharacter = (id, patch) => {
    setCharacters((current) =>
      current.map((character) => (character.id === id ? { ...character, ...patch } : character))
    );
  };

  return (
    <section className="screen-stack fade-in">
      <div className="top-bar">
        <button className="icon-button" onClick={onBack} aria-label="Back to start">
          ←
        </button>
        <div>
          <p className="eyebrow">Character Setup</p>
          <h1>Meet the Village Team</h1>
        </div>
        <button className="primary-button" onClick={onStart}>
          Enter Map
        </button>
      </div>

      <DifficultyPicker difficultyKey={difficultyKey} setDifficultyKey={setDifficultyKey} />

      <div className="character-grid">
        {characters.map((character) => (
          <article className="character-card" key={character.id}>
            <Avatar character={character} />
            <div className="character-copy">
              <input
                aria-label={`${character.name} name`}
                value={character.name}
                onChange={(event) =>
                  updateCharacter(character.id, {
                    name: event.target.value || character.name
                  })
                }
              />
              <p>{character.role}</p>
              <small>{character.personality}</small>
              <label>
                Accent color
                <input
                  type="color"
                  value={character.accent}
                  onChange={(event) =>
                    updateCharacter(character.id, { accent: event.target.value })
                  }
                />
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Game({ game, setGame, resetGame }) {
  const [activeTab, setActiveTab] = useState("map");
  const [activityLocationId, setActivityLocationId] = useState(null);
  const [confettiKey, setConfettiKey] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();
  const [decision, setDecision] = useState(() => ({
    forecast: getSuggestedForecast([], "medium", 1),
    orderQty: 80,
    actionId: "steady",
    situationChoiceId: null
  }));

  const showToast = (text, tone = "info", icon = "✦") => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, tone, icon });
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  };

  // Real-time city engine: tips, XP, and level-ups tick in live
  const [popups, setPopups] = useState([]);
  const gameRef = useRef(game);
  gameRef.current = game;
  const tickCount = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const current = gameRef.current;
      if (!current || current.screen === "final") return;
      const { state: next, events } = cityTick(current);
      if (events.length) {
        tickCount.current += 1;
        const stamped = events.map((event, index) => ({
          ...event,
          id: `${Date.now()}-${index}`
        }));
        setPopups((list) => [...list.slice(-12), ...stamped]);
        const levelUp = events.find((event) => event.kind === "levelup");
        if (levelUp) {
          sfx.goal();
          setConfettiKey(`level-${Date.now()}`);
          showToast(levelUp.text, "good", "🆙");
        } else if (tickCount.current % 4 === 0 && events.some((event) => event.kind === "cash")) {
          sfx.coin();
        }
      }
      setGame(next);
    }, 2100);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!game) return null;

  const difficulty = DIFFICULTIES[game.difficultyKey];
  const latest = game.history.at(-1);
  const isFinished = game.screen === "final";
  const progress = Math.min(100, ((game.week - 1) / game.maxWeeks) * 100);
  const suggestedForecast = getSuggestedForecast(game.history, game.difficultyKey, game.week);
  const suggestedOrder = getSuggestedOrder(
    game.history,
    game.inventory,
    game.pipeline,
    Number(decision.forecast) || suggestedForecast,
    game.difficultyKey
  );

  const confirmDecision = () => {
    sfx.confirm();
    const next = simulateWeek(game, decision);
    setGame(next);
    setActiveTab(next.screen === "final" ? "final" : "result");

    const result = next.history.at(-1);
    const hadCrisis = result?.consequences && Object.values(result.consequences).some(Boolean);
    const goalHit = next.lastGoalResult?.achieved;
    setTimeout(() => {
      if (next.screen === "final") {
        sfx.fanfare();
        setConfettiKey(`final-${Date.now()}`);
      } else if (goalHit || (result?.weeklyBonuses?.length ?? 0) >= 2) {
        sfx.goal();
        setConfettiKey(`bonus-${Date.now()}`);
      } else if (hadCrisis) {
        sfx.crisis();
      } else {
        sfx.coin();
      }
    }, 350);
    if (goalHit) {
      showToast(`Goal complete: ${next.lastGoalResult.goal.label} +$${next.lastGoalResult.goal.reward}`, "good", "🏆");
    } else if (next.lastGoalResult) {
      showToast(`Goal missed: ${next.lastGoalResult.goal.label}`, "warn", "📋");
    }
    if (next.stabilityStreak >= 3) {
      setTimeout(() => showToast(`Stability streak ×${next.stabilityStreak}! Keep the chain calm.`, "good", "🔥"), 3600);
    }
    if (next.lastUnlocked?.length) {
      const badge = next.lastUnlocked[0];
      setTimeout(() => {
        sfx.goal();
        showToast(`Achievement unlocked: ${badge.name}`, "good", badge.icon);
      }, 7200);
    }
    if (next.lastLevelUps?.length) {
      const up = next.lastLevelUps[0];
      setTimeout(() => {
        sfx.goal();
        showToast(`${up.name} reached Lv${up.level}!`, "good", "🆙");
      }, 5400);
    }
    const nextForecast = getSuggestedForecast(next.history, next.difficultyKey, next.week);
    const nextOrder = getSuggestedOrder(
      next.history,
      next.inventory,
      next.pipeline,
      nextForecast,
      next.difficultyKey
    );
    setDecision({ forecast: nextForecast, orderQty: nextOrder, actionId: "steady", situationChoiceId: null });
  };

  const continueWeek = () => {
    setActiveTab("decision");
  };

  return (
    <section className="game-layout fade-in">
      <header className="game-header">
        <div>
          <p className="eyebrow">{difficulty.label} Mode</p>
          <h1>Week {Math.min(game.week, game.maxWeeks)} Supply Chain Control</h1>
        </div>
        <div className="header-chips">
          <span className="header-chip cash-chip" title="Village cash">
            💰 <CountUp value={game.cash} format={(v) => money.format(v)} />
          </span>
          <span className="header-chip star-chip" title="Total weekly stars earned">
            ⭐ <CountUp value={game.totalStars ?? 0} />
          </span>
          {(game.stabilityStreak ?? 0) > 0 && (
            <span className="header-chip streak-chip" title="Stability streak: weeks with high service and low bullwhip">
              🔥 ×{game.stabilityStreak}
            </span>
          )}
        </div>
        <div className="week-meter" aria-label="Game progress">
          <span>{game.week - 1}/{game.maxWeeks} weeks complete</span>
          <div><i style={{ width: `${progress}%` }} /></div>
        </div>
      </header>

      <nav className="tabs" aria-label="Game screens">
        {[
          ["map", "Map"],
          ["decision", "Decision"],
          ["result", "Weekly Result"],
          ["dashboard", "Dashboard"],
          ["final", "Final Report"]
        ].map(([id, label]) => (
          <button
            key={id}
            disabled={(id === "result" && !latest) || (id === "final" && !isFinished)}
            className={activeTab === id ? "active" : ""}
            onClick={() => {
              sfx.click();
              setActiveTab(id);
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <LiveActivityPanel game={game} latest={latest} />
      <ConfettiBurst trigger={confettiKey} big={confettiKey?.startsWith("final")} />
      <Toast toast={toast} />

      <div key={activeTab} className="screen-swap">
      {activeTab === "map" && (
        <MapScreen
          game={game}
          setGame={setGame}
          setActiveTab={setActiveTab}
          openActivity={setActivityLocationId}
          popups={popups}
        />
      )}

      {activeTab === "decision" && (
        <DecisionScreen
          game={game}
          decision={decision}
          setDecision={setDecision}
          suggestedForecast={suggestedForecast}
          suggestedOrder={suggestedOrder}
          confirmDecision={confirmDecision}
        />
      )}

      {activeTab === "result" && (
        <ResultScreen
          game={game}
          latest={latest}
          continueWeek={continueWeek}
          isFinished={isFinished}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === "dashboard" && <DashboardScreen game={game} />}

      {activeTab === "final" && (
        <FinalScreen
          game={game}
          resetGame={resetGame}
        />
      )}
      </div>
      {activityLocationId && (
        <LocationActivityModal
          game={game}
          locationId={activityLocationId}
          onClose={() => {
            sfx.click();
            setActivityLocationId(null);
          }}
          onApply={(choiceId) => {
            sfx.stamp();
            setGame(applyLocationActivity(game, activityLocationId, choiceId));
            showToast("Activity pinned to this week's board", "good", "📌");
          }}
        />
      )}
    </section>
  );
}

function LiveActivityPanel({ game, latest }) {
  const pipelineQty = game.pipeline.reduce((sum, order) => sum + order.qty, 0);
  const service = latest ? `${Math.round(latest.serviceLevel * 100)}%` : "Waiting";
  const demand = latest ? `${latest.actualDemand} orders` : "Customers browsing";
  const shipment = pipelineQty > 0 ? `${pipelineQty} crates moving` : "Route ready";
  const event = latest ? latest.eventTitle : "Morning setup";
  const heat = game.operationalHeat ?? 34;

  return (
    <section className="live-panel" aria-label="Running village activity">
      <div className="ticker-lane">
        <span className="ticker-dot" />
        <b>Live village activity</b>
        <div className="ticker-track">
          <i>Customers asking: {demand}</i>
          <i>Transport: {shipment}</i>
          <i>Service: {service}</i>
          <i>Story event: {event}</i>
        </div>
      </div>
      <div className="mini-progress">
        <span>Supplier</span>
        <i />
        <span>Warehouse</span>
        <i />
        <span>Cafe</span>
        <i />
        <span>Customers</span>
      </div>
      <div className="heat-strip">
        <span>Operations heat</span>
        <b>{heat}</b>
        <i><em style={{ width: `${heat}%` }} /></i>
      </div>
    </section>
  );
}

function CharacterStage({ game }) {
  const latest = game.history.at(-1);

  return (
    <div className="character-stage" aria-label="Animated character crew">
      {game.characters.map((character) => {
        const emotion = getCharacterEmotion(character.id, latest, game);
        return (
          <article className={`crew-card ${emotion}`} key={character.id}>
            <Avatar character={character} emotion={emotion} />
            <div>
              <strong>{character.name}</strong>
              <span>{emotionLabel(emotion)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ActivityLog({ entries = [] }) {
  return (
    <div className="activity-log">
      <p className="eyebrow">Command Feed</p>
      {entries.slice(0, 5).map((entry, index) => (
        <span key={`${entry}-${index}`}>{entry}</span>
      ))}
    </div>
  );
}

function OperationsBoard({ game }) {
  const latest = game.history.at(-1);
  const pipelineQty = game.pipeline.reduce((sum, order) => sum + order.qty, 0);
  const cards = [
    {
      label: "Customer queue",
      value: latest ? latest.actualDemand : "building",
      state: latest && latest.stockout > 0 ? "critical" : "active"
    },
    {
      label: "Crates in motion",
      value: pipelineQty,
      state: pipelineQty > 180 ? "critical" : "active"
    },
    {
      label: "Shelf pressure",
      value: latest ? `${latest.stockout} short` : "ready",
      state: latest && latest.stockout > 0 ? "critical" : "calm"
    },
    {
      label: "Bullwhip watch",
      value: latest ? latest.bullwhipRatio : "armed",
      state: latest && latest.bullwhipRatio > 2 ? "critical" : "calm"
    }
  ];

  return (
    <div className="ops-board" aria-label="Live operations board">
      {cards.map((card) => (
        <article className={`ops-card ${card.state}`} key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <i />
        </article>
      ))}
    </div>
  );
}

function LocationActivityModal({ game, locationId, onClose, onApply }) {
  const activity = LOCATION_ACTIVITIES[locationId];
  const location = LOCATIONS.find((item) => item.id === locationId);
  const latest = game.history.at(-1);
  const character = game.characters.find((item) => item.id === activity?.characterId);
  const profile = CHARACTER_PROFILES[activity?.characterId];
  const repeatCount = game.completedActivitiesThisWeek?.[locationId] ?? 0;
  const [selectedChoice, setSelectedChoice] = useState(activity?.choices[0]?.id);

  if (!activity) return null;

  const applyChoice = () => {
    onApply(selectedChoice);
  };

  return (
    <div className="modal-scrim" role="dialog" aria-modal="true">
      <section className="activity-modal scrapbook-panel">
        <button className="modal-close" onClick={onClose} aria-label="Close activity">×</button>
        <div className="modal-heading">
          <ScrapbookBadge label={location?.name ?? "Location"} tone="purple" />
          <h2>{activity.title}</h2>
          <p>{activity.subtitle}</p>
        </div>
        <CharacterDialogueCard
          character={character}
          mood={getCharacterEmotion(character?.id, latest, game)}
          text={profile?.dialogue?.[getCharacterEmotion(character?.id, latest, game)] ?? character?.status}
        />
        <div className="activity-choice-grid">
          {activity.choices.map((choice) => (
            <ActivityChoiceCard
              key={choice.id}
              choice={choice}
              selected={selectedChoice === choice.id}
              onClick={() => {
                sfx.select();
                setSelectedChoice(choice.id);
              }}
            />
          ))}
        </div>
        <div className="modal-footer">
          <span className="memo-note">
            Repeat cost this week: {money.format(40 + repeatCount * 60)}
          </span>
          <button className="primary-button" onClick={applyChoice}>Apply Activity</button>
        </div>
        {game.lastCauseEffects?.map((effect) => (
          <CauseEffectCard key={effect.id} effect={effect} game={game} />
        ))}
      </section>
    </div>
  );
}

function ActivityChoiceCard({ choice, selected, onClick }) {
  return (
    <button className={`activity-choice paper-card ${selected ? "selected" : ""}`} onClick={onClick}>
      <span className="stamp-label">{choice.stamp}</span>
      <h3>{choice.name}</h3>
      <p>{choice.description}</p>
    </button>
  );
}

function CauseEffectCard({ effect, game }) {
  const character = game.characters.find((item) => item.id === effect.characterId);
  return (
    <article className={`cause-card ${effect.reaction}`}>
      <ScrapbookBadge label="Cause → Effect" tone={effect.reaction === "crisis" ? "red" : "yellow"} />
      <h3>{effect.decision}</h3>
      <dl>
        <div><dt>KPI</dt><dd>{effect.affectedKpi}</dd></div>
        <div><dt>Immediate</dt><dd>{effect.immediateEffect}</dd></div>
        <div><dt>Future Risk</dt><dd>{effect.futureRisk}</dd></div>
        <div><dt>Reaction</dt><dd>{character?.name ?? "Miso"} is {emotionLabel(effect.reaction)}</dd></div>
      </dl>
    </article>
  );
}

function StoryBranchPanel({ game }) {
  return (
    <section className="story-branch-card">
      <ScrapbookBadge label={game.storyBranch ?? "Stable Planner Path"} tone="purple" />
      <h3>{game.storyChapter ?? "Opening Season"}</h3>
      <p>Village reputation {game.villageReputation}% · supplier trust {game.supplierTrust}% · route stability {game.routeStability}%</p>
    </section>
  );
}

function RewardPenaltyStrip({ bonuses = [], penalties = [] }) {
  return (
    <div className="reward-strip">
      {bonuses.map((item) => (
        <span className="stamp-bonus" key={item.label}>BONUS {item.label} +{money.format(item.amount)}</span>
      ))}
      {penalties.map((item) => (
        <span className="stamp-warning" key={item.label}>{item.tag} {item.label} -{money.format(item.amount)}</span>
      ))}
      {!bonuses.length && !penalties.length && <span className="stamp-label">No bonus or penalty stamps this week</span>}
    </div>
  );
}

function CharacterDialogueCard({ character, mood, text }) {
  return (
    <article className={`dialogue-card ${mood}`}>
      <Avatar character={character} emotion={mood} />
      <div>
        <strong>{character?.name}</strong>
        <span>{CHARACTER_PROFILES[character?.id]?.fullRole ?? character?.role}</span>
        <p>{text}</p>
      </div>
    </article>
  );
}

function MapStatusSticker({ state }) {
  return <span className={`map-status-sticker ${state.className}`}>{state.icon} {state.sticker}: {state.note}</span>;
}

function MetricTooltip({ metric }) {
  return <span className="tooltip-dot" title={getTooltip(metric)}>?</span>;
}

function DecisionImpactTrail({ game }) {
  return (
    <section className="decision-impact-trail">
      <div className="section-heading">
        <p className="eyebrow">Decision Impact Trail</p>
        <h2>What changed because of choices?</h2>
      </div>
      {(game.decisionImpactTrail ?? []).slice(0, 6).map((effect) => (
        <CauseEffectCard key={effect.id} effect={effect} game={game} />
      ))}
    </section>
  );
}

function ScrapbookBadge({ label, tone = "yellow" }) {
  return <span className={`scrapbook-badge ${tone}`}>{label}</span>;
}

function ReputationMeters({ game }) {
  const meters = [
    ["Supplier trust", game.supplierTrust, "supplierTrust"],
    ["Customer reputation", game.customerReputation, "customerReputation"],
    ["Route stability", game.routeStability, "routeStability"],
    ["Operations heat", game.operationalHeat, "operationsHeat"],
    ["Village reputation", game.villageReputation, "customerReputation"]
  ];
  return (
    <section className="reputation-meters">
      {meters.map(([label, value, tip]) => (
        <div className="rep-meter" key={label}>
          <span>{label} <MetricTooltip metric={tip} /></span>
          <strong>{value}%</strong>
          <i><em style={{ width: `${value}%` }} /></i>
        </div>
      ))}
    </section>
  );
}

function RouteStatusPanel({ game }) {
  return (
    <section className="route-status-panel">
      <ScrapbookBadge label={game.routeChoice ?? "Safe Canal"} tone={game.routeStability < 45 ? "red" : "blue"} />
      <p>Route stability {game.routeStability}% · open shipments {game.pipeline.length} · risk modifier {game.routeRisk ?? 1}</p>
    </section>
  );
}

function getCharacterEmotion(id, latest, game) {
  return getCharacterMood(id, game, latest);
}

function emotionLabel(emotion) {
  const labels = {
    happy: "cheerful",
    worried: "worried",
    focused: "focused",
    proud: "proud",
    curious: "curious"
  };
  return labels[emotion] ?? "ready";
}

const MAP_NODES = [
  { id: "supplier", label: "Supplier Farm", x: 150, y: 145, color: "#cfe5b7" },
  { id: "warehouse", label: "Warehouse", x: 335, y: 205, color: "#cfe9e3" },
  { id: "retail", label: "Lavender Cafe", x: 515, y: 140, color: "#ead8ff" },
  { id: "customer", label: "Customer District", x: 650, y: 265, color: "#f8ccd8" },
  { id: "port", label: "Port Hub", x: 245, y: 330, color: "#f6d58e" },
  { id: "analytics", label: "Analytics Office", x: 480, y: 345, color: "#dcd8ff" }
];

function MapPopups({ popups }) {
  return (
    <div className="map-popup-layer" aria-hidden="true">
      {popups.map((popup) => {
        const node = MAP_NODES.find((item) => item.id === popup.locationId) ?? MAP_NODES[2];
        return (
          <span
            key={popup.id}
            className={`map-popup ${popup.kind}`}
            style={{
              left: `${(node.x / 780) * 100}%`,
              top: `${(node.y / 460) * 100}%`
            }}
          >
            {popup.text}
          </span>
        );
      })}
    </div>
  );
}

function MapScreen({ game, setGame, setActiveTab, openActivity, popups = [] }) {
  const selected = LOCATIONS.find((location) => location.id === game.selectedLocationId) ?? LOCATIONS[0];
  const character = game.characters.find((item) => item.id === selected.characterId);
  const latest = game.history.at(-1);
  const status = getLocationStatus(selected.id, game, latest);
  const command = FIELD_COMMANDS[selected.id];
  const nodeState = getMapNodeState(selected.id, game, latest);

  const selectLocation = (id) => {
    sfx.select();
    setGame({ ...game, selectedLocationId: id });
  };

  const executeCommand = () => {
    sfx.whoosh();
    setGame(applyFieldCommand(game, selected.id));
  };

  return (
    <div className="two-column">
      <section className="panel map-panel">
        <FloatingPetals />
        <div className="section-heading">
          <p className="eyebrow">Live City Map</p>
          <h2>Supply Chain City</h2>
        </div>
        <div className="map-live-wrap">
          <VillageMap
            selectedLocationId={game.selectedLocationId}
            onSelect={selectLocation}
            game={game}
            latest={latest}
          />
          <MapPopups popups={popups} />
        </div>
        <CharacterStage game={game} />
        <OperationsBoard game={game} />
      </section>
      <aside className="panel location-panel">
        <div className="location-top">
          <Avatar character={character} emotion={getCharacterEmotion(character.id, latest, game)} />
          <div>
            <p className="eyebrow">Selected Location</p>
            <h2>{selected.name}</h2>
          </div>
        </div>
        <LocationLevelPanel game={game} locationId={selected.id} />
        <dl className="detail-list">
          <div>
            <dt>Map Sticker</dt>
            <dd><MapStatusSticker state={nodeState} /></dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{status.status}</dd>
          </div>
          <div>
            <dt>Relevant KPI</dt>
            <dd>{status.kpi}</dd>
          </div>
          <div>
            <dt>Character Assigned</dt>
            <dd>{character.name}, {character.role}</dd>
          </div>
          <div>
            <dt>Character Note</dt>
            <dd>{character.status}</dd>
          </div>
        </dl>
        <button
          className="primary-button wide"
          onClick={() => setActiveTab(selected.id === "analytics" ? "dashboard" : "decision")}
        >
          {selected.action}
        </button>
        <button className="secondary-button wide activity-open" onClick={() => openActivity(selected.id)}>
          Do Location Activity
        </button>
        {command && (
          <div className="field-command">
            <p className="eyebrow">{command.tag}</p>
            <h3>{command.name}</h3>
            <p>{command.description}</p>
            <button className="danger-button wide" onClick={executeCommand}>
              Launch Command · {money.format(command.cost)}
            </button>
          </div>
        )}
        <MisoNote text={game.lastAdvice} />
        <ActivityLog entries={game.activityLog} />
      </aside>
    </div>
  );
}

function LocationLevelPanel({ game, locationId }) {
  const entry = game.locationLevels?.[locationId] ?? { level: 1, xp: 0 };
  const needed = xpForNextLevel(entry.level);
  const maxed = entry.level >= 5;
  const perk = LOCATION_PERKS[locationId];
  return (
    <div className="location-level-panel">
      <div className="level-line">
        <b>Level {entry.level}</b>
        <span>{maxed ? "MAX" : `${entry.xp}/${needed} XP`}</span>
      </div>
      <div className="xp-bar">
        <i style={{ width: maxed ? "100%" : `${Math.min(100, (entry.xp / needed) * 100)}%` }} />
      </div>
      {perk && (
        <small>
          Perk: {perk.label} {perk.perLevel} · currently ×{entry.level - 1}
        </small>
      )}
    </div>
  );
}

function getLocationStatus(id, game, latest) {
  const pipelineQty = game.pipeline.reduce((sum, order) => sum + order.qty, 0);
  const fallback = {
    status: "Ready for the first planning week",
    kpi: "Awaiting first result"
  };
  if (!latest) return fallback;

  const lookup = {
    supplier: {
      status: latest.eventTitle.includes("Supplier") ? "Production risk elevated" : "Supply capacity available",
      kpi: `Lead time ${latest.leadTime} week(s)`
    },
    warehouse: {
      status: game.inventory > latest.actualDemand ? "Comfortable stock cushion" : "Inventory is tight",
      kpi: `${game.inventory} units on hand`
    },
    retail: {
      status: latest.serviceLevel >= 0.9 ? "Shelves served customers well" : "Cafe shelf pressure detected",
      kpi: `${Math.round(latest.serviceLevel * 100)}% service level`
    },
    customer: {
      status: latest.actualDemand > latest.forecast ? "Demand exceeded forecast" : "Demand within planning range",
      kpi: `${latest.actualDemand} customer units`
    },
    port: {
      status: pipelineQty > 0 ? "Orders in transit" : "No open shipments",
      kpi: `${pipelineQty} units in pipeline`
    },
    analytics: {
      status: latest.bullwhipRatio > 2 ? "Bullwhip watch active" : "Stable signal pattern",
      kpi: `${latest.bullwhipRatio} bullwhip ratio`
    }
  };
  return lookup[id] ?? fallback;
}

function VillageMap({ selectedLocationId, onSelect, game, latest }) {
  const nodes = MAP_NODES;

  return (
    <svg
      className={`village-map ${(game.operationalHeat ?? 0) > 60 ? "high-heat" : ""}`}
      viewBox="0 0 780 460"
      role="img"
      aria-label="Supply chain village map"
    >
      <defs>
        <linearGradient id="mapSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f6ecd9" />
          <stop offset="60%" stopColor="#f7f1e2" />
          <stop offset="100%" stopColor="#eef0e0" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#6f6157" floodOpacity="0.14" />
        </filter>
      </defs>
      <rect x="12" y="12" width="756" height="436" rx="22" fill="url(#mapSky)" />
      <g className="map-clouds" fill="#ffffff" opacity="0.8">
        <path d="M70 62 a17 17 0 0 1 34 0 a13 13 0 0 1 24 6 h-66 a11 11 0 0 1 8 -6" />
        <path d="M240 40 a14 14 0 0 1 28 0 a11 11 0 0 1 20 5 h-54 a9 9 0 0 1 6 -5" />
      </g>
      <g className="map-birds" stroke="#8a7a6a" strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path d="M0 78 q5 -6 10 0 q5 -6 10 0" />
        <path d="M28 90 q4 -5 8 0 q4 -5 8 0" />
      </g>
      <path d="M70 328 C210 285 260 360 390 300 S590 245 704 312" fill="none" stroke="#bedbd1" strokeWidth="18" strokeLinecap="round" opacity="0.58" />
      <path d="M146 152 C230 175 260 193 335 207 S451 194 515 146 S600 173 650 267" fill="none" stroke="#d7b98d" strokeWidth="10" strokeLinecap="round" strokeDasharray="14 12" />
      <path d="M245 330 C305 300 350 288 480 345" fill="none" stroke="#d7b98d" strokeWidth="10" strokeLinecap="round" strokeDasharray="14 12" />
      <ellipse cx="122" cy="374" rx="70" ry="24" fill="#bee4cf" opacity="0.7" />
      <ellipse cx="610" cy="82" rx="90" ry="32" fill="#f5d3de" opacity="0.55" />
      <g className="map-buildings" fill="none">
        <path d="M188 94 h54 l28 42 h-110 z" fill="#cfa06f" />
        <path d="M194 94 h42 v72 h-42 z" fill="#fff5e9" />
        <path d="M536 92 h76 l38 52 h-152 z" fill="#b39ddb" />
        <path d="M548 144 h82 v62 h-82 z" fill="#fff8ee" />
        <path d="M548 144 h82 v14 h-82 z" fill="#e9c6cd" />
        <path d="M306 170 h90 v82 h-90 z" fill="#f6fbff" />
        <path d="M296 170 h110 l-20 -38 h-70 z" fill="#8fc3d9" />
        <path d="M222 300 h86 v60 h-86 z" fill="#fff2db" />
        <path d="M212 300 h106 l-28 -35 h-50 z" fill="#d89a56" />
        <circle cx="664" cy="300" r="42" fill="#fff1f5" />
        <path d="M460 313 h72 v68 h-72 z" fill="#f6f5ff" />
        <path d="M452 313 h88 l-22 -34 h-44 z" fill="#8f74c9" />
      </g>
      <g className="string-lights">
        <line x1="180" y1="34" x2="620" y2="46" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <circle key={i} cx={205 + i * 56} cy={38 + Math.sin(i) * 4 + 8} r="5" fill="#ffe6a1" />
        ))}
      </g>
      <g className="storybook-details">
        <circle cx="98" cy="110" r="10" fill="#f6cfdb" />
        <path d="M98 120 v34" stroke="#8cbf9a" strokeWidth="5" strokeLinecap="round" />
        <circle cx="114" cy="126" r="8" fill="#b8d9bd" />
        <circle cx="704" cy="118" r="12" fill="#f2c879" />
        <path d="M704 130 v32" stroke="#8cbf9a" strokeWidth="5" strokeLinecap="round" />
        <path d="M595 309 q24 -24 48 0" fill="none" stroke="#df8cab" strokeWidth="6" strokeLinecap="round" />
        <path d="M626 333 q24 -24 48 0" fill="none" stroke="#df8cab" strokeWidth="6" strokeLinecap="round" />
        <rect x="367" y="248" width="30" height="20" rx="5" fill="#eec97e" opacity="0.85" />
        <rect x="405" y="258" width="26" height="18" rx="5" fill="#e2a0ae" opacity="0.85" />
      </g>
      <g className="map-steam" fill="#c9b8e6">
        <circle cx="565" cy="118" r="5" />
        <circle cx="575" cy="122" r="4" />
        <circle cx="556" cy="124" r="3.5" />
      </g>
      <g className="water-waves" stroke="#a8cfc2" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8">
        <path d="M130 344 q10 -6 20 0 q10 -6 20 0" />
        <path d="M430 296 q10 -6 20 0 q10 -6 20 0" />
      </g>
      <g className="moving-load" key={`load-${game.history.length}`}>
        <animateMotion
          dur={latest?.leadTime && latest.leadTime > 3 ? "8s" : "5.8s"}
          repeatCount="indefinite"
          path="M146 152 C230 175 260 193 335 207 S451 194 515 146 S600 173 650 267"
        />
        <rect x="-18" y="-12" width="36" height="22" rx="8" fill="#f2c879" stroke="#7b6a91" strokeWidth="3" />
        <circle cx="-9" cy="12" r="5" fill="#7560b8" />
        <circle cx="11" cy="12" r="5" fill="#7560b8" />
        <path d="M-8 -15 h16 l5 8 h-26 z" fill="#f7c9d6" />
      </g>
      <g className="moving-boat" key={`boat-${game.pipeline.length}-${game.history.length}`}>
        <animateMotion
          dur="7s"
          repeatCount="indefinite"
          path="M70 328 C210 285 260 360 390 300 S590 245 704 312"
        />
        <path d="M-22 4 h44 l-10 14 h-24 z" fill="#79b7b7" stroke="#5f6b7a" strokeWidth="3" />
        <path d="M0 4 v-28 l20 28 z" fill="#fff7e8" stroke="#5f6b7a" strokeWidth="3" />
      </g>
      <g className="demand-bubbles">
        {[0, 1, 2].map((item) => (
          <g key={item} style={{ animationDelay: `${item * 0.7}s` }}>
            <circle cx={625 + item * 24} cy={226 - item * 12} r="13" fill="#fff8ec" stroke="#df8cab" strokeWidth="3" />
            <text x={625 + item * 24} y={231 - item * 12} textAnchor="middle" className="bubble-text">
              {latest ? Math.max(1, Math.round(latest.actualDemand / 25) + item) : item + 2}
            </text>
          </g>
        ))}
      </g>
      <g className="command-beacons">
        <circle cx="335" cy="205" r="52" />
        <circle cx="515" cy="140" r="48" />
        <circle cx="245" cy="330" r="46" />
      </g>
      {nodes.map((node) => (
        <g key={node.id} className={getMapNodeState(node.id, game, latest).className}>
          <g
            className="svg-button"
            role="button"
            tabIndex="0"
            onClick={() => onSelect(node.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelect(node.id);
            }}
            aria-label={`Open ${node.label}`}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={selectedLocationId === node.id ? 35 : 29}
              fill={node.color}
              stroke={selectedLocationId === node.id ? "#a97e4f" : "#ffffff"}
              strokeWidth="5"
              filter="url(#softShadow)"
            />
            <rect
              x={node.x - 33}
              y={node.y - 48}
              width="66"
              height="22"
              rx="11"
              className="node-sticker"
            />
            <text x={node.x} y={node.y - 33} textAnchor="middle" className="node-sticker-text">
              {getMapNodeState(node.id, game, latest).sticker}
            </text>
            <circle cx={node.x} cy={node.y - 6} r="8" fill="#6f6157" opacity="0.75" />
            <path d={`M${node.x - 14} ${node.y + 11} Q${node.x} ${node.y - 6} ${node.x + 14} ${node.y + 11}`} fill="none" stroke="#6f6157" strokeWidth="4" strokeLinecap="round" />
            <text x={node.x} y={node.y + 55} textAnchor="middle" className="map-label">
              {node.label}
            </text>
            <g className="level-badge">
              <circle cx={node.x + 26} cy={node.y + 18} r="13" fill="#fdf3d8" stroke="#5d4936" strokeWidth="2" />
              <text x={node.x + 26} y={node.y + 22} textAnchor="middle" className="level-badge-text">
                L{game.locationLevels?.[node.id]?.level ?? 1}
              </text>
            </g>
          </g>
        </g>
      ))}
    </svg>
  );
}

function DecisionScreen({
  game,
  decision,
  setDecision,
  suggestedForecast,
  suggestedOrder,
  confirmDecision
}) {
  const difficulty = DIFFICULTIES[game.difficultyKey];
  const pipelineQty = game.pipeline.reduce((sum, order) => sum + order.qty, 0);
  const activeModifierCount = Object.keys(game.activeModifiers ?? {}).length;
  const activityModifierCount = Object.keys(game.activeActivityModifiers ?? {}).length;
  const highOrderWarning = Number(decision.orderQty) > Number(decision.forecast) * 1.6;
  const highPipelineWarning = game.inventory + pipelineQty > Number(decision.forecast) * 3;
  const promoLowStockWarning = game.cafePromotion !== "Calm Shelf" && game.inventory < Number(decision.forecast);

  return (
    <div className="two-column">
      <section className="panel decision-panel">
        <div className="section-heading">
          <p className="eyebrow">Week {game.week} Decision</p>
          <h2>Forecast Demand and Place Order</h2>
        </div>
        {game.weeklyGoal && (
          <div className="weekly-goal-card">
            <span className="goal-icon">🎯</span>
            <div>
              <b>Weekly Goal: {game.weeklyGoal.label}</b>
              <p>{game.weeklyGoal.description}</p>
            </div>
            <em>+{money.format(game.weeklyGoal.reward)}</em>
          </div>
        )}
        <SituationCard game={game} decision={decision} setDecision={setDecision} />
        <div className="decision-form">
          <label>
            Forecast demand <MetricTooltip metric="forecastError" />
            <input
              aria-label="Forecast demand"
              type="number"
              min="0"
              value={decision.forecast}
              onChange={(event) => setDecision({ ...decision, forecast: event.target.value })}
            />
            <small title="Forecast Error = Actual Demand - Forecast Demand">
              Suggested forecast: {suggestedForecast} units
            </small>
          </label>
          <label>
            Order quantity <MetricTooltip metric="bullwhipRatio" />
            <input
              aria-label="Order quantity"
              type="number"
              min="0"
              value={decision.orderQty}
              onChange={(event) => setDecision({ ...decision, orderQty: event.target.value })}
            />
            <small title="Bullwhip appears when order variance grows beyond demand variance.">
              Smoothing suggestion: {suggestedOrder} units
            </small>
          </label>
          <div className="quick-actions">
            <button onClick={() => setDecision({ ...decision, forecast: suggestedForecast })}>
              Use Forecast
            </button>
            <button onClick={() => setDecision({ ...decision, orderQty: suggestedOrder })}>
              Use Order
            </button>
          </div>
          <div className="action-grid" aria-label="Village action cards">
            {VILLAGE_ACTIONS.map((action) => (
              <button
                key={action.id}
                className={`action-card ${decision.actionId === action.id ? "selected" : ""}`}
                onClick={() => {
                  sfx.select();
                  setDecision({ ...decision, actionId: action.id });
                }}
                type="button"
              >
                <b>{action.icon}</b>
                <span>{action.name}</span>
                <small>{action.description}</small>
                <em>{money.format(action.cost)}</em>
              </button>
            ))}
          </div>
          <button className="primary-button wide" onClick={confirmDecision}>
            Confirm Week {game.week}
          </button>
        </div>
      </section>

      <aside className="panel">
        <div className="section-heading">
          <p className="eyebrow">Planning Context</p>
          <h2>Current Chain State</h2>
        </div>
        <div className="kpi-grid compact">
          <Kpi label="Inventory" value={`${game.inventory} units`} />
          <Kpi label="Cash" value={money.format(game.cash)} />
          <Kpi label="Pipeline" value={`${pipelineQty} units`} />
          <Kpi label="Lead time range" value={`${difficulty.leadTimeBase}-${difficulty.leadTimeBase + difficulty.leadTimeVariation + 2} weeks`} />
          <Kpi label="Holding cost" value={`${money.format(difficulty.holdingCost)} / unit`} />
          <Kpi label="Stockout penalty" value={`${money.format(difficulty.stockoutPenalty)} / unit`} />
          <Kpi label="Active command" value={activeModifierCount ? `${activeModifierCount} effect(s)` : "None"} />
          <Kpi label="Activity modifiers" value={activityModifierCount ? `${activityModifierCount} effect(s)` : "None"} />
        </div>
        <div className="warning-stack">
          {highOrderWarning && <span className="stamp-warning">WARNING: order is much higher than forecast</span>}
          {highPipelineWarning && <span className="stamp-warning">WARNING: inventory + pipeline may create holding cost</span>}
          {promoLowStockWarning && <span className="stamp-warning">WARNING: promotion selected while inventory is low</span>}
        </div>
        <MisoNote text={game.lastAdvice} />
      </aside>
    </div>
  );
}

function StarRow({ stars, max = 3 }) {
  return (
    <div className="star-row" aria-label={`${stars} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`star ${i < stars ? "earned" : ""}`} style={{ "--star-delay": `${300 + i * 220}ms` }}>
          ★
        </span>
      ))}
    </div>
  );
}

function TrophyCase({ game }) {
  const unlocked = game.achievements ?? [];
  return (
    <section className="panel trophy-case">
      <div className="section-heading">
        <p className="eyebrow">Trophy Case</p>
        <h2>Achievements · {unlocked.length}/{ACHIEVEMENTS.length}</h2>
      </div>
      <div className="badge-grid">
        {ACHIEVEMENTS.map((badge) => {
          const isUnlocked = unlocked.includes(badge.id);
          return (
            <article key={badge.id} className={`badge-card ${isUnlocked ? "unlocked" : "locked"}`} title={badge.desc}>
              <span className="badge-icon">{isUnlocked ? badge.icon : "🔒"}</span>
              <b>{badge.name}</b>
              <small>{badge.desc}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SituationCard({ game, decision, setDecision }) {
  const situation = SITUATIONS.find((item) => item.id === game.currentSituationId);
  if (!situation) return null;
  const character = game.characters.find((item) => item.id === situation.characterId);

  return (
    <div className="situation-card">
      <header>
        <Avatar character={character} emotion="curious" />
        <div>
          <h3>{situation.icon} {situation.title}</h3>
          <p>{character?.name} needs your call before the week starts</p>
        </div>
      </header>
      <p className="situation-story">{situation.story}</p>
      <div className="situation-choices">
        {situation.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className={`situation-choice ${decision.situationChoiceId === choice.id ? "selected" : ""}`}
            onClick={() => {
              sfx.select();
              setDecision({ ...decision, situationChoiceId: choice.id });
            }}
          >
            <b>{choice.label}</b>
            <small>{choice.detail}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultScreen({ game, latest, continueWeek, isFinished, setActiveTab }) {
  if (!latest) {
    return (
      <section className="panel empty-state">
        <h2>No weekly result yet</h2>
        <p>Make your first forecast and order decision to start the village simulation.</p>
      </section>
    );
  }

  return (
    <div className="two-column">
      <section className="panel result-panel">
        {latest.weekGrade && (
          <div className={`grade-stamp grade-${latest.weekGrade}`} aria-label={`Week grade ${latest.weekGrade}`}>
            <i>{latest.weekGrade}</i>
            <span>week grade</span>
          </div>
        )}
        <div className="section-heading">
          <p className="eyebrow">Weekly Summary</p>
          <h2>Week {latest.week}: {latest.eventTitle}</h2>
          <StarRow stars={latest.weekStars ?? 0} />
        </div>
        <p className="story small-story">{latest.eventDescription}</p>
        {game.lastSituationResult && (
          <div className="situation-outcome">
            <span>{game.lastSituationResult.icon}</span>
            <p>
              <b>{game.lastSituationResult.situationTitle} — {game.lastSituationResult.choiceLabel}.</b>{" "}
              {game.lastSituationResult.outcome}
            </p>
          </div>
        )}
        {game.lastGoalResult && (
          <div className={`goal-result-banner ${game.lastGoalResult.achieved ? "achieved" : "missed"}`}>
            {game.lastGoalResult.achieved ? "🏆" : "📋"}{" "}
            <b>{game.lastGoalResult.achieved ? "Goal complete" : "Goal missed"}:</b>{" "}
            {game.lastGoalResult.goal.label}
            {game.lastGoalResult.achieved && <em> +{money.format(game.lastGoalResult.goal.reward)}</em>}
          </div>
        )}
        <RewardPenaltyStrip bonuses={latest.weeklyBonuses ?? []} penalties={latest.weeklyPenalties ?? []} />
        <div className="kpi-grid">
          <Kpi label="Actual demand" value={`${latest.actualDemand} units`} />
          <Kpi label="Fulfilled demand" value={`${latest.fulfilledDemand} units`} />
          <Kpi label="Stockout" value={`${latest.stockout} units`} tone={latest.stockout > 0 ? "warn" : "good"} />
          <Kpi label="Inventory left" value={`${latest.endingInventory} units`} />
          <Kpi label="Revenue" value={money.format(latest.revenue)} />
          <Kpi label="Total cost" value={money.format(latest.purchaseCost + latest.holdingCost + latest.stockoutCost + latest.orderingCost + latest.disruptionCost + (latest.actionCost ?? 0))} />
          <Kpi label="Profit" value={money.format(latest.profit)} tone={latest.profit >= 0 ? "good" : "warn"} />
          <Kpi label="Service level" value={`${Math.round(latest.serviceLevel * 100)}%`} />
          <Kpi label="Village action" value={latest.actionName ?? "Steady Planner"} />
          <Kpi label="Action cost" value={money.format(latest.actionCost ?? 0)} />
        </div>
        <StoryBranchPanel game={game} />
        <div className="cause-grid">
          {(game.lastCauseEffects ?? []).map((effect) => (
            <CauseEffectCard key={effect.id} effect={effect} game={game} />
          ))}
        </div>
      </section>
      <aside className="panel">
        <div className="dialogue-stack">
          {game.characters.map((character) => (
            <CharacterDialogueCard
              key={character.id}
              character={character}
              mood={getCharacterEmotion(character.id, latest, game)}
              text={CHARACTER_PROFILES[character.id]?.dialogue?.[getCharacterEmotion(character.id, latest, game)]}
            />
          ))}
        </div>
        <MisoNote text={game.lastAdvice} />
        <div className="result-actions">
          <button className="secondary-button wide" onClick={() => setActiveTab("dashboard")}>
            Review Dashboard
          </button>
          <button
            className="primary-button wide"
            onClick={isFinished ? () => setActiveTab("final") : continueWeek}
          >
            {isFinished ? "View Final Report" : `Plan Week ${game.week}`}
          </button>
        </div>
      </aside>
    </div>
  );
}

function DashboardScreen({ game }) {
  const latest = game.history.at(-1);
  const summary = summarizeGame(game);

  return (
    <section className="screen-stack">
      <div className="panel">
        <div className="section-heading">
          <p className="eyebrow">SCM Dashboard</p>
          <h2>Bullwhip Analytics and KPI Review</h2>
        </div>
        <ReputationMeters game={game} />
        <RouteStatusPanel game={game} />
        <div className="kpi-grid dashboard-kpis">
          <Kpi label="Current week" value={String(Math.min(game.week, game.maxWeeks))} />
          <Kpi label="Cash / profit" value={money.format(game.cash)} />
          <Kpi label="Inventory level" value={`${game.inventory} units`} />
          <Kpi label="Customer demand" value={latest ? latest.actualDemand : "Pending"} />
          <Kpi label="Forecast demand" value={latest ? latest.forecast : "Pending"} />
          <Kpi label="Order quantity" value={latest ? latest.orderQty : "Pending"} />
          <Kpi label="Lead time" value={latest ? `${latest.leadTime} weeks` : "Pending"} />
          <Kpi label="Service level" value={latest ? `${Math.round(latest.serviceLevel * 100)}%` : "Pending"} />
          <Kpi label="Stockout units" value={latest ? latest.stockout : "Pending"} />
          <Kpi label="Holding cost" value={latest ? money.format(latest.holdingCost) : "Pending"} />
          <Kpi label="Forecast error" value={latest ? latest.forecastError : "Pending"} />
          <Kpi label="Demand variance" value={latest ? latest.demandVariance : "Pending"} />
          <Kpi label="Order variance" value={latest ? latest.orderVariance : "Pending"} />
          <Kpi label="Bullwhip ratio" value={latest ? latest.bullwhipRatio : "Pending"} tone={latest?.bullwhipRatio > 2 ? "warn" : "good"} />
          <Kpi label="Customer satisfaction" value={`${game.satisfaction}%`} />
          <Kpi label="Balanced score" value={latest ? latest.balancedScore : summary.finalScore} />
        </div>
      </div>

      <div className="dashboard-scrap-grid">
        <section className="panel scrapbook-panel">
          <ScrapbookBadge label="What changed this week?" tone="yellow" />
          <RewardPenaltyStrip bonuses={latest?.weeklyBonuses ?? []} penalties={latest?.weeklyPenalties ?? []} />
          <p className="story small-story">{latest?.decisionImpactSummary || "Make a weekly decision to generate an impact trail."}</p>
        </section>
        <section className="panel scrapbook-panel">
          <ScrapbookBadge label={latest?.bullwhipRatio > 3 ? "CRISIS" : latest?.bullwhipRatio > 2 ? "BULLWHIP ALERT" : "STABLE CHAIN"} tone={latest?.bullwhipRatio > 2 ? "red" : "green"} />
          <h3>Bullwhip alert meter</h3>
          <div className="alert-meter"><i style={{ width: `${Math.min(100, (latest?.bullwhipRatio ?? 0) * 25)}%` }} /></div>
          <p>Orders should not swing louder than customer demand. Smooth the ordering rhythm when this meter rises.</p>
        </section>
      </div>

      <div className="chart-grid">
        <ChartCard title="Demand vs Orders" help="Compares customer demand with upstream ordering behavior.">
          <LineChart
            data={game.history}
            series={[
              { key: "actualDemand", label: "Demand", color: "#6f9e8b" },
              { key: "orderQty", label: "Orders", color: "#8c6ce7" }
            ]}
          />
        </ChartCard>
        <ChartCard title="Inventory Level" help="Ending inventory after demand is fulfilled.">
          <LineChart data={game.history} series={[{ key: "endingInventory", label: "Inventory", color: "#74a8d8" }]} />
        </ChartCard>
        <ChartCard title="Forecast vs Actual Demand" help="Forecast error = actual demand minus forecast demand.">
          <LineChart
            data={game.history}
            series={[
              { key: "forecast", label: "Forecast", color: "#d79c5a" },
              { key: "actualDemand", label: "Actual", color: "#de7faf" }
            ]}
          />
        </ChartCard>
        <ChartCard title="Profit Over Time" help="Profit = revenue minus ordering, purchase, holding, stockout, and disruption costs.">
          <LineChart data={game.history} series={[{ key: "profit", label: "Profit", color: "#70ba91" }]} />
        </ChartCard>
        <ChartCard title="Bullwhip Ratio Trend" help="Bullwhip Ratio = variance of orders divided by variance of demand.">
          <LineChart data={game.history} series={[{ key: "bullwhipRatio", label: "Bullwhip", color: "#9b70d6" }]} />
        </ChartCard>
        <ChartCard title="Service Level Trend" help="Service Level = fulfilled demand divided by actual demand.">
          <LineChart
            data={game.history.map((row) => ({ ...row, servicePercent: row.serviceLevel * 100 }))}
            series={[{ key: "servicePercent", label: "Service %", color: "#5f9bbd" }]}
          />
        </ChartCard>
      </div>

      <section className="panel formula-panel">
        <h2>SCM Definitions</h2>
        <p>
          Forecast Error = Actual Demand - Forecast Demand. Holding Cost = Ending
          Inventory × Holding Cost Rate. Stockout Cost = Unfulfilled Demand ×
          Stockout Penalty. Bullwhip Ratio = Variance of Orders / Variance of
          Demand. Balanced Score combines profit, service level, bullwhip control,
          satisfaction, and stockout performance.
        </p>
      </section>
      <TrophyCase game={game} />
      <DecisionImpactTrail game={game} />
    </section>
  );
}

function FinalScreen({ game, resetGame }) {
  const summary = summarizeGame(game);

  const handleCsv = () => {
    downloadText("purrfect-supply-chain-report.csv", exportCsv(game), "text/csv");
  };

  const handleHtml = () => {
    downloadText("purrfect-supply-chain-report.html", exportHtmlReport(game), "text/html");
  };

  return (
    <section className="screen-stack">
      <div className="panel final-hero">
        <FloatingPetals count={14} />
        <p className="eyebrow">Final Result</p>
        <h1 className="rank-title">{summary.rank}</h1>
        <p className="story small-story">
          The Lavender Cat Village cafe completed the season. Miso closes the
          ledger with one last reminder: a stable chain is not the quietest one,
          but the one that reacts with discipline.
        </p>
        <div className="kpi-grid">
          <Kpi label="Final profit" value={money.format(summary.finalProfit)} />
          <Kpi label="Average service level" value={`${Math.round(summary.averageServiceLevel * 100)}%`} />
          <Kpi label="Average bullwhip ratio" value={summary.averageBullwhipRatio} />
          <Kpi label="Total stockouts" value={`${summary.totalStockouts} units`} />
          <Kpi label="Total holding cost" value={money.format(summary.totalHoldingCost)} />
          <Kpi label="Customer satisfaction" value={`${summary.customerSatisfaction}%`} />
          <Kpi label="Final balanced score" value={summary.finalScore} />
          <Kpi label="Best stability streak" value={`×${game.bestStreak ?? 0}`} tone={(game.bestStreak ?? 0) >= 3 ? "good" : undefined} />
          <Kpi label="Total stars" value={`⭐ ${game.totalStars ?? 0}`} tone="good" />
          <Kpi label="Branch ending" value={summary.branchEnding} />
          <Kpi label="Biggest strength" value={summary.biggestStrength} />
          <Kpi label="Biggest weakness" value={summary.biggestWeakness} />
          <Kpi label="Best decision" value={summary.bestDecision} />
          <Kpi label="Worst decision" value={summary.worstDecision} />
        </div>
        <StoryBranchPanel game={game} />
        <ReputationMeters game={game} />
        <div className="result-actions row">
          <button className="primary-button" onClick={handleCsv}>Export CSV</button>
          <button className="secondary-button" onClick={handleHtml}>Export HTML Report</button>
          <button className="ghost-button" onClick={resetGame}>Restart</button>
        </div>
      </div>
      <TrophyCase game={game} />
      <div className="chart-grid">
        <ChartCard title="Final Demand and Orders">
          <LineChart
            data={game.history}
            series={[
              { key: "actualDemand", label: "Demand", color: "#6f9e8b" },
              { key: "orderQty", label: "Orders", color: "#8c6ce7" }
            ]}
          />
        </ChartCard>
        <ChartCard title="Final Score Trend">
          <LineChart data={game.history} series={[{ key: "balancedScore", label: "Score", color: "#d79c5a" }]} />
        </ChartCard>
      </div>
    </section>
  );
}

function Kpi({ label, value, tone }) {
  return (
    <article className={`kpi-card ${tone ?? ""}`} title={label}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function MisoNote({ text }) {
  return (
    <div className="miso-note">
      <div className="mini-avatar">
        <CatFace accent="#ab95d8" emotion="curious" />
      </div>
      <p>{text}</p>
    </div>
  );
}

function Avatar({ character, emotion = "happy" }) {
  return (
    <div className={`avatar ${emotion}`} aria-label={`${character?.name ?? "Character"} avatar`}>
      <CatFace accent={character?.accent ?? "#c69c6d"} emotion={emotion} />
    </div>
  );
}

function CatFace({ accent = "#c69c6d", emotion = "happy" }) {
  const worried = emotion === "worried";
  const crisis = emotion === "crisis";
  const focused = emotion === "focused";
  const proud = emotion === "proud";
  const curious = emotion === "curious";
  const ink = "#4a3b2e";
  const lineInk = "#5d4936";

  return (
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      {/* tail */}
      <path
        className="cat-tail"
        d="M94 104 q22 -4 20 -26"
        fill="none"
        stroke={lineInk}
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path
        className="cat-tail"
        d="M94 104 q22 -4 20 -26"
        fill="none"
        stroke={accent}
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* chest / body */}
      <ellipse cx="60" cy="100" rx="33" ry="20" fill={accent} stroke={lineInk} strokeWidth="2.5" />
      <ellipse cx="60" cy="103" rx="20" ry="13" fill="#fff6e8" stroke={lineInk} strokeWidth="2" />
      {/* ears */}
      <g className="cat-ear-l">
        <path d="M34 40 L26 10 L54 26 Z" fill={accent} stroke={lineInk} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M36 34 L32 18 L47 27 Z" fill="#f3c4cd" />
      </g>
      <g>
        <path d="M86 40 L94 10 L66 26 Z" fill={accent} stroke={lineInk} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M84 34 L88 18 L73 27 Z" fill="#f3c4cd" />
      </g>
      {/* head */}
      <circle cx="60" cy="56" r="33" fill="#fff6e8" stroke={lineInk} strokeWidth="2.5" />
      <path d="M27 56 a33 33 0 0 1 66 0 q0 -20 -14 -27 q-19 -10 -38 0 q-14 7 -14 27" fill={accent} />
      {/* forehead stripes */}
      <g stroke={accent} strokeWidth="4" strokeLinecap="round" opacity="0.65">
        <path d="M54 28 v8" />
        <path d="M60 26 v9" />
        <path d="M66 28 v8" />
      </g>
      {/* cheeks */}
      <circle cx="40" cy="64" r="5.5" fill="#f3c4cd" opacity="0.7" />
      <circle cx="80" cy="64" r="5.5" fill="#f3c4cd" opacity="0.7" />
      {/* eyes */}
      <g className="cat-eyes">
        {proud ? (
          <g stroke={ink} strokeWidth="3.5" strokeLinecap="round" fill="none">
            <path d="M41 52 q6 -8 12 0" />
            <path d="M67 52 q6 -8 12 0" />
          </g>
        ) : (
          <g>
            <ellipse cx="47" cy="52" rx="4.5" ry={focused ? 2.6 : curious ? 6.5 : 6} fill={ink} />
            <ellipse cx="73" cy="52" rx="4.5" ry={focused ? 2.6 : 6} fill={ink} />
            <circle cx="48.5" cy="50" r="1.6" fill="#fff" />
            <circle cx="74.5" cy="50" r="1.6" fill="#fff" />
          </g>
        )}
      </g>
      {/* worried / crisis brows */}
      {(worried || crisis) && (
        <g stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M40 42 l12 4" />
          <path d="M80 42 l-12 4" />
        </g>
      )}
      {/* nose + mouth */}
      <path d="M56 61 h8 l-4 5 z" fill="#e2909f" />
      {crisis ? (
        <ellipse cx="60" cy="72" rx="5" ry="6" fill={ink} opacity="0.85" />
      ) : worried ? (
        <path d="M53 74 q7 -6 14 0" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      ) : (
        <g fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round">
          <path d="M60 66 q-4 6 -10 3" />
          <path d="M60 66 q4 6 10 3" />
        </g>
      )}
      {/* whiskers */}
      <g stroke="#c4b3a0" strokeWidth="2.4" strokeLinecap="round" fill="none">
        <path d="M30 60 h-14" />
        <path d="M31 66 l-13 4" />
        <path d="M90 60 h14" />
        <path d="M89 66 l13 4" />
      </g>
    </svg>
  );
}

function ChartCard({ title, help, children }) {
  return (
    <section className="panel chart-card">
      <div className="chart-heading">
        <h3>{title}</h3>
        {help && <span title={help}>?</span>}
      </div>
      {children}
    </section>
  );
}

function LineChart({ data, series }) {
  const width = 560;
  const height = 250;
  const pad = 34;

  const values = data.flatMap((row) => series.map((item) => Number(row[item.key]) || 0));
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(10, ...values);
  const span = maxValue - minValue || 1;

  const xFor = (index) =>
    data.length <= 1 ? width / 2 : pad + (index * (width - pad * 2)) / (data.length - 1);
  const yFor = (value) => height - pad - ((value - minValue) / span) * (height - pad * 2);

  if (!data.length) {
    return <div className="empty-chart">Charts appear after week 1.</div>;
  }

  return (
    <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Trend chart">
      <g className="grid-lines">
        {[0, 0.25, 0.5, 0.75, 1].map((step) => {
          const y = pad + step * (height - pad * 2);
          return <line key={step} x1={pad} x2={width - pad} y1={y} y2={y} />;
        })}
      </g>
      <line className="axis" x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} />
      <line className="axis" x1={pad} x2={pad} y1={pad} y2={height - pad} />
      {series.map((item) => {
        const coords = data.map((row, index) => [xFor(index), yFor(Number(row[item.key]) || 0)]);
        const points = coords.map(([x, y]) => `${x},${y}`).join(" ");
        const areaPath = `M${coords[0][0]},${height - pad} L${points.replaceAll(" ", " L")} L${coords.at(-1)[0]},${height - pad} Z`;
        const gradId = `area-${item.key}`;
        return (
          <g key={item.key} className="chart-series">
            <defs>
              <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={item.color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={item.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradId})`} className="chart-area" />
            <polyline
              points={points}
              fill="none"
              stroke={item.color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="chart-line"
              pathLength="1"
            />
            {coords.map(([x, y], index) => (
              <circle
                key={`${item.key}-${data[index].week}`}
                cx={x}
                cy={y}
                r={index === coords.length - 1 ? 6 : 4}
                fill={item.color}
                className="chart-dot"
                style={{ animationDelay: `${(index / coords.length) * 900}ms` }}
              >
                <title>{`W${data[index].week}: ${Math.round(Number(data[index][item.key]) || 0)}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
      <g className="legend">
        {series.map((item, index) => (
          <g key={item.key} transform={`translate(${pad + index * 120}, 18)`}>
            <rect width="14" height="8" rx="3" fill={item.color} />
            <text x="20" y="8">{item.label}</text>
          </g>
        ))}
      </g>
      <text x={pad} y={height - 8} className="axis-label">W1</text>
      <text x={width - pad} y={height - 8} className="axis-label" textAnchor="end">
        W{data.at(-1)?.week}
      </text>
    </svg>
  );
}

const OPENING_PETALS = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 7.3 + 4) % 100,
  size: 9 + ((i * 5) % 9),
  duration: 11 + ((i * 3.7) % 9),
  delay: -((i * 2.9) % 14),
  drift: 30 + ((i * 13) % 70),
  hue: i % 3
}));

const OPENING_FIREFLIES = Array.from({ length: 8 }, (_, i) => ({
  left: (i * 12.7 + 8) % 92,
  top: 32 + ((i * 9.1) % 48),
  duration: 5.5 + ((i * 1.3) % 4),
  delay: -((i * 1.7) % 6)
}));

function OpeningAmbience() {
  return (
    <div className="opening-ambience" aria-hidden="true">
      <div className="opening-rays" />
      {OPENING_PETALS.map((petal, i) => (
        <span
          key={`petal-${i}`}
          className={`opening-petal opening-petal-${petal.hue}`}
          style={{
            left: `${petal.left}%`,
            "--petal-size": `${petal.size}px`,
            "--petal-duration": `${petal.duration}s`,
            "--petal-delay": `${petal.delay}s`,
            "--petal-drift": `${petal.drift}px`
          }}
        />
      ))}
      {OPENING_FIREFLIES.map((fly, i) => (
        <span
          key={`fly-${i}`}
          className="opening-firefly"
          style={{
            left: `${fly.left}%`,
            top: `${fly.top}%`,
            "--fly-duration": `${fly.duration}s`,
            "--fly-delay": `${fly.delay}s`
          }}
        />
      ))}
    </div>
  );
}

function StartLights() {
  return (
    <svg className="start-lights" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 14 Q300 44 600 20 T1200 18" fill="none" stroke="#5d4936" strokeWidth="2.5" />
      <g className="string-lights">
        {Array.from({ length: 13 }, (_, i) => {
          const x = 40 + i * 93;
          const y = 24 + Math.sin(i * 1.2) * 8 + 10;
          return <circle key={i} cx={x} cy={y} r="6" fill={["#ffe6a1", "#f0a2a8", "#a8bf8a", "#8fc3d9"][i % 4]} />;
        })}
      </g>
    </svg>
  );
}

function WalkingCat() {
  const ink = "#5d4936";
  return (
    <div className="walking-cat" aria-hidden="true">
      <svg viewBox="0 0 140 80">
        {/* tail */}
        <path className="cat-tail" d="M18 42 q-14 -4 -10 -22" fill="none" stroke={ink} strokeWidth="10" strokeLinecap="round" />
        <path className="cat-tail" d="M18 42 q-14 -4 -10 -22" fill="none" stroke="#c99e6a" strokeWidth="6" strokeLinecap="round" />
        {/* legs */}
        <g className="cat-leg-a" stroke={ink} strokeWidth="9" strokeLinecap="round">
          <line x1="40" y1="52" x2="38" y2="72" />
          <line x1="88" y1="52" x2="86" y2="72" />
        </g>
        <g className="cat-leg-b" stroke={ink} strokeWidth="9" strokeLinecap="round">
          <line x1="56" y1="52" x2="58" y2="72" />
          <line x1="104" y1="52" x2="106" y2="72" />
        </g>
        {/* body */}
        <ellipse cx="70" cy="44" rx="52" ry="22" fill="#c99e6a" stroke={ink} strokeWidth="3" />
        {/* head */}
        <circle cx="118" cy="30" r="18" fill="#c99e6a" stroke={ink} strokeWidth="3" />
        <path d="M106 18 l-3 -12 l11 6 z" fill="#c99e6a" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M128 16 l5 -11 l-13 5 z" fill="#c99e6a" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="114" cy="28" r="2.2" fill={ink} />
        <circle cx="124" cy="28" r="2.2" fill={ink} />
        <path d="M116 35 q4 3 8 0" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
        {/* stripes */}
        <g stroke={ink} strokeWidth="3" strokeLinecap="round" opacity="0.5">
          <path d="M52 28 q4 6 0 12" />
          <path d="M66 26 q4 7 0 14" />
          <path d="M80 28 q4 6 0 12" />
        </g>
      </svg>
    </div>
  );
}

function LayeredVillageOpeningScene({ parallax, scroll = 0 }) {
  const { width, height } = layeredVillageManifest.canvas;
  const layers = layeredVillageManifest.layers.filter((layer) => !skippedOpeningLayers.has(layer.id));

  return (
    <div
      className="layered-village-scene"
      style={{
        "--scene-px": `${(-parallax.x * 8).toFixed(2)}px`,
        "--scene-py": `${(-parallax.y * 5 + scroll * -26).toFixed(2)}px`,
        "--scene-zoom": (1 + Math.min(scroll, 1) * 0.06).toFixed(4)
      }}
      aria-hidden="true"
    >
      {layers.map((layer, index) => {
        const src = getVillageLayerSource(layer);
        const depth = Number(layer.parallax) || 0;
        const motionClass = getOpeningLayerMotion(layer);

        if (!src) return null;

        return (
          <span
            key={layer.id}
            className={`layered-village-layer opening-layer-${layer.group} ${toLayerClassName(layer.id)}`}
            style={{
              left: toCanvasPercent(layer.x, width),
              top: toCanvasPercent(layer.y, height),
              width: toCanvasPercent(layer.width, width),
              height: toCanvasPercent(layer.height, height),
              zIndex: layer.zIndex,
              "--layer-px": `${(parallax.x * depth * 44).toFixed(2)}px`,
              "--layer-py": `${(parallax.y * depth * 28).toFixed(2)}px`,
              "--layer-sy": `${(scroll * depth * 120).toFixed(2)}px`,
              "--layer-depth": depth,
              "--layer-delay": `${((index % 9) * -0.43).toFixed(2)}s`,
              "--layer-bob": `${(2 + depth * 9).toFixed(2)}px`,
              "--layer-sway": `${(0.45 + depth * 2.1).toFixed(2)}deg`,
              "--layer-drift-x": `${(depth * 34).toFixed(2)}px`,
              "--layer-drift-y": `${(depth * 18).toFixed(2)}px`
            }}
          >
            <img
              src={src}
              alt=""
              draggable="false"
              className={`layered-village-image ${motionClass}`}
            />
          </span>
        );
      })}
    </div>
  );
}

function CityHeroScene() {
  const ink = "#5d4936";
  return (
    <svg viewBox="0 0 1120 620" className="village-badge cafe-scene opening-panorama" role="img" aria-label="Illustrated supply chain city">
      <defs>
        <linearGradient id="openingSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#eef8f6" />
          <stop offset="0.58" stopColor="#f8f3df" />
          <stop offset="1" stopColor="#e8f1df" />
        </linearGradient>
        <pattern id="openingDots" width="34" height="34" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="1.7" fill="#7d6a55" opacity="0.12" />
          <circle cx="25" cy="22" r="1.2" fill="#b39ddb" opacity="0.16" />
        </pattern>
      </defs>

      <rect x="12" y="12" width="1096" height="596" rx="34" fill="url(#openingSky)" stroke={ink} strokeWidth="4" />
      <rect x="12" y="12" width="1096" height="596" rx="34" fill="url(#openingDots)" opacity="0.65" />

      <circle cx="998" cy="92" r="38" fill="#ffe6a1" stroke={ink} strokeWidth="4" />
      <g className="map-clouds" fill="#ffffff" opacity="0.9">
        <path d="M150 92 a22 22 0 0 1 44 0 a18 18 0 0 1 33 8 h-88 a14 14 0 0 1 11 -8" />
        <path d="M430 70 a20 20 0 0 1 40 0 a15 15 0 0 1 28 7 h-78 a12 12 0 0 1 10 -7" />
        <path d="M795 115 a16 16 0 0 1 32 0 a13 13 0 0 1 23 6 h-66 a10 10 0 0 1 11 -6" />
      </g>
      <g className="map-birds" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round">
        <path d="M616 90 q6 -7 12 0 q6 -7 12 0" />
        <path d="M652 78 q5 -6 10 0 q5 -6 10 0" />
        <path d="M232 138 q5 -6 10 0 q5 -6 10 0" />
      </g>

      <g className="string-lights">
        <path d="M54 162 Q330 126 596 154 T1064 148" fill="none" />
        {Array.from({ length: 14 }, (_, i) => {
          const x = 98 + i * 72;
          const y = 158 + Math.sin(i * 0.9) * 12;
          const colors = ["#ffe6a1", "#f0a2a8", "#a8bf8a", "#8fc3d9", "#b39ddb"];
          return <circle key={i} cx={x} cy={y + 12} r="7" fill={colors[i % colors.length]} />;
        })}
      </g>

      <path d="M12 372 Q164 282 320 322 Q494 366 618 322 Q780 266 1108 330 v278 H12 z" fill="#cfe0c3" stroke={ink} strokeWidth="4" />
      <path d="M12 426 Q180 352 345 392 Q510 432 652 372 Q838 292 1108 358 v250 H12 z" fill="#dbe9cc" opacity="0.76" />

      <g className="opening-leaves" fill="#7d9a5e" stroke={ink} strokeWidth="1.6" opacity="0.72">
        {Array.from({ length: 18 }, (_, i) => (
          <ellipse key={i} cx={82 + i * 55} cy={382 + Math.sin(i) * 42} rx="7" ry="4" transform={`rotate(${i * 23} ${82 + i * 55} ${382 + Math.sin(i) * 42})`} />
        ))}
      </g>

      <g stroke={ink} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
        <path className="route-dash" d="M132 408 C248 362 323 366 418 396 S612 440 700 386 S862 322 1000 368" />
        <path className="route-dash slow" d="M280 458 C388 418 482 432 560 464 S752 502 914 454" />
      </g>

      <g className="farm-cluster">
        <path d="M76 360 q54 -52 116 0 v86 h-116 z" fill="#e8b6be" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
        <path d="M58 360 h154 l-77 -66 z" fill="#d97a86" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
        <rect x="112" y="396" width="42" height="50" fill="#fff6e8" stroke={ink} strokeWidth="3" />
        <rect x="214" y="322" width="46" height="124" rx="23" fill="#f0cc85" stroke={ink} strokeWidth="4" />
        <path d="M214 335 a23 23 0 0 1 46 0" fill="#c99e6a" stroke={ink} strokeWidth="4" />
        <g fill="#f3d899" stroke={ink} strokeWidth="2.5">
          <ellipse cx="68" cy="466" rx="20" ry="12" />
          <ellipse cx="106" cy="468" rx="20" ry="12" />
          <ellipse cx="146" cy="466" rx="20" ry="12" />
        </g>
        <g className="map-steam" fill="#f0a2a8" opacity="0.75">
          <circle cx="118" cy="272" r="8" />
          <circle cx="138" cy="254" r="6" />
          <circle cx="156" cy="270" r="5" />
        </g>
      </g>

      <g className="warehouse-cluster">
        <rect x="318" y="340" width="156" height="92" fill="#f6fbff" stroke={ink} strokeWidth="4" />
        <path d="M296 340 h200 l-30 -52 h-140 z" fill="#8fc3d9" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
        <rect x="342" y="376" width="42" height="56" fill="#c99e6a" stroke={ink} strokeWidth="3" />
        <rect x="404" y="374" width="50" height="28" rx="6" fill="#f0cc85" stroke={ink} strokeWidth="3" />
        <g className="crate-stack" stroke={ink} strokeWidth="2.5">
          <rect x="284" y="430" width="34" height="28" rx="4" fill="#e0b184" />
          <rect x="319" y="424" width="34" height="34" rx="4" fill="#f0cc85" />
          <rect x="354" y="438" width="36" height="24" rx="4" fill="#e8b6be" />
          <path d="M290 444 h22 M326 440 h20 M362 450 h22" />
        </g>
      </g>

      <g className="cafe-cluster">
        <rect x="540" y="304" width="156" height="128" fill="#fff6e8" stroke={ink} strokeWidth="4" />
        <path d="M518 304 h200 l-32 -58 h-134 z" fill="#b39ddb" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
        <g stroke={ink} strokeWidth="3.3">
          {Array.from({ length: 5 }, (_, i) => (
            <path key={i} d={`M${548 + i * 30} 304 h30 v18 a15 15 0 0 1 -30 0 z`} fill={i % 2 ? "#f0a2a8" : "#fff6e8"} />
          ))}
        </g>
        <rect x="572" y="358" width="42" height="74" fill="#8a5a3b" stroke={ink} strokeWidth="3" />
        <rect x="632" y="362" width="42" height="32" rx="6" fill="#dff0f6" stroke={ink} strokeWidth="3" />
        <g className="map-steam" fill="#c9b8e6">
          <circle cx="616" cy="230" r="8" />
          <circle cx="632" cy="214" r="6" />
          <circle cx="598" cy="218" r="5" />
        </g>
        <g stroke={ink} strokeWidth="2.4" fill="#f0cc85">
          <circle cx="536" cy="450" r="8" />
          <circle cx="560" cy="452" r="8" />
          <circle cx="584" cy="450" r="8" />
        </g>
      </g>

      <g className="analytics-cluster">
        <rect x="742" y="240" width="118" height="104" rx="12" fill="#fbf3e2" stroke={ink} strokeWidth="4" />
        <path d="M726 240 h150 l-24 -42 h-102 z" fill="#a8bf8a" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
        <rect x="764" y="266" width="28" height="26" rx="5" fill="#dff0f6" stroke={ink} strokeWidth="3" />
        <rect x="808" y="266" width="28" height="26" rx="5" fill="#ffe6a1" stroke={ink} strokeWidth="3" />
        <path className="chart-spark" d="M762 320 l18 -18 l20 10 l28 -30" fill="none" stroke="#8f74c9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <g className="signal-pop" fill="#f0a2a8" stroke={ink} strokeWidth="2">
          <circle cx="874" cy="210" r="8" />
          <circle cx="896" cy="190" r="6" />
          <circle cx="914" cy="218" r="5" />
        </g>
      </g>

      <g className="customer-cluster">
        {[
          [768, 382, "#e8b6be", "#c96f70"],
          [838, 374, "#f6fbff", "#8fc3d9"],
          [904, 382, "#fff6e8", "#f0cc85"]
        ].map(([x, y, body, roof], i) => (
          <g key={i}>
            <rect x={x} y={y} width="54" height="50" fill={body} stroke={ink} strokeWidth="3" />
            <path d={`M${x - 8} ${y} h70 l-35 -30 z`} fill={roof} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
            <rect x={x + 18} y={y + 24} width="18" height="26" fill="#fff6e8" stroke={ink} strokeWidth="2.5" />
          </g>
        ))}
        <g className="opening-queue" fill="#c99e6a" stroke={ink} strokeWidth="2.6">
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${776 + i * 31} ${464 + (i % 2) * 5})`}>
              <ellipse cx="0" cy="16" rx="13" ry="10" />
              <circle cx="0" cy="0" r="9" />
              <path d="M-7 -6 l-4 -8 l8 4 z" />
              <path d="M7 -6 l4 -8 l-8 4 z" />
              <circle cx="-3" cy="0" r="1.4" fill={ink} stroke="none" />
              <circle cx="4" cy="0" r="1.4" fill={ink} stroke="none" />
            </g>
          ))}
        </g>
      </g>

      <g className="port-cluster">
        <path d="M884 424 h224 v118 h-224 z" fill="#bfe0e8" stroke={ink} strokeWidth="4" />
        <g className="water-waves" stroke="#63a4c0" strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M916 482 q14 -8 28 0 q14 -8 28 0" />
          <path d="M1012 510 q14 -8 28 0 q14 -8 28 0" />
          <path d="M902 528 q10 -6 20 0 q10 -6 20 0" />
        </g>
        <path d="M914 424 v-118 h78 v18 h-58 v100" fill="none" stroke={ink} strokeWidth="9" strokeLinejoin="round" />
        <line x1="984" y1="324" x2="984" y2="368" stroke={ink} strokeWidth="4" />
        <rect x="966" y="368" width="36" height="26" fill="#f0cc85" stroke={ink} strokeWidth="3" />
        <g className="moving-boat">
          <path d="M942 478 h76 l-16 30 h-44 z" fill="#d97a86" stroke={ink} strokeWidth="3" />
          <path d="M982 478 v-50 l38 50 z" fill="#fff6e8" stroke={ink} strokeWidth="3" />
          <animateMotion dur="7.5s" repeatCount="indefinite" path="M-54 8 C0 -10 48 -8 92 4" />
        </g>
      </g>

      <path d="M12 516 C168 500 276 528 430 508 S748 488 1108 506" stroke="#d9c6a3" strokeWidth="38" fill="none" strokeLinecap="round" />
      <path d="M12 516 C168 500 276 528 430 508 S748 488 1108 506" stroke={ink} strokeWidth="2.4" strokeDasharray="18 20" opacity="0.5" fill="none" strokeLinecap="round" />

      <g className="hero-cart">
        <rect x="-26" y="-28" width="58" height="30" rx="7" fill="#f0cc85" stroke={ink} strokeWidth="3.5" />
        <rect x="-17" y="-47" width="26" height="18" rx="4" fill="#e8b6be" stroke={ink} strokeWidth="3" />
        <circle cx="-12" cy="4" r="9" fill="#fff" stroke={ink} strokeWidth="3.5" />
        <circle cx="20" cy="4" r="9" fill="#fff" stroke={ink} strokeWidth="3.5" />
        <animateMotion dur="10s" repeatCount="indefinite" path="M80 508 C226 492 344 524 492 504 S776 484 1042 500" />
      </g>

      <g className="counter-cat opening-sitter">
        <ellipse cx="216" cy="500" rx="25" ry="18" fill="#c99e6a" stroke={ink} strokeWidth="3" />
        <circle cx="216" cy="470" r="18" fill="#c99e6a" stroke={ink} strokeWidth="3" />
        <path d="M203 458 l-5 -14 l14 7 z" fill="#c99e6a" stroke={ink} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M229 458 l6 -14 l-15 7 z" fill="#c99e6a" stroke={ink} strokeWidth="2.6" strokeLinejoin="round" />
        <circle cx="210" cy="469" r="2.3" fill={ink} />
        <circle cx="223" cy="469" r="2.3" fill={ink} />
        <path d="M212 478 q4 4 9 0" fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function CafeHeroScene() {
  const ink = "#5d4936";
  return (
    <svg viewBox="0 0 520 400" className="village-badge cafe-scene" role="img" aria-label="Cozy illustrated cafe scene">
      {/* room */}
      <rect x="10" y="10" width="500" height="380" rx="20" fill="#f4ead2" stroke={ink} strokeWidth="3" />
      {/* striped wallpaper strip */}
      <g opacity="0.55">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x={352 + i * 22} y="14" width="10" height="130" fill={["#e9c6cd", "#cfe0c3", "#f0cc85", "#c9b8e6"][i % 4]} />
        ))}
      </g>
      <line x1="348" y1="146" x2="510" y2="146" stroke={ink} strokeWidth="3" />
      <rect x="348" y="146" width="162" height="90" fill="#cfe0c3" stroke={ink} strokeWidth="3" />
      {/* window with tree */}
      <rect x="34" y="40" width="150" height="170" rx="10" fill="#dff0f6" stroke={ink} strokeWidth="3" />
      <circle cx="80" cy="110" r="38" fill="#b5cf8e" stroke={ink} strokeWidth="3" />
      <circle cx="128" cy="90" r="28" fill="#c4dba0" stroke={ink} strokeWidth="3" />
      <rect x="74" y="140" width="12" height="46" fill="#a67c4d" stroke={ink} strokeWidth="3" />
      <line x1="109" y1="40" x2="109" y2="210" stroke={ink} strokeWidth="3" />
      {/* hanging bulbs */}
      <g className="hanging-bulb">
        <line x1="230" y1="10" x2="230" y2="58" stroke={ink} strokeWidth="3" />
        <circle cx="230" cy="66" r="10" fill="#ffe6a1" stroke={ink} strokeWidth="3" />
      </g>
      <g className="hanging-bulb slow">
        <line x1="292" y1="10" x2="292" y2="42" stroke={ink} strokeWidth="3" />
        <circle cx="292" cy="50" r="9" fill="#ffe6a1" stroke={ink} strokeWidth="3" />
      </g>
      {/* shelf with plant + books */}
      <line x1="376" y1="70" x2="486" y2="70" stroke={ink} strokeWidth="4" />
      <rect x="384" y="46" width="14" height="24" rx="3" fill="#d97a86" stroke={ink} strokeWidth="2.5" />
      <rect x="402" y="42" width="14" height="28" rx="3" fill="#8fc3d9" stroke={ink} strokeWidth="2.5" />
      <path d="M446 70 v-14 q0 -10 10 -10 q10 0 10 10 v14 z" fill="#e0b184" stroke={ink} strokeWidth="2.5" />
      <path d="M456 44 q-8 -12 2 -18 q8 8 -2 18" fill="#7d9a5e" stroke={ink} strokeWidth="2.5" />
      {/* table + stools with pistachio cushions */}
      <g stroke={ink} strokeWidth="3">
        <ellipse cx="272" cy="196" rx="46" ry="12" fill="#f3e3c3" />
        <line x1="272" y1="206" x2="272" y2="252" />
        <path d="M258 252 h28 l6 10 h-40 z" fill="#a67c4d" />
        <ellipse cx="196" cy="238" rx="26" ry="9" fill="#a8bf8a" />
        <path d="M176 244 v20 M216 244 v20" />
        <ellipse cx="348" cy="238" rx="26" ry="9" fill="#a8bf8a" />
        <path d="M328 244 v20 M368 244 v20" />
      </g>
      {/* tiny plant on table */}
      <rect x="264" y="176" width="14" height="12" rx="3" fill="#e0956f" stroke={ink} strokeWidth="2.5" />
      <path d="M271 176 q-6 -10 0 -14 q7 5 0 14" fill="#7d9a5e" stroke={ink} strokeWidth="2" />
      {/* counter */}
      <rect x="10" y="272" width="500" height="30" fill="#e8d9b8" stroke={ink} strokeWidth="3" />
      <rect x="10" y="300" width="500" height="90" fill="#c99e6a" stroke={ink} strokeWidth="3" />
      <g stroke={ink} strokeWidth="2" opacity="0.5">
        <line x1="80" y1="300" x2="80" y2="390" />
        <line x1="180" y1="300" x2="180" y2="390" />
        <line x1="280" y1="300" x2="280" y2="390" />
        <line x1="380" y1="300" x2="380" y2="390" />
      </g>
      {/* chalkboard menu */}
      <rect x="198" y="56" width="92" height="68" rx="6" fill="#516b54" stroke={ink} strokeWidth="3" />
      <g stroke="#f4ead2" strokeWidth="3" strokeLinecap="round" opacity="0.85">
        <line x1="210" y1="72" x2="262" y2="72" />
        <line x1="210" y1="86" x2="276" y2="86" />
        <line x1="210" y1="100" x2="252" y2="100" />
        <line x1="210" y1="112" x2="268" y2="112" />
      </g>
      <circle cx="276" cy="70" r="5" fill="#f0a2a8" stroke="#f4ead2" strokeWidth="1.5" />
      {/* wall clock */}
      <circle cx="322" cy="90" r="15" fill="#fff6e8" stroke={ink} strokeWidth="3" />
      <line className="clock-hand" x1="322" y1="90" x2="322" y2="80" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="322" y1="90" x2="329" y2="92" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      {/* register */}
      <rect x="44" y="228" width="66" height="44" rx="6" fill="#efe6d4" stroke={ink} strokeWidth="3" />
      <rect x="52" y="236" width="50" height="20" rx="4" fill="#6e83a4" stroke={ink} strokeWidth="2.5" />
      {/* barista cat behind the counter */}
      <g className="barista-cat">
        <rect x="134" y="254" width="34" height="20" rx="6" fill="#8fc3d9" stroke={ink} strokeWidth="2.5" />
        <circle cx="151" cy="238" r="17" fill="#e8b6be" stroke={ink} strokeWidth="3" />
        <path d="M139 228 l-4 -12 l12 6 z" fill="#e8b6be" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M161 227 l5 -12 l-13 6 z" fill="#e8b6be" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="146" cy="236" r="2.2" fill={ink} />
        <circle cx="156" cy="236" r="2.2" fill={ink} />
        <path d="M148 243 q3 3 6 0" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
        <circle cx="141" cy="242" r="3" fill="#f3c4cd" opacity="0.8" />
        <circle cx="161" cy="242" r="3" fill="#f3c4cd" opacity="0.8" />
      </g>
      {/* cake display case */}
      <rect x="300" y="226" width="86" height="46" rx="6" fill="rgba(255,255,255,0.55)" stroke={ink} strokeWidth="3" />
      <line x1="300" y1="250" x2="386" y2="250" stroke={ink} strokeWidth="2" opacity="0.6" />
      <path d="M310 250 h20 l-3 -10 h-14 z" fill="#f0a2a8" stroke={ink} strokeWidth="2" />
      <path d="M338 250 h20 l-3 -10 h-14 z" fill="#c99e6a" stroke={ink} strokeWidth="2" />
      <path d="M312 268 h18 l-2 -8 h-14 z" fill="#a8bf8a" stroke={ink} strokeWidth="2" />
      <path d="M340 268 h18 l-2 -8 h-14 z" fill="#f0cc85" stroke={ink} strokeWidth="2" />
      {/* layered drink with cream + strawberry */}
      <g className="hero-drink">
        <path d="M236 214 l6 56 h32 l6 -56 z" fill="#fff" stroke={ink} strokeWidth="3" />
        <path d="M240 244 l2 26 h32 l2 -26 z" fill="#8a5a3b" opacity="0.9" />
        <path d="M238 228 l1 12 h38 l1 -12 z" fill="#e89aa4" />
        <path d="M234 214 q12 -18 24 0 q12 -14 22 0 z" fill="#fff6e8" stroke={ink} strokeWidth="3" />
        <circle cx="252" cy="204" r="6" fill="#e35d6a" stroke={ink} strokeWidth="2.5" />
        <circle cx="264" cy="200" r="5" fill="#e35d6a" stroke={ink} strokeWidth="2.5" />
      </g>
      <g className="map-steam" fill="#c9b8e6">
        <circle cx="258" cy="186" r="5" />
        <circle cx="266" cy="182" r="4" />
        <circle cx="250" cy="180" r="3.5" />
      </g>
      {/* cat sitting on the counter */}
      <g className="counter-cat">
        <path className="cat-tail" d="M438 264 q22 2 20 -20" fill="none" stroke={ink} strokeWidth="10" strokeLinecap="round" />
        <path className="cat-tail" d="M438 264 q22 2 20 -20" fill="none" stroke="#f0cc85" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="420" cy="252" rx="26" ry="20" fill="#f0cc85" stroke={ink} strokeWidth="3" />
        <circle cx="420" cy="222" r="18" fill="#f0cc85" stroke={ink} strokeWidth="3" />
        <path d="M406 212 l-4 -12 l12 6 z" fill="#f0cc85" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M434 212 l4 -12 l-12 6 z" fill="#f0cc85" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="414" cy="220" r="2.2" fill={ink} />
        <circle cx="426" cy="220" r="2.2" fill={ink} />
        <path d="M417 227 q3 3 6 0" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export default App;
