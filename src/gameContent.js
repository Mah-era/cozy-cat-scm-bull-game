export const SCRAPBOOK_TOKENS = [
  "BONUS",
  "PENALTY",
  "WARNING",
  "CRISIS",
  "RECOVERY",
  "STABLE CHAIN",
  "BULLWHIP ALERT"
];

export const CHARACTER_PROFILES = {
  miso: {
    fullRole: "Analytics Strategist / Bullwhip Advisor",
    specialty: "Pattern reading, forecast smoothing, variance control",
    weakness: "Can become overly cautious",
    preferredStyle: "Smooth forecast with measured safety stock",
    stressTrigger: "Bullwhip ratio above 2.5",
    dialogue: {
      calm: "Signals are noisy, but not impossible.",
      happy: "Signals are noisy, but not impossible.",
      proud: "That was measured. The chain is breathing evenly.",
      focused: "Orders are reacting louder than demand.",
      worried: "Orders are reacting louder than demand.",
      crisis: "The chain is amplifying. Slow down before it snaps."
    }
  },
  luna: {
    fullRole: "Supplier Relationship Lead",
    specialty: "Harvest capacity, supplier trust, quality protection",
    weakness: "Dislikes sudden panic orders",
    preferredStyle: "Reliable batches and early planning",
    stressTrigger: "Low supplier trust or quality issues",
    dialogue: {
      calm: "The farm can handle this if we plan early.",
      happy: "The farm can handle this if we plan early.",
      proud: "The supplier sees steady planning again.",
      focused: "Emergency harvests are not free miracles.",
      worried: "Emergency harvests are not free miracles.",
      crisis: "The supplier is losing faith in our planning."
    }
  },
  theo: {
    fullRole: "Warehouse Flow Manager",
    specialty: "Inventory discipline, safety stock, holding cost",
    weakness: "Stressed by extreme inventory swings",
    preferredStyle: "Balanced inventory with clear zones",
    stressTrigger: "Very low or very high inventory",
    dialogue: {
      calm: "The shelves are balanced.",
      happy: "The shelves are balanced.",
      proud: "Clean flow, low waste, steady shelves.",
      focused: "We are either hoarding or starving the shelves.",
      worried: "We are either hoarding or starving the shelves.",
      crisis: "The warehouse is not a magic pocket."
    }
  },
  ivy: {
    fullRole: "Cafe Demand & Customer Experience Lead",
    specialty: "Service level, customer satisfaction, promotions",
    weakness: "Promotions can backfire if stock is low",
    preferredStyle: "Calm shelf planning with honest promos",
    stressTrigger: "Low service level or angry customers",
    dialogue: {
      calm: "Customers are smiling. Keep it steady.",
      happy: "Customers are smiling. Keep it steady.",
      proud: "The queue is cheerful and the display is working.",
      focused: "A cute promo cannot fix empty shelves.",
      worried: "A cute promo cannot fix empty shelves.",
      crisis: "The queue is turning against us."
    }
  },
  noah: {
    fullRole: "Logistics Route Coordinator",
    specialty: "Lead time, route risk, shipment flow",
    weakness: "Cheap routes create hidden delays",
    preferredStyle: "Stable routes with planned buffers",
    stressTrigger: "Route shutdown or long pipeline",
    dialogue: {
      calm: "The carts are moving cleanly.",
      happy: "The carts are moving cleanly.",
      proud: "The route board is clean and every cart has a lane.",
      focused: "Fast is not always reliable.",
      worried: "Fast is not always reliable.",
      crisis: "The bridge is blocked and the orders are late."
    }
  }
};

