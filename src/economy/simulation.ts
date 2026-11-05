import {
  GameSaveState,
  MarketLocationId,
  MarketLocationState,
  ProductId,
  SimulationClock,
} from '../types';
import { PRODUCTS } from './catalog';
import {
  calculateDemand,
  calculateMarketImbalance,
  calculateMarketPressure,
  calculateSmoothedPrice,
  calculateStockPressure,
  calculateSupply,
  calculateTargetPrice,
} from './supplyDemand';
import { updateInventoryDecay, calculateInventoryLiquidationValue } from './inventory';
import { calculateNetWorth, createLedgerEntry, getHourlyOperatingCosts, getRankForNetWorth } from './finance';
import { createRandomMarketEvent, determineWeatherFromEvents } from './events';
import { generateContract } from './contracts';

export function createInitialLocationState(id: MarketLocationId): MarketLocationState {
  const isWholesale = id === 'wholesale_market';
  const name = isWholesale ? 'Chợ Đầu Mối (Bán Buôn)' : 'Chợ Dân Sinh (Bán Lẻ)';
  const shortName = isWholesale ? 'Chợ Đầu Mối' : 'Chợ Dân Sinh';
  const description = isWholesale
    ? 'Kho bãi bạt ngàn, xe tải nườm nượp từ các vựa miền Tây và cao nguyên đổ về. Chuyên bán sỉ số lượng lớn, giá gốc, biên độ giá thấp.'
    : 'Khu chợ truyền thống sầm uất giữa lòng phố thị. Hàng trăm sạp hàng đa dạng, người dân tấp nập mua lẻ từng bữa, giá bán lẻ cao.';

  const items: any = {};
  const productIds: ProductId[] = ['tomato', 'greens', 'onion', 'egg', 'fish', 'rice'];

  for (const pid of productIds) {
    const p = PRODUCTS[pid];
    // Wholesale has lower initial prices and higher supply, retail has higher price
    const baseMult = isWholesale ? 0.88 : 1.15;
    const initialPrice = Math.round(p.basePrice * baseMult * 100) / 100;
    const initialSupply = isWholesale ? p.baseSupply * 4 : p.baseSupply;

    items[pid] = {
      productId: pid,
      currentPrice: initialPrice,
      previousPrice: initialPrice,
      basePrice: p.basePrice,
      availableSupply: initialSupply,
      targetStock: initialSupply,
      currentDemand: p.baseDemand,
      priceHistory: [initialPrice, initialPrice, initialPrice, initialPrice, initialPrice],
      buySpread: isWholesale ? 0.018 : 0.035,
      sellSpread: isWholesale ? 0.018 : 0.035,
    };
  }

  return {
    id,
    name,
    shortName,
    description,
    items,
    retailMarkupMultiplier: isWholesale ? 1.0 : 1.25,
    spread: isWholesale ? 0.02 : 0.035,
    trafficFactor: isWholesale ? 1.4 : 1.0,
  };
}

