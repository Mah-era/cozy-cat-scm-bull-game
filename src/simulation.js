import { CHARACTER_PROFILES, LOCATION_ACTIVITIES, SITUATIONS, STORY_BRANCH_MESSAGES, TOOLTIPS } from "./gameContent.js";

export function pickSituationId(week) {
  return SITUATIONS[(week * 3 + 1) % SITUATIONS.length].id;
}

export const ACHIEVEMENTS = [
  {
    id: "first-profit",
    icon: "💰",
    name: "First Profit",
    desc: "Close a week in the black.",
    check: (ctx) => ctx.current.profit > 0
  },
  {
    id: "full-house",
    icon: "🏠",
    name: "Full House",
    desc: "Serve 100% of customer demand in a week.",
    check: (ctx) => ctx.current.serviceLevel >= 1 && ctx.current.actualDemand > 0
  },
  {
    id: "whip-whisperer",
    icon: "🎯",
    name: "Whip Whisperer",
    desc: "Keep the bullwhip ratio under 1.3 for a week.",
    check: (ctx) => ctx.current.bullwhipRatio < 1.3
  },
  {
    id: "warm-streak",
    icon: "🔥",
    name: "Warm Streak",
    desc: "Reach a 3-week stability streak.",
    check: (ctx) => ctx.streak >= 3
  },
  {
    id: "golden-ledger",
    icon: "🏆",
    name: "Golden Ledger",
    desc: "Grow the village cash above $12,000.",
    check: (ctx) => ctx.cash >= 12000
  },
  {
    id: "goal-getter",
    icon: "📋",
    name: "Goal Getter",
    desc: "Complete three weekly goals in one season.",
    check: (ctx) => ctx.goalsAchievedCount >= 3
  },
  {
    id: "bean-friend",
    icon: "🐾",
    name: "Friend of Bean",
    desc: "Adopt the stray cat by the cafe door.",
    check: (ctx) => ctx.situationChoiceId === "adopt"
  },
  {
    id: "three-star-week",
    icon: "⭐",
    name: "Three-Star Week",
    desc: "Earn a 3-star weekly rating.",
    check: (ctx) => ctx.current.weekStars >= 3
  }
];

/* ===== Per-location leveling ===== */

export const LEVEL_THRESHOLDS = [0, 60, 150, 280, 460];
export const MAX_LOCATION_LEVEL = 5;

export const LOCATION_PERKS = {
  supplier: { label: "Purchase cost", perLevel: "-3% per level" },
  warehouse: { label: "Holding cost", perLevel: "-6% per level" },
  retail: { label: "Selling price", perLevel: "+2% per level" },
  customer: { label: "Demand noise", perLevel: "-5% per level" },
  port: { label: "Delay risk", perLevel: "-6% per level" },
  analytics: { label: "Bullwhip risk", perLevel: "-5% per level" }
};

export function initialLocationLevels() {
  return Object.fromEntries(LOCATIONS.map((location) => [location.id, { level: 1, xp: 0 }]));
}

export function xpForNextLevel(level) {
  return LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)];
}

// Mutates the given levels object; returns the new level if a level-up happened, else 0.
export function grantXp(levels, locationId, amount) {
  const entry = levels[locationId] ?? { level: 1, xp: 0 };
  let { level, xp } = entry;
  xp += amount;
  let leveled = 0;
  while (level < MAX_LOCATION_LEVEL && xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level += 1;
    leveled = level;
  }
  levels[locationId] = { level, xp };
  return leveled;
}

function levelBonus(state, locationId) {
  return ((state.locationLevels?.[locationId]?.level ?? 1) - 1);
}

/* ===== Real-time city tick ===== */

const TICK_FLAVOR = [
  { locationId: "supplier", text: "Fresh harvest crate", xp: 4 },
  { locationId: "warehouse", text: "Shelves re-sorted", xp: 4 },
  { locationId: "port", text: "Cart rolled through", xp: 4 },
  { locationId: "customer", text: "New regular spotted", xp: 5 },
  { locationId: "analytics", text: "Signal logged", xp: 4 }
];

export function cityTick(state) {
  if (!state || state.screen === "final") return { state, events: [] };
  const events = [];
  const levels = { ...(state.locationLevels ?? initialLocationLevels()) };
  let cash = state.cash;

  // Cafe tips trickle in while the city is alive
  if (Math.random() < 0.72) {
    const tip = Math.round(2 + Math.random() * 5 + (state.satisfaction ?? 80) / 25);
    cash = round(cash + tip);
    events.push({ locationId: "retail", text: `+$${tip}`, kind: "cash" });
    const lvl = grantXp(levels, "retail", 3);
    if (lvl) events.push({ locationId: "retail", text: `Cafe reached Lv${lvl}!`, kind: "levelup", level: lvl });
  }

  // Ambient location activity earns XP
  if (Math.random() < 0.62) {
    const flavor = TICK_FLAVOR[Math.floor(Math.random() * TICK_FLAVOR.length)];
    events.push({ locationId: flavor.locationId, text: `+${flavor.xp} XP`, kind: "xp" });
    const lvl = grantXp(levels, flavor.locationId, flavor.xp);
    if (lvl) {
      const name = LOCATIONS.find((item) => item.id === flavor.locationId)?.name ?? flavor.locationId;
      events.push({ locationId: flavor.locationId, text: `${name} reached Lv${lvl}!`, kind: "levelup", level: lvl });
    }
  }

  return { state: { ...state, cash, locationLevels: levels }, events };
}

export function gradeForScore(score) {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 68) return "B";
  if (score >= 55) return "C";
  return "D";
}

export function starsForScore(score) {
  if (score >= 85) return 3;
  if (score >= 70) return 2;
  if (score >= 55) return 1;
  return 0;
}

export const DIFFICULTIES = {
  beginner: {
    label: "Beginner",
    subtitle: "Guided cafe opening",
    weeks: 12,
    baseDemand: 58,
    trend: 1.2,
    volatility: 0.12,
    leadTimeBase: 1,
    leadTimeVariation: 1,
    delayProbability: 0.08,
    eventFrequency: 0.3,
    holdingCost: 0.75,
    stockoutPenalty: 5,
    purchaseCost: 5,
    sellingPrice: 11,
    orderingCost: 30,
    disruptionCost: 70,
    startingCash: 9000,
    startingInventory: 120,
    forecastHint: true
  },
  medium: {
    label: "Medium",
    subtitle: "Busy village season",
    weeks: 16,
    baseDemand: 64,
    trend: 1.8,
    volatility: 0.18,
    leadTimeBase: 2,
    leadTimeVariation: 1,
    delayProbability: 0.16,
    eventFrequency: 0.42,
    holdingCost: 1.05,
    stockoutPenalty: 7,
    purchaseCost: 5.25,
    sellingPrice: 11,
    orderingCost: 38,
    disruptionCost: 105,
    startingCash: 7800,
    startingInventory: 105,
    forecastHint: true
  },
  hard: {
    label: "Hard",
    subtitle: "Festival volatility",
    weeks: 20,
    baseDemand: 70,
    trend: 2.2,
    volatility: 0.25,
    leadTimeBase: 2,
    leadTimeVariation: 2,
    delayProbability: 0.25,
    eventFrequency: 0.55,
    holdingCost: 1.35,
    stockoutPenalty: 9,
    purchaseCost: 5.5,
    sellingPrice: 11.25,
    orderingCost: 45,
    disruptionCost: 150,
    startingCash: 6900,
    startingInventory: 90,
    forecastHint: false
  },
  expert: {
    label: "Very Analytical / Expert",
    subtitle: "Tight margins and noisy signals",
    weeks: 24,
    baseDemand: 76,
    trend: 2.5,
    volatility: 0.32,
    leadTimeBase: 3,
    leadTimeVariation: 2,
    delayProbability: 0.34,
    eventFrequency: 0.68,
    holdingCost: 1.7,
    stockoutPenalty: 12,
    purchaseCost: 5.8,
    sellingPrice: 11.5,
    orderingCost: 55,
    disruptionCost: 220,
    startingCash: 6200,
    startingInventory: 78,
    forecastHint: false
  }
};

export const DEFAULT_CHARACTERS = [
  {
    id: "miso",
    name: "Miso",
    avatar: "M",
    accent: "#8c6ce7",
    role: "SCM advisor and guide",
    place: "Analytics Office",
    personality: "Soft-spoken, pattern-obsessed, and gently direct.",
    status: "Watching demand signals",
    kpiLabel: "Recommendation confidence",
    kpiValue: "Ready"
  },
  {
    id: "luna",
    name: "Luna",
    avatar: "L",
    accent: "#de7faf",
    role: "Supplier Manager",
    place: "Supplier Farm",
    personality: "Practical grower who protects production capacity.",
    status: "Checking lavender harvest",
    kpiLabel: "Supply reliability",
    kpiValue: "Stable"
  },
  {
    id: "theo",
    name: "Theo",
    avatar: "T",
    accent: "#74a8d8",
    role: "Warehouse Manager",
    place: "Central Warehouse",
    personality: "Methodical keeper of inventory and safety stock.",
    status: "Balancing shelf space",
    kpiLabel: "Inventory discipline",
    kpiValue: "Balanced"
  },
  {
    id: "ivy",
    name: "Ivy",
    avatar: "I",
    accent: "#70ba91",
    role: "Retail Manager",
    place: "Lavender Cafe Retail Store",
    personality: "Customer-focused, quick to spot demand changes.",
    status: "Preparing pastries",
    kpiLabel: "Service level focus",
    kpiValue: "Warm"
  },
  {
    id: "noah",
    name: "Noah",
    avatar: "N",
    accent: "#d79c5a",
    role: "Logistics Coordinator",
    place: "Port/Transport Hub",
    personality: "Calm route planner who anticipates lead-time shocks.",
    status: "Reading route boards",
    kpiLabel: "Lead-time control",
    kpiValue: "Alert"
  }
];