export const LOCATION_ACTIVITIES = {
  supplier: {
    title: "Supplier Negotiation",
    subtitle: "Choose this week's contract style with Luna.",
    characterId: "luna",
    choices: [
      {
        id: "cheap-batch",
        name: "Cheap Batch",
        stamp: "CHEAP",
        description: "Lower purchase cost this week, but quality risk rises and supplier trust drops.",
        effects: {
          supplierContract: "Cheap Batch",
          purchaseCostModifier: 0.84,
          qualityRiskModifier: 1.55,
          delayRiskModifier: 1.12,
          supplierTrust: -9,
          operationsHeat: 8
        }
      },
      {
        id: "reliable-batch",
        name: "Reliable Batch",
        stamp: "RELIABLE",
        description: "Higher cost, lower delay risk, better quality protection, and supplier trust improves.",
        effects: {
          supplierContract: "Reliable Batch",
          purchaseCostModifier: 1.12,
          qualityRiskModifier: 0.55,
          delayRiskModifier: 0.68,
          supplierTrust: 7,
          routeStability: 2
        }
      },
      {
        id: "flexible-batch",
        name: "Flexible Batch",
        stamp: "FLEX",
        description: "Medium cost and flexible adjustment, lowering bullwhip impact from overreaction.",
        effects: {
          supplierContract: "Flexible Batch",
          purchaseCostModifier: 1.02,
          bullwhipRiskModifier: 0.72,
          supplierTrust: 3,
          misoConfidence: 4
        }
      }
    ]
  },
  warehouse: {
    title: "Inventory Sorting",
    subtitle: "Choose Theo's warehouse flow pattern.",
    characterId: "theo",
    choices: [
      {
        id: "fifo-focus",
        name: "FIFO Focus",
        stamp: "FIFO",
        description: "Reduces quality loss and holding waste.",
        effects: {
          warehouseMode: "FIFO Focus",
          warehouseEfficiency: 8,
          holdingCostModifier: 0.82,
          qualityRiskModifier: 0.76,
          operationsHeat: -4
        }
      },
      {
        id: "safety-stock-wall",
        name: "Safety Stock Wall",
        stamp: "BUFFER",
        description: "Protects service, but leftover stock costs more to hold.",
        effects: {
          warehouseMode: "Safety Stock Wall",
          warehouseEfficiency: 4,
          serviceBoostModifier: 0.08,
          holdingCostModifier: 1.2,
          operationsHeat: 4
        }
      },
      {
        id: "fast-pick-zone",
        name: "Fast Pick Zone",
        stamp: "FAST",
        description: "Improves high-demand fulfillment, but raises operations heat.",
        effects: {
          warehouseMode: "Fast Pick Zone",
          warehouseEfficiency: 11,
          serviceBoostModifier: 0.12,
          operationsHeat: 11,
          routeStability: -2
        }
      }
    ]
  },
  retail: {
    title: "Shelf & Promotion Planning",
    subtitle: "Choose Ivy's cafe shelf strategy.",
    characterId: "ivy",
    choices: [
      {
        id: "calm-shelf",
        name: "Calm Shelf",
        stamp: "CALM",
        description: "Lowers demand volatility and protects reputation.",
        effects: {
          cafePromotion: "Calm Shelf",
          demandModifier: 0.97,
          volatilityMultiplier: 0.72,
          customerReputation: 3,
          customerPatience: 3
        }
      },
      {
        id: "flash-bundle",
        name: "Flash Bundle",
        stamp: "HOT",
        description: "Demand and revenue opportunity rise, but stockouts become more damaging.",
        effects: {
          cafePromotion: "Flash Bundle",
          demandModifier: 1.28,
          priceModifier: 1.04,
          reputationRisk: 1.45,
          operationsHeat: 13
        }
      },
      {
        id: "premium-display",
        name: "Premium Display",
        stamp: "PREMIUM",
        description: "Raises selling price and satisfaction if service is strong, but hurts reputation if shelves empty.",
        effects: {
          cafePromotion: "Premium Display",
          priceModifier: 1.14,
          satisfactionBoost: 2,
          reputationRisk: 1.22,
          customerReputation: 1
        }
      }
    ]
  },
  customer: {
    title: "Demand Signal Reading",
    subtitle: "Choose which demand signal to trust.",
    characterId: "ivy",
    choices: [
      {
        id: "social-buzz",
        name: "Social Buzz",
        stamp: "BUZZ",
        description: "High upside, high noise. Can create a misread market branch.",
        effects: {
          demandSignalChoice: "Social Buzz",
          signalAccuracyModifier: 1.36,
          futureDemandNoise: 1.35,
          demandModifier: 1.12,
          operationsHeat: 8
        }
      },
      {
        id: "preorders",
        name: "Preorders",
        stamp: "ORDERED",
        description: "Stable signal with lower volatility and patient customers.",
        effects: {
          demandSignalChoice: "Preorders",
          signalAccuracyModifier: 0.78,
          futureDemandNoise: 0.78,
          customerPatience: 4,
          customerReputation: 2
        }
      },
      {
        id: "foot-traffic",
        name: "Foot Traffic",
        stamp: "QUEUE",
        description: "Good same-week signal but reacts strongly to local events.",
        effects: {
          demandSignalChoice: "Foot Traffic",
          signalAccuracyModifier: 1.05,
          demandModifier: 1.04,
          serviceBoostModifier: 0.04
        }
      },
      {
        id: "miso-weighted-signal",
        name: "Miso Weighted Signal",
        stamp: "SMOOTH",
        description: "Usually steadier. Lowers demand volatility and bullwhip risk.",
        effects: {
          demandSignalChoice: "Miso Weighted Signal",
          signalAccuracyModifier: 0.7,
          futureDemandNoise: 0.66,
          bullwhipRiskModifier: 0.82,
          misoConfidence: 8
        }
      }
    ]
  },
  port: {
    title: "Logistics Route Puzzle",
    subtitle: "Choose Noah's route for incoming stock.",
    characterId: "noah",
    choices: [
      {
        id: "fast-bridge",
        name: "Fast Bridge",
        stamp: "FAST",
        description: "Shorter lead time, but route disruption risk climbs.",
        effects: {
          routeChoice: "Fast Bridge",
          leadTimeModifier: -1,
          routeRisk: 1.32,
          routeStability: -7,
          operationsHeat: 7
        }
      },
      {
        id: "safe-canal",
        name: "Safe Canal",
        stamp: "SAFE",
        description: "Stable lead time, higher logistics cost, stronger route stability.",
        effects: {
          routeChoice: "Safe Canal",
          logisticsCostModifier: 1.16,
          routeRisk: 0.64,
          routeStability: 8,
          delayRiskModifier: 0.82
        }
      },
      {
        id: "cheap-road",
        name: "Cheap Road",
        stamp: "CHEAP",
        description: "Lower logistics cost, higher delay chance and route risk.",
        effects: {
          routeChoice: "Cheap Road",
          logisticsCostModifier: 0.72,
          delayRiskModifier: 1.42,
          routeRisk: 1.46,
          routeStability: -9
        }
      },
      {
        id: "emergency-courier",
        name: "Emergency Courier",
        stamp: "URGENT",
        description: "Very expensive, but reduces current pipeline delay.",
        effects: {
          routeChoice: "Emergency Courier",
          logisticsCostModifier: 1.55,
          expeditePipeline: true,
          routeStability: 2,
          operationsHeat: 10
        }
      }
    ]
  },
  analytics: {
    title: "Forecasting Challenge",
    subtitle: "Choose Miso's forecast discipline.",
    characterId: "miso",
    choices: [
      {
        id: "smooth-forecast",
        name: "Smooth Forecast",
        stamp: "SMOOTH",
        description: "Lowers bullwhip risk by resisting one-week panic.",
        effects: {
          forecastMethod: "Smooth forecast",
          bullwhipRiskModifier: 0.62,
          volatilityMultiplier: 0.86,
          misoConfidence: 10
        }
      },
      {
        id: "trend-forecast",
        name: "Trend Forecast",
        stamp: "TREND",
        description: "Helpful when demand is rising, but can overshoot after a spike.",
        effects: {
          forecastMethod: "Trend forecast",
          demandModifier: 1.04,
          bullwhipRiskModifier: 0.92,
          misoConfidence: 4
        }
      },
      {
        id: "reactive-forecast",
        name: "Reactive Forecast",
        stamp: "LOUD",
        description: "Chases the latest signal. Can overorder and amplify bullwhip.",
        effects: {
          forecastMethod: "Reactive forecast",
          bullwhipRiskModifier: 1.38,
          volatilityMultiplier: 1.15,
          operationsHeat: 11,
          misoConfidence: -8
        }
      },
      {
        id: "manual-forecast",
        name: "Manual Forecast",
        stamp: "MANUAL",
        description: "Uses your input. Miso only annotates the risk.",
        effects: {
          forecastMethod: "Manual forecast",
          misoConfidence: 1
        }
      }
    ]
  }
};