export function executeMarketTick(state: GameSaveState, minutesToAdvance: number = 5): GameSaveState {
  let clock: SimulationClock = { ...state.clock };
  let newMinutes = clock.minute + minutesToAdvance;
  let advancedHours = 0;

  while (newMinutes >= 60) {
    newMinutes -= 60;
    advancedHours++;
  }

  let newHour = clock.hour + advancedHours;
  let newDay = clock.day;
  while (newHour >= 24) {
    newHour -= 24;
    newDay++;
  }

  clock.minute = newMinutes;
  clock.hour = newHour;
  clock.day = newDay;

  // Clone mutable state
  const updatedLocations: Record<MarketLocationId, MarketLocationState> = {
    local_market: {
      ...state.locations.local_market,
      items: { ...state.locations.local_market.items },
    },
    wholesale_market: {
      ...state.locations.wholesale_market,
      items: { ...state.locations.wholesale_market.items },
    },
  };

  let activeEvents = [...state.activeEvents];
  let ledger = [...state.ledger];
  let cash = state.cash;
  let inventory = [...state.inventory];
  let contracts = [...state.contracts];

  // If hours advanced, process economic simulations
  if (advancedHours > 0) {
    // 1. Spoilage & Quality Decay
    const decayResult = updateInventoryDecay(inventory, advancedHours, state.business.storageTier);
    inventory = decayResult.updatedInventory;

    if (decayResult.spoiledLots.length > 0) {
      const totalSpoiledQty = decayResult.spoiledLots.reduce((s, l) => s + l.quantity, 0);
      const spoiledLoss = decayResult.spoiledLots.reduce((s, l) => s + l.quantity * l.unitCost, 0);
      ledger.unshift(
        createLedgerEntry({
          gameDay: clock.day,
          gameHour: clock.hour,
          type: 'SPOILAGE_LOSS',
          description: `Hàng hỏng do quá hạn: ${totalSpoiledQty} kg nông sản`,
          amount: -spoiledLoss,
          balanceAfter: cash,
        })
      );
    }

    // 2. Hourly operating expenses (Storage rent & staff salaries)
    const hourlyCosts = getHourlyOperatingCosts(state.business);
    const totalPeriodCost = hourlyCosts * advancedHours;
    if (totalPeriodCost > 0 && cash >= totalPeriodCost) {
      cash = Math.max(0, cash - totalPeriodCost);
      ledger.unshift(
        createLedgerEntry({
          gameDay: clock.day,
          gameHour: clock.hour,
          type: 'EMPLOYEE_SALARY',
          description: `Chi phí kho bãi & lương nhân viên (${advancedHours}h)`,
          amount: -totalPeriodCost,
          balanceAfter: cash,
        })
      );
    }

    // 3. Passive income from owned retail stalls & assistants
    if (state.business.ownedStalls.localMarket && state.business.employees.assistants > 0) {
      // Assistants sell goods from inventory passively if available
      const pids: ProductId[] = ['tomato', 'greens', 'egg'];
      for (const pid of pids) {
        const availableInInv = inventory.filter((l) => l.productId === pid && l.quantity > 0);
        if (availableInInv.length > 0) {
          const sellQty = Math.min(availableInInv[0].quantity, state.business.employees.assistants * 2);
          if (sellQty > 0) {
            const retailPrice = updatedLocations.local_market.items[pid].currentPrice;
            const revenue = sellQty * retailPrice;
            const cogs = sellQty * availableInInv[0].unitCost;
            cash += revenue;
            availableInInv[0].quantity -= sellQty;
            inventory = inventory.filter((l) => l.quantity > 0);
            ledger.unshift(
              createLedgerEntry({
                gameDay: clock.day,
                gameHour: clock.hour,
                type: 'TRADE_SELL',
                description: `Sạp Chợ Dân Sinh tự động bán ${sellQty} ${PRODUCTS[pid].vietnameseName}`,
                amount: revenue,
                cogs,
                balanceAfter: cash,
              })
            );
          }
        }
      }
    }

    // 4. Update Event lifecycles
    const currentAbsHours = clock.day * 24 + clock.hour;
    activeEvents = activeEvents.filter((ev) => {
      const eventEnd = ev.startDay * 24 + ev.startHour + ev.durationHours;
      return currentAbsHours < eventEnd;
    });

    // Random roll for new events (roughly once every 18-24 hours)
    if (activeEvents.length < 2 && Math.random() < 0.08 * advancedHours) {
      const newEvent = createRandomMarketEvent(clock.day, clock.hour);
      activeEvents.push(newEvent);
    }

    // Contracts expiration & generation
    contracts = contracts.map((c) => {
      const deadline = c.deadlineDay * 24 + c.deadlineHour;
      if (!c.completed && currentAbsHours > deadline) {
        return { ...c, expired: true };
      }
      return c;
    });

    if (contracts.filter((c) => !c.expired && !c.completed).length < 3 && Math.random() < 0.15 * advancedHours) {
      contracts.push(generateContract(clock.day, clock.hour));
    }

    // 5. Update Market Prices for both locations
    const locationKeys: MarketLocationId[] = ['local_market', 'wholesale_market'];
    const productIds: ProductId[] = ['tomato', 'greens', 'onion', 'egg', 'fish', 'rice'];

    for (const locId of locationKeys) {
      const loc = updatedLocations[locId];
      const isWholesale = locId === 'wholesale_market';

      for (const pid of productIds) {
        const item = { ...loc.items[pid] };
        const pDef = PRODUCTS[pid];

        // Check if active events affect this product and location
        let eventDemandMult = 1.0;
        let eventSupplyMult = 1.0;
        let eventPriceMult = 1.0;

        for (const ev of activeEvents) {
          if (ev.affectedProducts.includes(pid) && ev.affectedLocations.includes(locId)) {
            eventDemandMult *= ev.demandMultiplier;
            eventSupplyMult *= ev.supplyMultiplier;
            eventPriceMult *= ev.priceMultiplier;
          }
        }

        // Time of day influence: Morning (6-9) has peak retail demand; Early morning (3-6) has wholesale peak
        let timeDemandFactor = 1.0;
        let timeSupplyFactor = 1.0;
        if (clock.hour >= 6 && clock.hour <= 10) {
          timeDemandFactor = isWholesale ? 1.1 : 1.35; // Morning market rush
        } else if (clock.hour >= 18 || clock.hour <= 5) {
          timeDemandFactor = 0.6; // Market closed / quiet at night
        }

        // Calculate Supply & Demand
        const plannedDemand = calculateDemand({
          baseDemand: pDef.baseDemand,
          demandFactor: eventDemandMult * timeDemandFactor * (isWholesale ? 0.9 : 1.2),
          currentPrice: item.currentPrice,
          basePrice: pDef.basePrice,
          demandElasticity: pDef.demandElasticity,
        });

        const plannedSupply = calculateSupply({
          baseSupply: pDef.baseSupply,
          supplyFactor: eventSupplyMult * timeSupplyFactor * (isWholesale ? 3.0 : 1.0),
          currentPrice: item.currentPrice,
          basePrice: pDef.basePrice,
          supplyElasticity: pDef.supplyElasticity,
        });

        // NPC background trade consumption
        const executedTradeVolume = Math.min(item.availableSupply, plannedDemand * 0.35 * advancedHours);
        const incomingRestock = plannedSupply * 0.35 * advancedHours;

        const newAvailableSupply = Math.max(10, item.availableSupply - executedTradeVolume + incomingRestock);

        // Imbalance & Market Pressure
        const imbalance = calculateMarketImbalance(plannedDemand, plannedSupply);
        const stockPressure = calculateStockPressure(item.targetStock, newAvailableSupply);
        const marketPressure = calculateMarketPressure(imbalance, stockPressure);

        // Target Price & Price discovery
        const targetPrice = calculateTargetPrice({
          basePrice: pDef.basePrice * (isWholesale ? 0.88 : 1.15),
          eventMultiplier: eventPriceMult,
          volatility: pDef.volatility,
          marketPressure,
          minPrice: pDef.minPrice,
          maxPrice: pDef.maxPrice,
        });

        // Smoothed price update
        const smoothed = calculateSmoothedPrice(item.currentPrice, targetPrice, 0.22);

        // Update item state
        item.previousPrice = item.currentPrice;
        item.currentPrice = smoothed;
        item.availableSupply = Math.round(newAvailableSupply);
        item.currentDemand = Math.round(plannedDemand);

        const newHistory = [...item.priceHistory, smoothed];
        if (newHistory.length > 30) {
          newHistory.shift();
        }
        item.priceHistory = newHistory;

        loc.items[pid] = item;
      }
    }
  }

  // Update Weather
  clock.weather = determineWeatherFromEvents(activeEvents, clock.hour);

  // Recalculate Net Worth and Player Rank
  const currentPrices: Record<ProductId, number> = {
    tomato: updatedLocations.local_market.items.tomato.currentPrice,
    greens: updatedLocations.local_market.items.greens.currentPrice,
    onion: updatedLocations.local_market.items.onion.currentPrice,
    egg: updatedLocations.local_market.items.egg.currentPrice,
    fish: updatedLocations.local_market.items.fish.currentPrice,
    rice: updatedLocations.local_market.items.rice.currentPrice,
  };

  const inventoryLiquidation = calculateInventoryLiquidationValue(inventory, currentPrices);
  const netWorth = calculateNetWorth({
    cash,
    inventoryLiquidationValue: inventoryLiquidation,
    business: state.business,
  });

  const rank = getRankForNetWorth(netWorth);

  // Track Net Worth history daily
  const netWorthHistory = [...state.financialStats.netWorthHistory];
  if (advancedHours > 0 && clock.hour === 21 && (!netWorthHistory.length || netWorthHistory[netWorthHistory.length - 1].day !== clock.day)) {
    netWorthHistory.push({ day: clock.day, netWorth });
    if (netWorthHistory.length > 30) netWorthHistory.shift();
  }

  return {
    ...state,
    clock,
    cash: Math.round(cash * 100) / 100,
    inventory,
    ledger: ledger.slice(0, 100), // Keep last 100 ledger records
    activeEvents,
    contracts,
    locations: updatedLocations,
    playerRankLevel: rank.level,
    financialStats: {
      ...state.financialStats,
      netWorthHistory,
    },
  };
}