export const LOCATIONS = [
  {
    id: "supplier",
    name: "Supplier Farm",
    characterId: "luna",
    kpi: "Supply reliability",
    action: "Review supplier risk"
  },
  {
    id: "warehouse",
    name: "Central Warehouse",
    characterId: "theo",
    kpi: "Ending inventory",
    action: "Set safety stock"
  },
  {
    id: "retail",
    name: "Lavender Cafe Retail Store",
    characterId: "ivy",
    kpi: "Service level",
    action: "Review sales floor"
  },
  {
    id: "customer",
    name: "Customer District",
    characterId: "ivy",
    kpi: "Customer demand",
    action: "Read demand signals"
  },
  {
    id: "port",
    name: "Port/Transport Hub",
    characterId: "noah",
    kpi: "Lead time",
    action: "Check routes"
  },
  {
    id: "analytics",
    name: "Analytics Office",
    characterId: "miso",
    kpi: "Bullwhip ratio",
    action: "Ask Miso"
  }
];

export const FIELD_COMMANDS = {
  supplier: {
    id: "supplier-surge",
    name: "Harvest Surge",
    tag: "Supplier Command",
    cost: 650,
    description: "Luna opens an emergency harvest shift. Adds a large shipment to the near pipeline."
  },
  warehouse: {
    id: "warehouse-reserve",
    name: "Reserve Release",
    tag: "Warehouse Command",
    cost: 320,
    description: "Theo releases protected reserve stock into active inventory immediately."
  },
  retail: {
    id: "retail-preorders",
    name: "Preorder Push",
    tag: "Retail Command",
    cost: 180,
    description: "Ivy creates preorder bundles. Next week demand rises, but satisfaction jumps."
  },
  customer: {
    id: "customer-smooth",
    name: "Demand Smoothing",
    tag: "Customer Command",
    cost: 220,
    description: "The cafe gathers early signals. Next week demand noise is sharply reduced."
  },
  port: {
    id: "port-reroute",
    name: "Route Reroute",
    tag: "Logistics Command",
    cost: 280,
    description: "Noah redirects carts through the fastest bridge. All open shipments move sooner."
  },
  analytics: {
    id: "analytics-war-room",
    name: "Miso Control Room",
    tag: "Analytics Command",
    cost: 160,
    description: "Miso runs a planning room. Next week volatility and disruption impact are reduced."
  }
};

const EVENTS = [
  {
    type: "demand",
    title: "Mooncake Festival Rush",
    description:
      "Lanterns fill the village square and lavender pastries become the week's favorite treat.",
    demandMultiplier: 1.35,
    cost: 0
  },
  {
    type: "supplier",
    title: "Supplier Farm Delay",
    description:
      "A harvest batch needs extra sorting, so new orders may take longer to arrive.",
    demandMultiplier: 1,
    extraLeadTime: 1,
    cost: 0
  },
  {
    type: "weather",
    title: "Rainy Route Disruption",
    description:
      "Warm rain slows the bridge route between the port and the warehouse.",
    demandMultiplier: 0.96,
    extraLeadTime: 1,
    costMultiplier: 1
  },
  {
    type: "market",
    title: "Lavender Pastry Trend",
    description:
      "A local review makes lavender scones trend upward, but the signal may be temporary.",
    demandMultiplier: 1.18,
    cost: 0
  },
  {
    type: "quality",
    title: "Supplier Quality Check",
    description:
      "Some incoming stock fails inspection and cannot be sold this week.",
    demandMultiplier: 1,
    qualityLossRate: 0.12,
    cost: 0
  },
  {
    type: "demand",
    title: "Cat Parade Weekend",
    description:
      "A traveling cat parade marches past the cafe and every visitor wants a lavender treat for the road.",
    demandMultiplier: 1.5,
    cost: 0
  },
  {
    type: "market",
    title: "Calm Misty Morning",
    description:
      "A quiet mist settles over the village. Fewer visitors, but the ones who come are patient and predictable.",
    demandMultiplier: 0.88,
    cost: 0
  }
];

export const WEEKLY_GOALS = [
  {
    id: "service-star",
    label: "Service Star",
    description: "Finish the week with a service level of 92% or higher.",
    reward: 260,
    check: (row) => row.serviceLevel >= 0.92
  },
  {
    id: "sharp-forecast",
    label: "Sharp Forecast",
    description: "Keep forecast error within 12% of actual demand.",
    reward: 240,
    check: (row) => row.absoluteForecastError <= Math.max(6, row.actualDemand * 0.12)
  },
  {
    id: "calm-orders",
    label: "Calm Orders",
    description: "Place an order within 30% of your forecast — no panic ordering.",
    reward: 220,
    check: (row) => row.orderQty <= row.forecast * 1.3 && row.orderQty >= row.forecast * 0.5
  },
  {
    id: "lean-shelves",
    label: "Lean Shelves",
    description: "End the week with inventory below 1.6× demand and zero stockouts.",
    reward: 280,
    check: (row) => row.stockout === 0 && row.endingInventory < row.actualDemand * 1.6
  },
  {
    id: "profit-week",
    label: "Profitable Week",
    description: "Close the week with positive profit.",
    reward: 200,
    check: (row) => row.profit > 0
  },
  {
    id: "whip-tamer",
    label: "Whip Tamer",
    description: "Keep the bullwhip ratio under 1.8 this week.",
    reward: 300,
    check: (row) => row.bullwhipRatio < 1.8
  }
];

export function pickWeeklyGoal(week) {
  return WEEKLY_GOALS[(week * 7 + 3) % WEEKLY_GOALS.length];
}

export function initialState(difficultyKey, characters = DEFAULT_CHARACTERS) {
  const difficulty = DIFFICULTIES[difficultyKey];
  return {
    screen: "map",
    difficultyKey,
    week: 1,
    maxWeeks: difficulty.weeks,
    inventory: difficulty.startingInventory,
    cash: difficulty.startingCash,
    pipeline: [],
    history: [],
    satisfaction: 88,
    supplierTrust: 80,
    supplierContract: "Reliable Batch",
    qualityRiskModifier: 1,
    delayRiskModifier: 1,
    warehouseMode: "Balanced Flow",
    warehouseEfficiency: 50,
    holdingCostModifier: 1,
    serviceBoostModifier: 0,
    cafePromotion: "Calm Shelf",
    priceModifier: 1,
    demandModifier: 1,
    reputationRisk: 1,
    demandSignalChoice: "Miso Weighted Signal",
    signalAccuracyModifier: 1,
    futureDemandNoise: 1,
    routeChoice: "Safe Canal",
    leadTimeModifier: 0,
    routeRisk: 1,
    routeShutdownRisk: 0,
    forecastMethod: "Smooth forecast",
    misoConfidence: 72,
    bullwhipRiskModifier: 1,
    customerReputation: 85,
    routeStability: 80,
    customerPatience: 80,
    villageReputation: 85,
    storyFlags: {},
    storyChapter: "Opening Season",
    storyBranch: "Stable Planner Path",
    locationActivityResults: [],
    completedActivitiesThisWeek: {},
    decisionImpactTrail: [],
    mapNodeStates: {},
    weeklyBonuses: [],
    weeklyPenalties: [],
    activeActivityModifiers: {},
    lastCauseEffects: [],
    selectedLocationId: "analytics",
    stabilityStreak: 0,
    bestStreak: 0,
    weeklyGoal: pickWeeklyGoal(1),
    lastGoalResult: null,
    currentSituationId: pickSituationId(1),
    lastSituationResult: null,
    achievements: [],
    lastUnlocked: [],
    totalStars: 0,
    goalsAchievedCount: 0,
    locationLevels: initialLocationLevels(),
    lastLevelUps: [],
    operationalHeat: 34,
    activeModifiers: {},
    activityLog: [
      "Village control room online. Routes, shelves, customers, and farm signals are live."
    ],
    lastEvent: null,
    lastAdvice:
      "Welcome to Bullwhip Village. Forecast calmly, avoid overreacting to one noisy week, and keep a safety stock cushion.",
    characters
  };
}

export function getSuggestedForecast(history, difficultyKey, week = 1) {
  const difficulty = DIFFICULTIES[difficultyKey];
  if (!history.length) return Math.round(difficulty.baseDemand + difficulty.trend * week);

  const recent = history.slice(-4);
  const weighted = recent.reduce((sum, row, index) => sum + row.actualDemand * (index + 1), 0);
  const weightTotal = recent.reduce((sum, _, index) => sum + index + 1, 0);
  const trendSignal =
    recent.length > 1 ? recent[recent.length - 1].actualDemand - recent[0].actualDemand : difficulty.trend;

  return Math.max(0, Math.round(weighted / weightTotal + trendSignal * 0.25));
}

export function getSuggestedOrder(history, inventory, pipeline, forecast, difficultyKey) {
  const difficulty = DIFFICULTIES[difficultyKey];
  const pipelineQty = pipeline.reduce((sum, order) => sum + order.qty, 0);
  const safetyStock = Math.round(forecast * (0.25 + difficulty.volatility));
  const target = Math.round(forecast * difficulty.leadTimeBase + safetyStock);
  return Math.max(0, target - inventory - pipelineQty);
}