export const STORY_BRANCH_MESSAGES = {
  "Stable Planner Path": [
    "The village ledger smells faintly of lavender and good planning. Shelves stay full without shaking the farm.",
    "Miso pins a green ribbon over the control board: calm orders, calm routes, calm customers.",
    "Luna says the supplier finally trusts the cafe rhythm again."
  ],
  "Chaotic Growth Path": [
    "The cafe is famous this week, but the back room is covered in rushed notes and warning tape.",
    "Revenue sparkles, yet every spike sends a louder wave toward the farm.",
    "Ivy can sell anything, but Theo is running out of shelf patience."
  ],
  "Trust Crisis Path": [
    "The village still loves lavender pastries, but trust is fraying at both ends of the chain.",
    "Supplier stamps arrive later, customers sigh louder, and every promise costs more.",
    "Miso circles the word trust three times in red ink."
  ],
  "Emergency Recovery Path": [
    "Noah reroutes carts through narrow lanes while the cafe tries to recover from a rough week.",
    "The season is not lost, but every emergency fix leaves tape on the ledger.",
    "The village shifts into recovery mode: preserve service, cool the heat, rebuild confidence."
  ]
};

export const TOOLTIPS = {
  forecastError: "How far your prediction was from real demand.",
  bullwhipRatio: "When orders swing more wildly than actual customer demand.",
  serviceLevel: "The percentage of customer demand you successfully fulfilled.",
  leadTime: "How many weeks an order takes to arrive.",
  holdingCost: "The cost of keeping leftover inventory.",
  stockoutCost: "The penalty for not having enough stock.",
  operationsHeat: "How stressed the village system is right now.",
  supplierTrust: "How much the supplier trusts your planning rhythm.",
  customerReputation: "How customers feel about the cafe's reliability.",
  routeStability: "How reliable the transport network is."
};