/**
 * Headless Economy Simulator: Runs N days of market simulation at top speed without rendering.
 * Used for QA, anti-exploit checking, and calibration.
 */
export function runHeadlessSimulation(initialState: GameSaveState, daysToSimulate: number): {
  finalState: GameSaveState;
  dailyMetrics: { day: number; avgPrices: Record<ProductId, number>; netWorth: number }[];
  invariantsPassed: boolean;
  issues: string[];
} {
  let simState = { ...initialState };
  const dailyMetrics: { day: number; avgPrices: Record<ProductId, number>; netWorth: number }[] = [];
  const issues: string[] = [];

  const totalTicks = daysToSimulate * 24; // 1-hour ticks

  for (let tick = 0; tick < totalTicks; tick++) {
    simState = executeMarketTick(simState, 60);

    // Invariant checks
    if (simState.cash < 0) {
      issues.push(`Negative cash detected at Day ${simState.clock.day} Hour ${simState.clock.hour}: ${simState.cash}`);
    }

    for (const locId of ['local_market', 'wholesale_market'] as MarketLocationId[]) {
      for (const pid of ['tomato', 'greens', 'onion', 'egg', 'fish', 'rice'] as ProductId[]) {
        const item = simState.locations[locId].items[pid];
        if (item.currentPrice <= 0) {
          issues.push(`Negative or zero price on ${pid} at ${locId}: ${item.currentPrice}`);
        }
        if (item.availableSupply < 0) {
          issues.push(`Negative inventory on ${pid} at ${locId}: ${item.availableSupply}`);
        }
      }
    }

    if (simState.clock.hour === 0) {
      const avgPrices: any = {};
      for (const pid of ['tomato', 'greens', 'onion', 'egg', 'fish', 'rice'] as ProductId[]) {
        avgPrices[pid] = simState.locations.local_market.items[pid].currentPrice;
      }
      dailyMetrics.push({
        day: simState.clock.day,
        avgPrices,
        netWorth: calculateNetWorth({
          cash: simState.cash,
          inventoryLiquidationValue: calculateInventoryLiquidationValue(simState.inventory, avgPrices),
          business: simState.business,
        }),
      });
    }
  }

  return {
    finalState: simState,
    dailyMetrics,
    invariantsPassed: issues.length === 0,
    issues,
  };
}