export const VILLAGE_ACTIONS = [
  {
    id: "steady",
    name: "Steady Planner",
    icon: "◇",
    description: "Save cash and keep the chain steady when signals look calm.",
    cost: 0
  },
  {
    id: "expedite",
    name: "Expedite Cart",
    icon: "↗",
    description: "Spend cash to reduce the next shipment lead time by one week.",
    cost: 120
  },
  {
    id: "quality",
    name: "Quality Tasting",
    icon: "✓",
    description: "Inspect incoming stock and block quality loss this week.",
    cost: 90
  },
  {
    id: "demand-shaping",
    name: "Cafe Specials",
    icon: "✦",
    description: "Use preorders to soften sudden demand spikes and noise.",
    cost: 80
  },
  {
    id: "safety-stock",
    name: "Shelf Prep",
    icon: "+",
    description: "Prepare shelf labor and gain satisfaction when service is solid.",
    cost: 60
  }
];

function randomNormalish() {
  return (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2;
}

function chooseEvent(difficulty) {
  if (Math.random() > difficulty.eventFrequency) return null;
  return EVENTS[Math.floor(Math.random() * EVENTS.length)];
}

function variance(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function calculateBalancedScore({
  profit,
  serviceLevel,
  bullwhipRatio,
  satisfaction,
  stockout,
  villageReputation = 85,
  supplierTrust = 80,
  customerReputation = 85,
  routeStability = 80
}) {
  const profitScore = Math.max(0, Math.min(100, 50 + profit / 45));
  const serviceScore = Math.max(0, Math.min(100, serviceLevel * 100));
  const bullwhipScore = Math.max(0, Math.min(100, 100 - Math.max(0, bullwhipRatio - 1) * 22));
  const stockoutScore = Math.max(0, 100 - stockout * 2.5);
  const stabilityScore = (villageReputation + supplierTrust + customerReputation + routeStability) / 4;
  return round(
    profitScore * 0.22 +
      serviceScore * 0.23 +
      bullwhipScore * 0.2 +
      satisfaction * 0.12 +
      stabilityScore * 0.18 +
      stockoutScore * 0.05
  );
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function addPct(current = 1, next = 1) {
  return round(current * next, 4);
}

function mergeActivityModifiers(base = {}, effects = {}) {
  const merged = { ...base };
  for (const [key, value] of Object.entries(effects)) {
    if (key.endsWith("Modifier") || key === "routeRisk" || key === "futureDemandNoise") {
      merged[key] = addPct(merged[key] ?? 1, value);
    } else if (
      [
        "satisfactionBoost",
        "operationsHeat",
        "supplierTrust",
        "customerReputation",
        "customerPatience",
        "routeStability",
        "warehouseEfficiency",
        "misoConfidence",
        "leadTimeModifier"
      ].includes(key)
    ) {
      merged[key] = (merged[key] ?? 0) + value;
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

export function createCauseEffect(decision, effect, characterId) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    decision,
    affectedKpi: effect.affectedKpi,
    immediateEffect: effect.immediateEffect,
    futureRisk: effect.futureRisk,
    characterId,
    reaction: effect.reaction ?? "focused"
  };
}

export function updateCauseEffect(decision, effect, characterId) {
  return createCauseEffect(decision, effect, characterId);
}

export function applyLocationActivity(state, locationId, choiceId) {
  const activity = LOCATION_ACTIVITIES[locationId];
  const choice = activity?.choices.find((item) => item.id === choiceId);
  if (!activity || !choice) return state;

  const repeatCount = state.completedActivitiesThisWeek?.[locationId] ?? 0;
  const repeatPenalty = repeatCount * 60;
  const effects = choice.effects;
  const nextModifiers = mergeActivityModifiers(state.activeActivityModifiers ?? {}, effects);
  const cost = 40 + repeatPenalty;
  const characterId = activity.characterId;
  const result = {
    week: state.week,
    locationId,
    choiceId,
    choiceName: choice.name,
    activityTitle: activity.title,
    stamp: choice.stamp,
    cost
  };

  const causeEffect = createCauseEffect(
    `${activity.title}: ${choice.name}`,
    {
      affectedKpi: choice.stamp,
      immediateEffect: choice.description,
      futureRisk: repeatCount > 0 ? "Repeating the same activity this week costs more cash." : "This modifier will shape the next weekly result.",
      reaction: effects.operationsHeat > 8 || effects.routeStability < -5 ? "worried" : "proud"
    },
    characterId
  );

  const activityLevels = { ...(state.locationLevels ?? initialLocationLevels()) };
  grantXp(activityLevels, locationId, 18);

  let next = {
    ...state,
    cash: round(state.cash - cost),
    locationLevels: activityLevels,
    supplierContract: effects.supplierContract ?? state.supplierContract,
    qualityRiskModifier: effects.qualityRiskModifier ?? state.qualityRiskModifier,
    delayRiskModifier: effects.delayRiskModifier ?? state.delayRiskModifier,
    warehouseMode: effects.warehouseMode ?? state.warehouseMode,
    warehouseEfficiency: clamp((state.warehouseEfficiency ?? 50) + (effects.warehouseEfficiency ?? 0)),
    holdingCostModifier: effects.holdingCostModifier ?? state.holdingCostModifier,
    serviceBoostModifier: effects.serviceBoostModifier ?? state.serviceBoostModifier,
    cafePromotion: effects.cafePromotion ?? state.cafePromotion,
    priceModifier: effects.priceModifier ?? state.priceModifier,
    demandModifier: effects.demandModifier ?? state.demandModifier,
    reputationRisk: effects.reputationRisk ?? state.reputationRisk,
    demandSignalChoice: effects.demandSignalChoice ?? state.demandSignalChoice,
    signalAccuracyModifier: effects.signalAccuracyModifier ?? state.signalAccuracyModifier,
    futureDemandNoise: effects.futureDemandNoise ?? state.futureDemandNoise,
    routeChoice: effects.routeChoice ?? state.routeChoice,
    leadTimeModifier: effects.leadTimeModifier ?? state.leadTimeModifier,
    routeRisk: effects.routeRisk ?? state.routeRisk,
    forecastMethod: effects.forecastMethod ?? state.forecastMethod,
    misoConfidence: clamp((state.misoConfidence ?? 72) + (effects.misoConfidence ?? 0)),
    bullwhipRiskModifier: effects.bullwhipRiskModifier ?? state.bullwhipRiskModifier,
    supplierTrust: clamp((state.supplierTrust ?? 80) + (effects.supplierTrust ?? 0)),
    customerReputation: clamp((state.customerReputation ?? 85) + (effects.customerReputation ?? 0)),
    customerPatience: clamp((state.customerPatience ?? 80) + (effects.customerPatience ?? 0)),
    routeStability: clamp((state.routeStability ?? 80) + (effects.routeStability ?? 0)),
    villageReputation: clamp((state.villageReputation ?? 85) + Math.round(((effects.customerReputation ?? 0) + (effects.supplierTrust ?? 0)) / 3)),
    operationalHeat: clamp((state.operationalHeat ?? 34) + (effects.operationsHeat ?? 0) + repeatCount * 6),
    activeActivityModifiers: nextModifiers,
    locationActivityResults: [result, ...(state.locationActivityResults ?? [])].slice(0, 12),
    completedActivitiesThisWeek: {
      ...(state.completedActivitiesThisWeek ?? {}),
      [locationId]: repeatCount + 1
    },
    lastCauseEffects: [causeEffect],
    decisionImpactTrail: [causeEffect, ...(state.decisionImpactTrail ?? [])].slice(0, 10),
    activityLog: [
      `${activity.title}: ${choice.name} applied. ${choice.description}`,
      ...(state.activityLog ?? [])
    ].slice(0, 8),
    lastAdvice: `Miso notes: ${choice.name} is now pinned to this week's board. Check active modifiers before confirming the week.`
  };

  if (effects.expeditePipeline) {
    next.pipeline = state.pipeline.map((order) => ({
      ...order,
      weeksRemaining: Math.max(1, order.weeksRemaining - 1)
    }));
  }

  return next;
}

export function simulateWeek(state, decision) {
  const difficulty = DIFFICULTIES[state.difficultyKey];
  const modifiers = {
    ...(state.activeModifiers ?? {}),
    ...(state.activeActivityModifiers ?? {})
  };
  const situation = SITUATIONS.find((item) => item.id === state.currentSituationId) ?? null;
  const situationChoice = situation?.choices.find((item) => item.id === decision.situationChoiceId) ?? null;
  const sitFx = situationChoice?.effects ?? {};
  for (const [key, value] of Object.entries(sitFx)) {
    if (["leadTimeModifier", "serviceBoostModifier", "satisfactionBoost"].includes(key)) {
      modifiers[key] = (modifiers[key] ?? 0) + value;
    } else if (key.endsWith("Modifier") || key === "volatilityMultiplier" || key === "routeRisk") {
      modifiers[key] = (modifiers[key] ?? 1) * value;
    }
  }
  const situationInventory = sitFx.bonusInventory ?? 0;
  const situationCost = sitFx.cashCost ?? 0;
  // Location level perks
  modifiers.purchaseCostModifier = (modifiers.purchaseCostModifier ?? 1) * (1 - 0.03 * levelBonus(state, "supplier"));
  modifiers.holdingCostModifier = (modifiers.holdingCostModifier ?? 1) * (1 - 0.06 * levelBonus(state, "warehouse"));
  modifiers.priceModifier = (modifiers.priceModifier ?? 1) * (1 + 0.02 * levelBonus(state, "retail"));
  modifiers.volatilityMultiplier = (modifiers.volatilityMultiplier ?? 1) * (1 - 0.05 * levelBonus(state, "customer"));
  modifiers.delayRiskModifier = (modifiers.delayRiskModifier ?? 1) * (1 - 0.06 * levelBonus(state, "port"));
  modifiers.bullwhipRiskModifier = (modifiers.bullwhipRiskModifier ?? 1) * (1 - 0.05 * levelBonus(state, "analytics"));
  const trustDelayMultiplier = (state.supplierTrust ?? 80) < 50 ? 1.35 : (state.supplierTrust ?? 80) > 85 ? 0.82 : 1;
  const routeDelayMultiplier = (state.routeStability ?? 80) < 45 ? 1.45 : (state.routeStability ?? 80) > 85 ? 0.84 : 1;
  const heatRiskMultiplier = (state.operationalHeat ?? 34) > 80 ? 1.28 : 1;
  const forecast = Math.max(0, Number(decision.forecast) || 0);
  const orderQty = Math.max(0, Number(decision.orderQty) || 0);
  const action = VILLAGE_ACTIONS.find((item) => item.id === decision.actionId) ?? VILLAGE_ACTIONS[0];

  const event = chooseEvent(difficulty);
  const baseDemandModifier = (state.demandModifier ?? 1) * (modifiers.demandModifier ?? 1);
  const eventMultiplier =
    action.id === "demand-shaping"
      ? 1 + (((event?.demandMultiplier ?? 1) * baseDemandModifier) - 1) * 0.55
      : (event?.demandMultiplier ?? 1) * baseDemandModifier;
  const volatilityFactor =
    (action.id === "demand-shaping" ? 0.72 : 1) *
    (modifiers.volatilityMultiplier ?? 1) *
    (state.futureDemandNoise ?? 1);
  const noise = randomNormalish() * difficulty.volatility * volatilityFactor;
  const demandBeforeEvent = difficulty.baseDemand + difficulty.trend * state.week;
  const actualDemand = Math.max(
    0,
    Math.round(demandBeforeEvent * eventMultiplier * (1 + noise))
  );

  const arrivedOrders = [];
  const updatedPipeline = state.pipeline
    .map((order) => ({ ...order, weeksRemaining: order.weeksRemaining - 1 }))
    .filter((order) => {
      if (order.weeksRemaining <= 0) {
        arrivedOrders.push(order);
        return false;
      }
      return true;
    });

  let incoming = arrivedOrders.reduce((sum, order) => sum + order.qty, 0);
  const qualityLossRate =
    (event?.qualityLossRate ?? 0) *
    (state.qualityRiskModifier ?? 1) *
    (modifiers.qualityRiskModifier ?? 1);
  if (qualityLossRate && incoming > 0 && action.id !== "quality" && !modifiers.qualityShield) {
    incoming = Math.max(0, Math.round(incoming * (1 - qualityLossRate)));
  }

  const availableInventory = state.inventory + incoming + situationInventory;
  const serviceBoost = (state.serviceBoostModifier ?? 0) + (modifiers.serviceBoostModifier ?? 0);
  const emergencyProcurement =
    availableInventory < actualDemand * 0.35 && actualDemand > difficulty.baseDemand * 0.9
      ? Math.min(Math.round(actualDemand * 0.22), Math.max(0, actualDemand - availableInventory))
      : 0;
  const fulfilledDemand = Math.min(availableInventory + emergencyProcurement, Math.round(actualDemand * (1 + serviceBoost)));
  const stockout = actualDemand - fulfilledDemand;
  const endingInventory = Math.max(0, availableInventory + emergencyProcurement - fulfilledDemand);

  const serviceLevel = actualDemand === 0 ? 1 : fulfilledDemand / actualDemand;
  const forecastError = actualDemand - forecast;
  const absoluteForecastError = Math.abs(forecastError);
  const holdingCost =
    endingInventory * difficulty.holdingCost * (state.holdingCostModifier ?? 1) * (modifiers.holdingCostModifier ?? 1);
  const reputationPenaltyMultiplier = (state.reputationRisk ?? 1) * ((state.customerPatience ?? 80) < 50 ? 1.35 : 1);
  const stockoutCost = stockout * difficulty.stockoutPenalty * reputationPenaltyMultiplier;
  const orderingCost = orderQty > 0 ? difficulty.orderingCost : 0;
  const purchaseCost =
    orderQty * difficulty.purchaseCost * (state.purchaseCostModifier ?? 1) * (modifiers.purchaseCostModifier ?? 1);
  const logisticsCostModifier = (state.logisticsCostModifier ?? 1) * (modifiers.logisticsCostModifier ?? 1);
  const disruptionCost = event?.costMultiplier ? difficulty.disruptionCost * event.costMultiplier * logisticsCostModifier : 0;
  const actionCost = action.cost;
  const emergencyProcurementCost = emergencyProcurement * difficulty.purchaseCost * 2.4;
  const revenue = fulfilledDemand * difficulty.sellingPrice * (state.priceModifier ?? 1) * (modifiers.priceModifier ?? 1);
  const profit =
    revenue - purchaseCost - holdingCost - stockoutCost - orderingCost - disruptionCost - actionCost - emergencyProcurementCost - situationCost;

  const leadTimeJitter = Math.floor(Math.random() * (difficulty.leadTimeVariation + 1));
  const adjustedDelayProbability = Math.min(
    0.92,
    difficulty.delayProbability *
      (state.delayRiskModifier ?? 1) *
      (modifiers.delayRiskModifier ?? 1) *
      trustDelayMultiplier *
      routeDelayMultiplier *
      heatRiskMultiplier *
      (state.routeRisk ?? 1) *
      (modifiers.routeRisk ?? 1)
  );
  const randomDelay = Math.random() < adjustedDelayProbability ? 1 : 0;
  const eventDelay = modifiers.delayShield ? 0 : event?.extraLeadTime ?? 0;
  const actionLeadTimeReduction = action.id === "expedite" ? 1 : 0;
  const leadTime = Math.max(
    1,
    difficulty.leadTimeBase +
      leadTimeJitter +
      randomDelay +
      eventDelay +
      (state.leadTimeModifier ?? 0) +
      (modifiers.leadTimeModifier ?? 0) -
      actionLeadTimeReduction
  );
  const newPipeline =
    orderQty > 0
      ? [...updatedPipeline, { qty: orderQty, weeksRemaining: leadTime, placedWeek: state.week }]
      : updatedPipeline;

  const historyWithCurrentRaw = [
    ...state.history,
    {
      week: state.week,
      actualDemand,
      forecast,
      orderQty,
      beginningInventory: state.inventory,
      incoming,
      availableInventory,
      fulfilledDemand,
      stockout,
      endingInventory,
      leadTime,
      revenue,
      purchaseCost,
      holdingCost,
      stockoutCost,
      orderingCost,
      disruptionCost,
      actionCost,
      emergencyProcurement,
      emergencyProcurementCost,
      profit,
      serviceLevel,
      forecastError,
      absoluteForecastError,
      eventTitle: event?.title ?? "Quiet Market Week",
      eventDescription:
        event?.description ??
        "The village hums along with normal cafe traffic and steady supplier conditions.",
      actionName: action.name
    }
  ];

  const demandVariance = variance(historyWithCurrentRaw.map((row) => row.actualDemand));
  const orderVariance = variance(historyWithCurrentRaw.map((row) => row.orderQty));
  const bullwhipRatio =
    (demandVariance <= 0.01 ? (orderVariance > 0 ? 99 : 1) : orderVariance / demandVariance) *
    (state.bullwhipRiskModifier ?? 1) *
    (modifiers.bullwhipRiskModifier ?? 1);
  const satisfactionDelta =
    serviceLevel >= 0.95
      ? action.id === "safety-stock"
        ? 3
        : 2
      : serviceLevel >= 0.85
        ? action.id === "safety-stock"
          ? 1
          : 0
        : -Math.round(stockout / 4) - 2;
  const newSatisfaction = Math.max(
    0,
    Math.min(
      100,
      state.satisfaction +
        satisfactionDelta +
        (modifiers.satisfactionBoost ?? 0) -
        (bullwhipRatio > 3 ? 1 : 0)
    )
  );
  const angryCustomers = serviceLevel < 0.75 || stockout > Math.max(18, actualDemand * 0.25);
  const supplierTrustLoss = action.id === "expedite" || orderQty > forecast * 1.75 || state.supplierContract === "Cheap Batch";
  const routeShutdown = ((state.routeRisk ?? 1) * (modifiers.routeRisk ?? 1) > 1.35 && event?.type === "weather") || (state.routeStability ?? 80) < 40;
  const bullwhipAlert = bullwhipRatio > 2;
  const customerReputationDelta =
    angryCustomers ? -Math.round(7 * reputationPenaltyMultiplier) : serviceLevel > 0.95 ? 3 : 0;
  const supplierTrustDelta = supplierTrustLoss ? -4 : (state.supplierContract === "Reliable Batch" ? 2 : 0);
  const routeStabilityDelta = routeShutdown ? -12 : event?.type === "weather" ? -4 : 1;
  const heatPenalty = (state.operationalHeat ?? 34) > 85 ? 180 : 0;
  const newSupplierTrust = clamp((state.supplierTrust ?? 80) + supplierTrustDelta + (sitFx.supplierTrust ?? 0));
  const newCustomerReputation = clamp((state.customerReputation ?? 85) + customerReputationDelta + (sitFx.customerReputation ?? 0));
  const newCustomerPatience = clamp((state.customerPatience ?? 80) + (angryCustomers ? -8 : serviceLevel > 0.95 ? 2 : 0) + (sitFx.customerPatience ?? 0));
  const newRouteStability = clamp((state.routeStability ?? 80) + routeStabilityDelta + (sitFx.routeStability ?? 0));
  const newVillageReputation = clamp(
    (state.villageReputation ?? 85) +
      (serviceLevel > 0.95 ? 2 : 0) +
      (angryCustomers ? -5 : 0) +
      (bullwhipAlert ? -2 : 0)
  );
  const balancedScore = calculateBalancedScore({
    profit: profit - heatPenalty,
    serviceLevel,
    bullwhipRatio,
    satisfaction: newSatisfaction,
    stockout,
    villageReputation: newVillageReputation,
    supplierTrust: newSupplierTrust,
    customerReputation: newCustomerReputation,
    routeStability: newRouteStability
  });

  let current = {
    ...historyWithCurrentRaw[historyWithCurrentRaw.length - 1],
    profit: round(profit - heatPenalty),
    heatPenalty,
    demandVariance: round(demandVariance),
    orderVariance: round(orderVariance),
    bullwhipRatio: round(Math.min(bullwhipRatio, 99)),
    customerSatisfaction: newSatisfaction,
    balancedScore,
    supplierTrust: newSupplierTrust,
    customerReputation: newCustomerReputation,
    customerPatience: newCustomerPatience,
    routeStability: newRouteStability,
    villageReputation: newVillageReputation,
    storyBranch: state.storyBranch,
    consequences: {
      angryCustomers,
      supplierTrustLoss,
      routeShutdown,
      bullwhipAlert,
      emergencyProcurement: emergencyProcurement > 0
    }
  };
  const weeklyBonuses = calculateWeeklyBonuses(state, current);
  const weeklyPenalties = calculateWeeklyPenalties(state, current);
  const goal = state.weeklyGoal ?? pickWeeklyGoal(state.week);
  const goalAchieved = Boolean(goal?.check?.(current));
  if (goalAchieved) {
    weeklyBonuses.push({ label: `Goal: ${goal.label}`, amount: goal.reward, tag: "GOAL" });
  }
  const streakContinues = current.serviceLevel >= 0.9 && bullwhipRatio < 2;
  const newStreak = streakContinues ? (state.stabilityStreak ?? 0) + 1 : 0;
  if (newStreak >= 3) {
    weeklyBonuses.push({ label: `Streak ×${newStreak}`, amount: 60 * newStreak, tag: "STREAK" });
  }
  const bonusTotal = weeklyBonuses.reduce((sum, item) => sum + item.amount, 0);
  const penaltyTotal = weeklyPenalties.reduce((sum, item) => sum + item.amount, 0);
  current = {
    ...current,
    weeklyBonuses,
    weeklyPenalties,
    profit: round(current.profit + bonusTotal - penaltyTotal),
    decisionImpactSummary: createDecisionImpactTrail(state, current, state.locationActivityResults ?? [])
      .map((item) => `${item.decision}: ${item.immediateEffect}`)
      .join(" | ")
  };
  current.weekStars = starsForScore(current.balancedScore);
  current.weekGrade = gradeForScore(current.balancedScore);
  const newGoalsAchievedCount = (state.goalsAchievedCount ?? 0) + (goalAchieved ? 1 : 0);
  const newCash = round(state.cash + current.profit);
  const achievementContext = {
    current,
    streak: newStreak,
    cash: newCash,
    goalsAchievedCount: newGoalsAchievedCount,
    situationChoiceId: situationChoice?.id ?? null
  };
  const newlyUnlocked = ACHIEVEMENTS.filter(
    (item) => !(state.achievements ?? []).includes(item.id) && item.check(achievementContext)
  );

  // Weekly XP awards per location performance
  const weekLevels = { ...(state.locationLevels ?? initialLocationLevels()) };
  const weekLevelUps = [];
  const awardXp = (locationId, amount) => {
    const lvl = grantXp(weekLevels, locationId, amount);
    if (lvl) {
      weekLevelUps.push({
        locationId,
        level: lvl,
        name: LOCATIONS.find((item) => item.id === locationId)?.name ?? locationId
      });
    }
  };
  awardXp("retail", Math.round(serviceLevel * 20));
  awardXp("warehouse", stockout === 0 ? 14 : 4);
  awardXp("analytics", bullwhipRatio < 2 ? 16 : 5);
  awardXp("supplier", supplierTrustDelta > 0 ? 12 : 4);
  awardXp("port", randomDelay === 0 && !eventDelay ? 12 : 4);
  awardXp("customer", goalAchieved ? 14 : 6);

  const history = [...state.history, current];
  const storyUpdate = updateStoryBranch({ ...state, history, supplierTrust: newSupplierTrust, customerReputation: newCustomerReputation, routeStability: newRouteStability, villageReputation: newVillageReputation }, current);
  const advice = createMisoAdvice(history, endingInventory, newPipeline, state.difficultyKey);
  const causeEffects = createDecisionImpactTrail(state, current, state.locationActivityResults ?? []);
  const newHeat = Math.max(
    0,
    Math.min(
      100,
      (state.operationalHeat ?? 34) +
        (event ? 12 : -4) +
        (stockout > 0 ? 10 : -3) +
        (bullwhipAlert ? 8 : 0) +
        (routeShutdown ? 12 : 0) +
        (heatPenalty ? 8 : 0) +
        (sitFx.operationsHeat ?? 0)
    )
  );

  return {
    ...state,
    week: state.week + 1,
    inventory: endingInventory,
    cash: round(state.cash + current.profit),
    pipeline: newPipeline,
    history,
    satisfaction: newSatisfaction,
    supplierTrust: newSupplierTrust,
    customerReputation: newCustomerReputation,
    customerPatience: newCustomerPatience,
    routeStability: newRouteStability,
    villageReputation: newVillageReputation,
    storyBranch: storyUpdate.branch,
    storyChapter: storyUpdate.chapter,
    storyFlags: storyUpdate.flags,
    stabilityStreak: newStreak,
    bestStreak: Math.max(state.bestStreak ?? 0, newStreak),
    achievements: [...(state.achievements ?? []), ...newlyUnlocked.map((item) => item.id)],
    lastUnlocked: newlyUnlocked,
    locationLevels: weekLevels,
    lastLevelUps: weekLevelUps,
    totalStars: (state.totalStars ?? 0) + current.weekStars,
    goalsAchievedCount: newGoalsAchievedCount,
    weeklyGoal: pickWeeklyGoal(state.week + 1),
    lastGoalResult: {
      goal,
      achieved: goalAchieved,
      week: state.week
    },
    currentSituationId: pickSituationId(state.week + 1),
    lastSituationResult: situation
      ? {
          icon: situation.icon,
          situationTitle: situation.title,
          choiceLabel: situationChoice?.label ?? "No decision",
          outcome: situationChoice?.outcome ?? "The moment quietly passed without a decision.",
          week: state.week
        }
      : null,
    operationalHeat: newHeat,
    activeModifiers: {},
    activeActivityModifiers: {},
    completedActivitiesThisWeek: {},
    weeklyBonuses,
    weeklyPenalties,
    lastCauseEffects: causeEffects,
    decisionImpactTrail: [...causeEffects, ...(state.decisionImpactTrail ?? [])].slice(0, 14),
    mapNodeStates: Object.fromEntries(LOCATIONS.map((location) => [location.id, getMapNodeState(location.id, { ...state, supplierTrust: newSupplierTrust, customerReputation: newCustomerReputation, routeStability: newRouteStability, villageReputation: newVillageReputation, operationalHeat: newHeat }, current)])),
    activityLog: [
      `Week ${state.week}: ${current.actionName} resolved. Demand ${actualDemand}, fulfilled ${fulfilledDemand}, stockout ${stockout}.`,
      ...(situationChoice ? [`${situation.title}: ${situationChoice.label}. ${situationChoice.outcome}`] : []),
      ...weeklyBonuses.map((item) => `BONUS: ${item.label} ${item.amount}`),
      ...weeklyPenalties.map((item) => `PENALTY: ${item.label} ${item.amount}`),
      ...(state.activityLog ?? [])
    ].slice(0, 9),
    lastEvent: event,
    lastAdvice: advice,
    screen: state.week >= state.maxWeeks ? "final" : "result"
  };
}

export function createMisoAdvice(history, inventory, pipeline, difficultyKey) {
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  const pending = pipeline.reduce((sum, order) => sum + order.qty, 0);
  const suggestions = [];

  if (!latest) return "Make your first forecast with a calm paw: use likely demand plus a small safety buffer.";

  if (latest.bullwhipRatio > 3) {
    suggestions.push(
      "Your orders are much more volatile than demand. Smooth next week's order instead of chasing one signal."
    );
  }
  if (latest.serviceLevel < 0.85) {
    suggestions.push("Service level fell below 85%. Add safety stock or order earlier to protect cafe shelves.");
  }
  if (latest.absoluteForecastError > Math.max(10, latest.actualDemand * 0.25)) {
    suggestions.push("Forecast error is high. Try a recent average demand forecast instead of reacting to one week.");
  }
  if (inventory > latest.actualDemand * 1.8) {
    suggestions.push("Inventory is cozy but heavy. Holding cost is rising, so reduce orders unless demand is trending up.");
  }
  if (pending > latest.actualDemand * 2) {
    suggestions.push("Several deliveries are already on the way. Count pipeline stock before placing a large order.");
  }
  if (previous && latest.orderQty > previous.orderQty * 1.8 && latest.actualDemand <= previous.actualDemand * 1.15) {
    suggestions.push("You may have over-ordered after a mild demand change. That is how bullwhip waves begin.");
  }
  if (latest.profit < 0) {
    suggestions.push("Profit dipped this week. Check purchase cost, stockout penalties, and holding cost together.");
  }

  if (!suggestions.length) {
    const suggestion = getSuggestedForecast(history, difficultyKey, latest.week + 1);
    suggestions.push(
      `The chain looks balanced. A steady forecast near ${suggestion} units may keep service high without amplifying orders.`
    );
  }

  return `Miso notes: ${suggestions.slice(0, 2).join(" ")}`;
}

export function applyFieldCommand(state, locationId) {
  const command = FIELD_COMMANDS[locationId];
  if (!command) return state;

  const difficulty = DIFFICULTIES[state.difficultyKey];
  const baseShipment = Math.round(difficulty.baseDemand * 1.35);
  const logPrefix = `${command.tag}: ${command.name}`;
  const commandLevels = { ...(state.locationLevels ?? initialLocationLevels()) };
  grantXp(commandLevels, locationId, 14);
  let next = {
    ...state,
    cash: round(state.cash - command.cost),
    locationLevels: commandLevels,
    operationalHeat: Math.min(100, (state.operationalHeat ?? 34) + 14),
    activityLog: [`${logPrefix} launched. ${command.description}`, ...(state.activityLog ?? [])].slice(0, 7),
    lastAdvice: `Miso notes: ${command.name} changes the board immediately. Watch the new cash, pipeline, and next-week risk before confirming the round.`
  };

  if (locationId === "supplier") {
    next.pipeline = [
      ...state.pipeline,
      { qty: baseShipment, weeksRemaining: 1, placedWeek: state.week, fieldCommand: true }
    ];
  }

  if (locationId === "warehouse") {
    next.inventory = state.inventory + Math.round(difficulty.baseDemand * 0.7);
    next.operationalHeat = Math.max(0, next.operationalHeat - 8);
  }

  if (locationId === "retail") {
    next.satisfaction = Math.min(100, state.satisfaction + 6);
    next.activeModifiers = {
      ...(state.activeModifiers ?? {}),
      demandMultiplier: ((state.activeModifiers ?? {}).demandMultiplier ?? 1) * 1.22,
      satisfactionBoost: ((state.activeModifiers ?? {}).satisfactionBoost ?? 0) + 2
    };
  }

  if (locationId === "customer") {
    next.activeModifiers = {
      ...(state.activeModifiers ?? {}),
      volatilityMultiplier: Math.min(((state.activeModifiers ?? {}).volatilityMultiplier ?? 1), 0.48)
    };
    next.operationalHeat = Math.max(0, next.operationalHeat - 12);
  }

  if (locationId === "port") {
    next.pipeline = state.pipeline.map((order) => ({
      ...order,
      weeksRemaining: Math.max(1, order.weeksRemaining - 1)
    }));
    next.activeModifiers = { ...(state.activeModifiers ?? {}), delayShield: true };
    next.operationalHeat = Math.max(0, next.operationalHeat - 6);
  }

  if (locationId === "analytics") {
    next.activeModifiers = {
      ...(state.activeModifiers ?? {}),
      volatilityMultiplier: Math.min(((state.activeModifiers ?? {}).volatilityMultiplier ?? 1), 0.62),
      delayShield: true,
      qualityShield: true
    };
    next.operationalHeat = Math.max(0, next.operationalHeat - 16);
  }

  return next;
}

export function calculateWeeklyBonuses(state, current) {
  const bonuses = [];
  if (current.serviceLevel > 0.95 && current.bullwhipRatio < 1.5) {
    bonuses.push({ label: "Stability Bonus", amount: 300, tag: "STABLE CHAIN" });
  }
  if ((state.supplierTrust ?? 80) > 80) {
    bonuses.push({ label: "Trust Bonus", amount: 200, tag: "BONUS" });
  }
  if ((state.customerReputation ?? 85) > 85) {
    bonuses.push({ label: "Reputation Bonus", amount: 250, tag: "BONUS" });
  }
  if (current.absoluteForecastError <= Math.max(8, current.actualDemand * 0.12)) {
    bonuses.push({ label: "Forecast Discipline Bonus", amount: 150, tag: "BONUS" });
  }
  return bonuses;
}

export function calculateWeeklyPenalties(state, current) {
  const penalties = [];
  if (current.consequences?.angryCustomers) {
    penalties.push({ label: "Angry Customers", amount: 180, tag: "PENALTY" });
  }
  if (current.consequences?.supplierTrustLoss) {
    penalties.push({ label: "Supplier Trust Loss", amount: 90, tag: "WARNING" });
  }
  if (current.consequences?.routeShutdown) {
    penalties.push({ label: "Route Shutdown", amount: 260, tag: "CRISIS" });
  }
  if (current.consequences?.bullwhipAlert) {
    penalties.push({ label: "Bullwhip Alert", amount: 120, tag: "BULLWHIP ALERT" });
  }
  if (current.consequences?.emergencyProcurement) {
    penalties.push({ label: "Emergency Procurement", amount: Math.round(current.emergencyProcurementCost), tag: "RECOVERY" });
  }
  if ((state.operationalHeat ?? 34) > 85) {
    penalties.push({ label: "Operations Heat Crisis", amount: 180, tag: "CRISIS" });
  }
  return penalties;
}

export function updateStoryBranch(state, latest) {
  let branch = "Stable Planner Path";
  if ((state.supplierTrust ?? 80) < 45 || (state.customerReputation ?? 85) < 48) {
    branch = "Trust Crisis Path";
  } else if ((state.routeStability ?? 80) < 42 || state.cash < 0 || latest.consequences?.routeShutdown) {
    branch = "Emergency Recovery Path";
  } else if (latest.revenue > latest.purchaseCost * 1.8 && (latest.stockout > 0 || latest.bullwhipRatio > 2)) {
    branch = "Chaotic Growth Path";
  } else if (latest.serviceLevel > 0.93 && latest.bullwhipRatio < 1.8 && state.cash > 0) {
    branch = "Stable Planner Path";
  }

  const messages = STORY_BRANCH_MESSAGES[branch] ?? STORY_BRANCH_MESSAGES["Stable Planner Path"];
  return {
    branch,
    chapter: messages[(latest.week - 1) % messages.length],
    flags: {
      ...(state.storyFlags ?? {}),
      angryCustomers: Boolean(latest.consequences?.angryCustomers || state.storyFlags?.angryCustomers),
      routeShutdown: Boolean(latest.consequences?.routeShutdown || state.storyFlags?.routeShutdown),
      bullwhipAlert: Boolean(latest.consequences?.bullwhipAlert || state.storyFlags?.bullwhipAlert)
    }
  };
}

export function getCharacterMood(characterId, state, latest) {
  if (!latest) return characterId === "miso" ? "curious" : "happy";
  if (characterId === "miso") {
    if (latest.bullwhipRatio > 3) return "crisis";
    if (latest.bullwhipRatio > 2) return "focused";
    return "proud";
  }
  if (characterId === "luna") {
    if ((state.supplierTrust ?? 80) < 35) return "crisis";
    if ((state.supplierTrust ?? 80) < 58 || latest.eventTitle.includes("Supplier")) return "worried";
    return "happy";
  }
  if (characterId === "theo") {
    if (state.inventory < latest.actualDemand * 0.25 || state.inventory > latest.actualDemand * 2.4) return "crisis";
    if (state.inventory < latest.actualDemand * 0.55 || state.inventory > latest.actualDemand * 1.8) return "focused";
    return "proud";
  }
  if (characterId === "ivy") {
    if ((state.customerReputation ?? 85) < 38 || latest.serviceLevel < 0.7) return "crisis";
    if (latest.serviceLevel < 0.85) return "worried";
    return "happy";
  }
  if (characterId === "noah") {
    if ((state.routeStability ?? 80) < 35 || latest.consequences?.routeShutdown) return "crisis";
    if ((state.routeStability ?? 80) < 58 || latest.leadTime > DIFFICULTIES[state.difficultyKey].leadTimeBase + 1) return "focused";
    return "happy";
  }
  return "happy";
}

export function getMapNodeState(locationId, state, latest) {
  const base = { status: "calm", sticker: "CALM", note: "No major alert", className: "map-node-calm", icon: "•" };
  if (!latest) return { ...base, sticker: "READY", note: "Opening setup" };
  const states = {
    supplier: (state.supplierTrust ?? 80) < 50 || latest.eventTitle.includes("Supplier")
      ? { status: "critical", sticker: "RISK", note: "Trust or quality pressure", className: "map-node-critical", icon: "!" }
      : { status: "bonus", sticker: "TRUST", note: "Supplier rhythm stable", className: "map-node-bonus", icon: "✓" },
    warehouse: latest.stockout > 0 || state.inventory < latest.actualDemand * 0.4
      ? { status: "warning", sticker: "LOW STOCK", note: "Shelf protection needed", className: "map-node-warning", icon: "!" }
      : { status: "active", sticker: state.warehouseMode ?? "SORT", note: "Crates moving", className: "map-node-active", icon: "□" },
    retail: latest.stockout > 0
      ? { status: "critical", sticker: "SOLD OUT", note: "Customers saw empty shelves", className: "map-node-critical", icon: "×" }
      : { status: "bonus", sticker: state.cafePromotion ?? "OPEN", note: "Cafe service warm", className: "map-node-bonus", icon: "♥" },
    customer: latest.serviceLevel < 0.75
      ? { status: "critical", sticker: "ANGRY", note: "Queue patience dropping", className: "map-node-critical", icon: "!" }
      : { status: "active", sticker: state.demandSignalChoice ?? "SIGNAL", note: "Demand signals flowing", className: "map-node-active", icon: "?" },
    port: (state.routeStability ?? 80) < 45 || latest.consequences?.routeShutdown
      ? { status: "critical", sticker: "BLOCKED", note: "Route shutdown risk", className: "map-node-critical route-blocked", icon: "!" }
      : { status: "active", sticker: state.routeChoice ?? "ROUTE", note: "Traffic moving", className: "map-node-active", icon: "→" },
    analytics: latest.bullwhipRatio > 2
      ? { status: latest.bullwhipRatio > 3 ? "critical" : "warning", sticker: "BULLWHIP", note: "Order variance too loud", className: latest.bullwhipRatio > 3 ? "map-node-critical" : "map-node-warning", icon: "!" }
      : { status: "bonus", sticker: "SMOOTH", note: "Signals stable", className: "map-node-bonus", icon: "✓" }
  };
  return states[locationId] ?? base;
}

export function createDecisionImpactTrail(state, current, activityResults) {
  const latestActivity = activityResults?.[0];
  const impacts = [];
  if (latestActivity) {
    impacts.push(createCauseEffect(
      `${latestActivity.activityTitle}: ${latestActivity.choiceName}`,
      {
        affectedKpi: latestActivity.stamp,
        immediateEffect: "Activity modifier shaped this week's costs, demand, or risk.",
        futureRisk: "Repeated map activities cost more within the same week.",
        reaction: "focused"
      },
      LOCATION_ACTIVITIES[latestActivity.locationId]?.characterId ?? "miso"
    ));
  }
  if (current.consequences?.bullwhipAlert) {
    impacts.push(createCauseEffect("Order amplification", {
      affectedKpi: "Bullwhip Ratio",
      immediateEffect: `Bullwhip ratio reached ${current.bullwhipRatio}.`,
      futureRisk: "Future orders may become harder to stabilize.",
      reaction: "crisis"
    }, "miso"));
  }
  if (current.consequences?.angryCustomers) {
    impacts.push(createCauseEffect("Stockout pressure", {
      affectedKpi: "Customer Reputation",
      immediateEffect: "Low service created angry customer bubbles.",
      futureRisk: "Customer patience and reputation are now weaker.",
      reaction: "worried"
    }, "ivy"));
  }
  if (current.consequences?.routeShutdown) {
    impacts.push(createCauseEffect("Route risk", {
      affectedKpi: "Route Stability",
      immediateEffect: "The route board added shutdown tape.",
      futureRisk: "Lead times may remain unstable without route repair.",
      reaction: "crisis"
    }, "noah"));
  }
  if (current.consequences?.emergencyProcurement) {
    impacts.push(createCauseEffect("Critical inventory", {
      affectedKpi: "Cash",
      immediateEffect: "Emergency procurement partially recovered service but cost extra cash.",
      futureRisk: "Repeated emergency buying can sink profit.",
      reaction: "focused"
    }, "theo"));
  }
  if (!impacts.length) {
    impacts.push(createCauseEffect("Measured planning", {
      affectedKpi: "Stable Chain",
      immediateEffect: "No crisis consequence triggered this week.",
      futureRisk: "Keep watching variance, routes, and reputation.",
      reaction: "proud"
    }, "miso"));
  }
  return impacts.slice(0, 4);
}

export function getTooltip(metricKey) {
  return TOOLTIPS[metricKey] ?? "A supply chain signal that changes the village result.";
}

export function summarizeGame(state) {
  const history = state.history;
  const totals = history.reduce(
    (acc, row) => {
      acc.profit += row.profit;
      acc.stockout += row.stockout;
      acc.holdingCost += row.holdingCost;
      acc.serviceLevel += row.serviceLevel;
      acc.bullwhipRatio += row.bullwhipRatio;
      acc.balancedScore += row.balancedScore;
      return acc;
    },
    {
      profit: 0,
      stockout: 0,
      holdingCost: 0,
      serviceLevel: 0,
      bullwhipRatio: 0,
      balancedScore: 0
    }
  );

  const count = Math.max(1, history.length);
  const finalScore = round(totals.balancedScore / count);
  const balancedKingdomScore = round(
    finalScore * 0.58 +
      (state.villageReputation ?? 85) * 0.12 +
      (state.supplierTrust ?? 80) * 0.1 +
      (state.customerReputation ?? 85) * 0.1 +
      (state.routeStability ?? 80) * 0.1
  );
  const rank =
    balancedKingdomScore >= 90
      ? "Lavender Legend"
      : balancedKingdomScore >= 80
        ? "Stable Chain Master"
        : balancedKingdomScore >= 68
          ? "Cozy Operations Captain"
          : balancedKingdomScore >= 55
            ? "Festival Survivor"
            : balancedKingdomScore >= 42
              ? "Bullwhip Trouble"
              : "Crisis Recovery Trainee";
  const bestDecision =
    state.decisionImpactTrail?.find((item) => item.reaction === "proud")?.decision ??
    state.locationActivityResults?.[0]?.choiceName ??
    "Measured planning";
  const worstDecision =
    state.decisionImpactTrail?.find((item) => ["crisis", "worried"].includes(item.reaction))?.decision ??
    (state.weeklyPenalties?.[0]?.label ?? "No major crisis");

  return {
    finalProfit: round(totals.profit),
    averageServiceLevel: round(totals.serviceLevel / count),
    averageBullwhipRatio: round(totals.bullwhipRatio / count),
    totalStockouts: totals.stockout,
    totalHoldingCost: round(totals.holdingCost),
    customerSatisfaction: state.satisfaction,
    finalScore: balancedKingdomScore,
    analyticsScore: finalScore,
    rank,
    branchEnding: state.storyBranch ?? "Stable Planner Path",
    biggestStrength:
      state.routeStability >= state.supplierTrust && state.routeStability >= state.customerReputation
        ? "Route stability"
        : state.supplierTrust >= state.customerReputation
          ? "Supplier trust"
          : "Customer reputation",
    biggestWeakness:
      state.routeStability <= state.supplierTrust && state.routeStability <= state.customerReputation
        ? "Route stability"
        : state.supplierTrust <= state.customerReputation
          ? "Supplier trust"
          : "Customer reputation",
    bestDecision,
    worstDecision
  };
}

export function exportCsv(state) {
  const headers = [
    "Week",
    "Demand",
    "Forecast",
    "Order Quantity",
    "Beginning Inventory",
    "Incoming",
    "Ending Inventory",
    "Stockouts",
    "Revenue",
    "Purchase Cost",
    "Holding Cost",
    "Stockout Cost",
    "Ordering Cost",
    "Disruption Cost",
    "Village Action",
    "Action Cost",
    "Profit",
    "Service Level",
    "Forecast Error",
    "Demand Variance",
    "Order Variance",
    "Bullwhip Ratio",
    "Balanced Score",
    "Supplier Trust",
    "Customer Reputation",
    "Route Stability",
    "Village Reputation",
    "Story Branch",
    "Weekly Bonuses",
    "Weekly Penalties",
    "Decision Impact Summary",
    "Event"
  ];
  const rows = state.history.map((row) => [
    row.week,
    row.actualDemand,
    row.forecast,
    row.orderQty,
    row.beginningInventory,
    row.incoming,
    row.endingInventory,
    row.stockout,
    round(row.revenue),
    round(row.purchaseCost),
    round(row.holdingCost),
    round(row.stockoutCost),
    round(row.orderingCost),
    round(row.disruptionCost),
    row.actionName ?? "Steady Planner",
    round(row.actionCost ?? 0),
    round(row.profit),
    round(row.serviceLevel),
    row.forecastError,
    row.demandVariance,
    row.orderVariance,
    row.bullwhipRatio,
    row.balancedScore,
    row.supplierTrust ?? "",
    row.customerReputation ?? "",
    row.routeStability ?? "",
    row.villageReputation ?? "",
    row.storyBranch ?? "",
    (row.weeklyBonuses ?? []).map((item) => `${item.label} ${item.amount}`).join("; "),
    (row.weeklyPenalties ?? []).map((item) => `${item.label} ${item.amount}`).join("; "),
    row.decisionImpactSummary ?? "",
    row.eventTitle
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function exportHtmlReport(state) {
  const summary = summarizeGame(state);
  const unlocked = new Set(state.achievements ?? []);
  const achievementList = ACHIEVEMENTS.map(
    (badge) =>
      `<span class="${unlocked.has(badge.id) ? "unlocked" : "locked"}">${htmlEscape(unlocked.has(badge.id) ? badge.icon : "LOCK")} ${htmlEscape(badge.name)}</span>`
  ).join("");
  const levelRows = LOCATIONS.map((location) => {
    const entry = state.locationLevels?.[location.id] ?? { level: 1, xp: 0 };
    return `
      <tr>
        <th>${htmlEscape(location.name)}</th>
        <td>${entry.level}</td>
        <td>${entry.xp}</td>
      </tr>`;
  }).join("");
  const impactRows = (state.decisionImpactTrail ?? []).slice(0, 8).map(
    (impact) => `
      <li>
        <strong>${htmlEscape(impact.decision)}</strong>
        <span>${htmlEscape(impact.affectedKpi)} — ${htmlEscape(impact.immediateEffect)}</span>
        <em>${htmlEscape(impact.futureRisk)}</em>
      </li>`
  ).join("");
  const rows = state.history
    .map((row) => {
      const bonuses = (row.weeklyBonuses ?? []).map((item) => `${item.label} +$${item.amount}`).join("; ");
      const penalties = (row.weeklyPenalties ?? []).map((item) => `${item.label} -$${item.amount}`).join("; ");
      return `
      <tr>
        <td>${row.week}</td>
        <td>${row.weekStars ?? 0}</td>
        <td>${htmlEscape(row.weekGrade ?? "")}</td>
        <td>${row.actualDemand}</td>
        <td>${row.forecast}</td>
        <td>${row.orderQty}</td>
        <td>${row.endingInventory}</td>
        <td>${row.stockout}</td>
        <td>$${round(row.profit)}</td>
        <td>${round(row.serviceLevel * 100, 1)}%</td>
        <td>${row.bullwhipRatio}</td>
        <td>${row.balancedScore}</td>
        <td>${row.supplierTrust ?? ""}</td>
        <td>${row.customerReputation ?? ""}</td>
        <td>${row.routeStability ?? ""}</td>
        <td>${htmlEscape(row.storyBranch ?? "")}</td>
        <td>${htmlEscape(bonuses || "None")}</td>
        <td>${htmlEscape(penalties || "None")}</td>
        <td>${htmlEscape(row.decisionImpactSummary ?? "")}</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Purrfect Supply Chain Report</title>
      <style>
        :root {
          --cream: #fff8ec;
          --paper: #fffaf2;
          --lavender: #7b61bd;
          --ink: #33283f;
          --rose: #ce6f8f;
          --mint: #80b99a;
          --honey: #f2c879;
          --line: #ead8ca;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 32px;
          font-family: Arial, sans-serif;
          color: var(--ink);
          background:
            radial-gradient(circle at 8% 10%, rgba(206,111,143,.2), transparent 28%),
            radial-gradient(circle at 90% 4%, rgba(123,97,189,.22), transparent 30%),
            repeating-linear-gradient(45deg, rgba(51,40,63,.04) 0 1px, transparent 1px 14px),
            #fff4df;
        }
        h1, h2, h3, p { margin-top: 0; }
        h1 { color: var(--lavender); font-size: 34px; margin-bottom: 8px; }
        h2 { color: #4b3b63; margin-bottom: 12px; }
        .hero, .panel {
          background: rgba(255,250,242,.94);
          border: 2px solid var(--line);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 8px 10px 0 rgba(123,97,189,.12);
          margin-bottom: 18px;
        }
        .hero { position: relative; overflow: hidden; }
        .hero:before {
          content: "LAVENDER CAT VILLAGE";
          position: absolute;
          right: -20px;
          top: 18px;
          transform: rotate(8deg);
          background: #ffe28d;
          border: 2px solid rgba(51,40,63,.16);
          padding: 8px 16px;
          font-weight: 800;
          color: #61461f;
        }
        .summary-grid, .meter-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .card {
          background: #fff;
          border: 1px dashed #d7b98d;
          border-radius: 10px;
          padding: 12px;
        }
        .card span { display: block; color: #756a73; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .card strong { display: block; margin-top: 6px; font-size: 20px; color: #3b3042; }
        .meter {
          height: 9px;
          background: #f0dfca;
          border-radius: 99px;
          overflow: hidden;
          margin-top: 8px;
        }
        .meter i { display: block; height: 100%; background: linear-gradient(90deg, var(--mint), var(--honey), var(--rose)); }
        .badge-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .badge-row span, .stamp {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 7px;
          background: #ffe28d;
          border: 1px solid rgba(51,40,63,.16);
          font-size: 12px;
          font-weight: 800;
        }
        .badge-row .locked { opacity: .45; filter: grayscale(1); }
        .badge-row .unlocked { background: #dbf1d3; }
        table { border-collapse: collapse; width: 100%; margin-top: 12px; font-size: 12px; }
        th, td { border: 1px solid #e3d0bd; padding: 8px; text-align: right; vertical-align: top; }
        th { background: #efe5ff; color: #4c3a72; }
        td:first-child, th:first-child { text-align: center; }
        .wide-table { overflow-x: auto; }
        .impact-list { display: grid; gap: 10px; padding-left: 0; list-style: none; }
        .impact-list li {
          border-left: 6px solid var(--lavender);
          background: #fff;
          padding: 10px 12px;
          border-radius: 8px;
        }
        .impact-list strong, .impact-list span, .impact-list em { display: block; }
        .impact-list em { color: #7a6571; margin-top: 4px; }
        .note { color: #6d6070; line-height: 1.55; }
        @media print {
          body { background: white; padding: 18px; }
          .hero, .panel { box-shadow: none; break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <section class="hero">
        <h1>Purrfect Supply Chain: Bullwhip Village Report</h1>
        <p class="note">The Lavender Cat Village cafe completed ${state.history.length} simulated weeks in ${htmlEscape(DIFFICULTIES[state.difficultyKey]?.label ?? state.difficultyKey)} mode. This report summarizes SCM performance, story outcome, progression, and decision consequences.</p>
        <span class="stamp">Final Rank: ${htmlEscape(summary.rank)}</span>
        <span class="stamp">Branch: ${htmlEscape(summary.branchEnding)}</span>
      </section>

      <section class="panel">
        <h2>Final Summary</h2>
        <div class="summary-grid">
          <div class="card"><span>Balanced Kingdom Score</span><strong>${summary.finalScore}</strong></div>
          <div class="card"><span>Final Profit</span><strong>$${summary.finalProfit}</strong></div>
          <div class="card"><span>Average Service</span><strong>${round(summary.averageServiceLevel * 100, 1)}%</strong></div>
          <div class="card"><span>Average Bullwhip</span><strong>${summary.averageBullwhipRatio}</strong></div>
          <div class="card"><span>Total Stockouts</span><strong>${summary.totalStockouts}</strong></div>
          <div class="card"><span>Total Stars</span><strong>${state.totalStars ?? 0}</strong></div>
          <div class="card"><span>Best Streak</span><strong>x${state.bestStreak ?? 0}</strong></div>
          <div class="card"><span>Goals Achieved</span><strong>${state.goalsAchievedCount ?? 0}</strong></div>
        </div>
      </section>

      <section class="panel">
        <h2>Reputation and Stability Meters</h2>
        <div class="meter-grid">
          ${[
            ["Supplier Trust", state.supplierTrust ?? 0],
            ["Customer Reputation", state.customerReputation ?? 0],
            ["Route Stability", state.routeStability ?? 0],
            ["Village Reputation", state.villageReputation ?? 0]
          ].map(([label, value]) => `
            <div class="card">
              <span>${label}</span><strong>${value}%</strong>
              <div class="meter"><i style="width:${Math.max(0, Math.min(100, value))}%"></i></div>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="panel">
        <h2>Story and Debrief</h2>
        <div class="summary-grid">
          <div class="card"><span>Biggest Strength</span><strong>${htmlEscape(summary.biggestStrength)}</strong></div>
          <div class="card"><span>Biggest Weakness</span><strong>${htmlEscape(summary.biggestWeakness)}</strong></div>
          <div class="card"><span>Best Decision</span><strong>${htmlEscape(summary.bestDecision)}</strong></div>
          <div class="card"><span>Worst Decision</span><strong>${htmlEscape(summary.worstDecision)}</strong></div>
        </div>
        <p class="note"><strong>Miso's final advice:</strong> ${htmlEscape(state.lastAdvice)}</p>
      </section>

      <section class="panel">
        <h2>Trophy Case</h2>
        <div class="badge-row">${achievementList}</div>
      </section>

      <section class="panel">
        <h2>Location Levels</h2>
        <table>
          <thead><tr><th>Location</th><th>Level</th><th>Current XP</th></tr></thead>
          <tbody>${levelRows}</tbody>
        </table>
      </section>

      <section class="panel">
        <h2>Decision Impact Trail</h2>
        <ul class="impact-list">${impactRows || "<li><strong>No impact trail recorded</strong><span>Play weekly decisions to generate consequence cards.</span></li>"}</ul>
      </section>

      <section class="panel">
        <h2>Week-by-Week Data</h2>
        <div class="wide-table">
          <table>
            <thead>
              <tr>
                <th>Week</th><th>Stars</th><th>Grade</th><th>Demand</th><th>Forecast</th><th>Orders</th><th>Inventory</th>
                <th>Stockouts</th><th>Profit</th><th>Service</th><th>Bullwhip</th><th>Score</th><th>Supplier</th>
                <th>Customer</th><th>Route</th><th>Branch</th><th>Bonuses</th><th>Penalties</th><th>Impact Summary</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    </body>
  </html>`;
}

export function downloadText(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