export const SITUATIONS = [
  {
    id: "wedding-order",
    icon: "💍",
    title: "A Wedding Preorder",
    characterId: "ivy",
    story:
      "A couple who met over lavender lattes asks to reserve eighty cakes for their wedding this weekend. It would be beautiful — and a lot of flour.",
    choices: [
      {
        id: "accept",
        label: "Accept fully",
        detail: "Big demand spike this week; a reputation win if the shelves hold.",
        outcome: "The cafe buzzes with wedding prep and the whole village hears about it.",
        effects: { demandModifier: 1.3, customerReputation: 5, operationsHeat: 8 }
      },
      {
        id: "partial",
        label: "Offer a smaller batch",
        detail: "A gentler demand bump that is easier on the shelves.",
        outcome: "The couple happily takes sixty cakes and a promise of anniversary tea.",
        effects: { demandModifier: 1.12, customerReputation: 2, operationsHeat: 3 }
      },
      {
        id: "decline",
        label: "Politely decline",
        detail: "No spike, but the village whispers a little.",
        outcome: "Ivy recommends the bakery uphill. The couple understands... mostly.",
        effects: { customerReputation: -3, customerPatience: -2, volatilityMultiplier: 0.9 }
      }
    ]
  },
  {
    id: "critic-visit",
    icon: "📝",
    title: "The Food Critic",
    characterId: "miso",
    story:
      "A famous food critic was spotted sketching the cafe from across the square. A glowing review could change everything — so could an empty pastry case.",
    choices: [
      {
        id: "premium-week",
        label: "Polish everything",
        detail: "Raise prices slightly and present the best. Risky if service slips.",
        outcome: "Tables are re-set three times. Even the sugar jars sparkle.",
        effects: { priceModifier: 1.1, demandModifier: 1.08, operationsHeat: 9 }
      },
      {
        id: "business-as-usual",
        label: "Stay natural",
        detail: "No changes. Let the cafe be what it is.",
        outcome: "Miso approves: honest shelves tell the best story.",
        effects: { volatilityMultiplier: 0.92, misoConfidence: 5 }
      },
      {
        id: "free-tasting",
        label: "Host a tasting",
        detail: "Costs cash, softens demand noise, and warms the whole square.",
        outcome: "Free samples melt hearts. The critic takes seconds.",
        effects: { cashCost: 180, customerReputation: 4, customerPatience: 3, volatilityMultiplier: 0.85 }
      }
    ]
  },
  {
    id: "harvest-surplus",
    icon: "🌾",
    title: "Luna's Surplus Harvest",
    characterId: "luna",
    story:
      "An early bloom left Luna with crates of extra lavender. She offers them to the cafe at a friendly price — but only if you take them now.",
    choices: [
      {
        id: "buy-all",
        label: "Buy the whole surplus",
        detail: "Instant inventory and supplier goodwill, but holding costs rise.",
        outcome: "Crates stack to the warehouse ceiling. Luna beams.",
        effects: { bonusInventory: 45, cashCost: 160, supplierTrust: 6, holdingCostModifier: 1.15 }
      },
      {
        id: "buy-half",
        label: "Take half",
        detail: "A balanced cushion without drowning the shelves.",
        outcome: "A fair split — the rest goes to the tea house by the port.",
        effects: { bonusInventory: 22, cashCost: 85, supplierTrust: 3 }
      },
      {
        id: "pass",
        label: "Pass this time",
        detail: "Keep cash and space, at a small cost to farm goodwill.",
        outcome: "Luna nods slowly and sells to the market stalls instead.",
        effects: { supplierTrust: -4, purchaseCostModifier: 1.05 }
      }
    ]
  },
  {
    id: "staff-burnout",
    icon: "🫖",
    title: "A Tired Crew",
    characterId: "theo",
    story:
      "Theo has been double-checking crates past midnight and Ivy's smile is running on fumes. The crew could use a slow afternoon — but the orders won't sort themselves.",
    choices: [
      {
        id: "rest-day",
        label: "Close early for a rest",
        detail: "Lose a little service capacity now; cool the whole system down.",
        outcome: "Tea, blankets, and a nap in the reading corner. The village approves.",
        effects: { serviceBoostModifier: -0.04, operationsHeat: -14, customerPatience: 4, misoConfidence: 4 }
      },
      {
        id: "push-through",
        label: "Push through the week",
        detail: "Full output, but the operations heat climbs.",
        outcome: "Everything ships on time. Nobody talks at dinner.",
        effects: { serviceBoostModifier: 0.04, operationsHeat: 12 }
      },
      {
        id: "hire-help",
        label: "Hire village helpers",
        detail: "Costs cash; keeps both service and morale steady.",
        outcome: "Two cheerful kittens in aprons report for duty.",
        effects: { cashCost: 140, operationsHeat: -6, customerPatience: 2 }
      }
    ]
  },
  {
    id: "rival-bakery",
    icon: "🥐",
    title: "The New Bakery",
    characterId: "ivy",
    story:
      "A shiny croissant cart has parked across the square, handing out samples with little flags on them. Some regulars are... curious.",
    choices: [
      {
        id: "discount",
        label: "Run a friendly discount",
        detail: "Lower prices to keep the queue, boosting demand but thinning margins.",
        outcome: "The queue returns, waving loyalty cards like tiny banners.",
        effects: { priceModifier: 0.92, demandModifier: 1.15, customerReputation: 2 }
      },
      {
        id: "stay-premium",
        label: "Hold your quality line",
        detail: "No price war. Trust the regulars to come home.",
        outcome: "The croissant cart is fun; the lavender cakes are family.",
        effects: { demandModifier: 0.95, customerPatience: 3, misoConfidence: 4 }
      },
      {
        id: "collab",
        label: "Propose a collaboration",
        detail: "Costs cash, but a joint pastry calms the market and delights everyone.",
        outcome: "The lavender-croissant is born. The square smells incredible.",
        effects: { cashCost: 120, volatilityMultiplier: 0.82, customerReputation: 3 }
      }
    ]
  },
  {
    id: "bridge-repair",
    icon: "🌉",
    title: "Bridge Maintenance Notice",
    characterId: "noah",
    story:
      "The village council posts a notice: the old bridge needs repairs. Noah can pay for a night crew, reroute early, or hope the planks hold one more week.",
    choices: [
      {
        id: "night-crew",
        label: "Fund the night crew",
        detail: "Costs cash; the route gets stronger for the rest of the season.",
        outcome: "Lanterns bob over the bridge all night. By morning it hums.",
        effects: { cashCost: 200, routeStability: 9, delayRiskModifier: 0.8 }
      },
      {
        id: "reroute",
        label: "Reroute early",
        detail: "Slower shipments this week, but no surprises.",
        outcome: "Carts take the long meadow lane, waving at sheep.",
        effects: { leadTimeModifier: 1, routeStability: 3, volatilityMultiplier: 0.95 }
      },
      {
        id: "risk-it",
        label: "Risk one more week",
        detail: "Free — unless the planks disagree.",
        outcome: "Every crossing gets a small collective breath-hold.",
        effects: { routeStability: -7, delayRiskModifier: 1.3 }
      }
    ]
  },
  {
    id: "stray-cat",
    icon: "🐾",
    title: "The Stray by the Door",
    characterId: "miso",
    story:
      "A small gray stray has been sleeping by the cafe door all week. Customers keep photographing it. Miso pretends not to care, but has already named it Bean.",
    choices: [
      {
        id: "adopt",
        label: "Adopt Bean officially",
        detail: "A tiny cost for food; the cafe gains a mascot and softer hearts.",
        outcome: "Bean gets a cushion by the window and a hand-lettered name sign.",
        effects: { cashCost: 60, customerReputation: 4, customerPatience: 4, operationsHeat: -6 }
      },
      {
        id: "feed-quietly",
        label: "Feed it quietly",
        detail: "Kind and low-key. Bean remains a free spirit.",
        outcome: "A saucer appears each morning. Nobody admits to placing it.",
        effects: { customerPatience: 2, operationsHeat: -3 }
      },
      {
        id: "shoo-gently",
        label: "Shoo it along",
        detail: "Keeps the doorway clear, but the regulars saw that.",
        outcome: "Bean relocates to the bookshop. The bookshop posts about it.",
        effects: { customerReputation: -3, customerPatience: -3 }
      }
    ]
  },
  {
    id: "market-day",
    icon: "🏮",
    title: "Night Market Invitation",
    characterId: "luna",
    story:
      "The village night market wants a Lavender Cafe stall this week. Extra sales, extra chaos — and the stall fee is due upfront.",
    choices: [
      {
        id: "full-stall",
        label: "Take a full stall",
        detail: "Pay the fee; demand and visibility jump, and so does the workload.",
        outcome: "String lights, steam, and a queue that curls around the fountain.",
        effects: { cashCost: 150, demandModifier: 1.22, customerReputation: 3, operationsHeat: 10 }
      },
      {
        id: "shared-stall",
        label: "Share a stall with Luna",
        detail: "Half the fee, half the chaos, all of the charm.",
        outcome: "Farm posies and lavender cakes side by side. A very good photo.",
        effects: { cashCost: 75, demandModifier: 1.1, supplierTrust: 4, operationsHeat: 5 }
      },
      {
        id: "skip-market",
        label: "Skip this one",
        detail: "A calm week at home base.",
        outcome: "The cafe stays cozy and quiet while lanterns glow in the distance.",
        effects: { volatilityMultiplier: 0.88, operationsHeat: -4 }
      }
    ]
  }
];
