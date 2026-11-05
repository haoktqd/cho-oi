import {
  calculateDemand,
  calculateSupply,
  calculateMarketImbalance,
  calculateStockPressure,
  calculateMarketPressure,
  calculateTargetPrice,
  calculateSmoothedPrice,
} from '../economy/supplyDemand';
import { consumeInventoryFifo, createInventoryLot, updateInventoryDecay } from '../economy/inventory';
import { getPriceQuote, calculatePriceImpact } from '../economy/pricing';
import { calculateNetWorth } from '../economy/finance';
import { createNewGameState } from '../state/gameState';
import { runHeadlessSimulation } from '../economy/simulation';

export function runAllUnitTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      console.log(`[PASS] ${testName}`);
    } else {
      failed++;
      errors.push(testName);
      console.error(`[FAIL] ${testName}`);
    }
  }

  // 1. Demand elasticity test
  const normalDemand = calculateDemand({
    baseDemand: 100,
    demandFactor: 1.0,
    currentPrice: 10,
    basePrice: 10,
    demandElasticity: 1.2,
  });
  assert(Math.abs(normalDemand - 100) < 0.01, 'Demand at base price equals base demand');

  const highPriceDemand = calculateDemand({
    baseDemand: 100,
    demandFactor: 1.0,
    currentPrice: 20,
    basePrice: 10,
    demandElasticity: 1.2,
  });
  assert(highPriceDemand < normalDemand, 'Higher price decreases demand');

  // 2. Supply elasticity test
  const highPriceSupply = calculateSupply({
    baseSupply: 100,
    supplyFactor: 1.0,
    currentPrice: 20,
    basePrice: 10,
    supplyElasticity: 0.9,
  });
  assert(highPriceSupply > 100, 'Higher price incentivizes higher supply');

  // 3. Market Pressure test
  const imb = calculateMarketImbalance(120, 80);
  assert(imb > 0, 'Excess demand produces positive imbalance');

  const stockPress = calculateStockPressure(100, 40);
  assert(stockPress > 0, 'Depleted inventory produces positive stock pressure');

  const marketPress = calculateMarketPressure(imb, stockPress);
  assert(marketPress > 0, 'Combined pressure is positive during shortage');

  // 4. Target Price Clamping
  const targetPrice = calculateTargetPrice({
    basePrice: 10,
    eventMultiplier: 1.0,
    volatility: 0.2,
    marketPressure: 1.5,
    minPrice: 3,
    maxPrice: 25,
  });
  assert(targetPrice > 10 && targetPrice <= 25, 'Target price increases under pressure and respects bounds');

  // 5. Smoothed Price (Alpha = 0.25)
  const smoothed = calculateSmoothedPrice(10, 14, 0.25);
  assert(smoothed === 11, 'Smoothed price moves toward target with alpha');

  // 6. FIFO Inventory Lots consumption test
  const lots = [
    createInventoryLot({ productId: 'tomato', quantity: 10, unitCost: 4, currentHour: 1, currentDay: 1, location: 'local_market' }),
    createInventoryLot({ productId: 'tomato', quantity: 10, unitCost: 6, currentHour: 2, currentDay: 1, location: 'local_market' }),
  ];

  const fifoRes = consumeInventoryFifo(lots, 'tomato', 15);
  assert(fifoRes.consumedQuantity === 15, 'FIFO correctly consumes 15 units');
  assert(fifoRes.totalCogs === 10 * 4 + 5 * 6, 'FIFO matches exact cost basis: 10*4 + 5*6 = 70');
  assert(fifoRes.remainingInventory.length === 1 && fifoRes.remainingInventory[0].quantity === 5, 'Remaining inventory has 5 units at cost 6');

  // 7. Spoilage & Decay test
  const decayRes = updateInventoryDecay(lots, 24, 'ambient');
  assert(decayRes.updatedInventory[0].quality < 100, 'Quality decays over time');

  // 8. Price slippage / impact on bulk orders
  const smallQuote = getPriceQuote({
    productId: 'rice',
    locationId: 'local_market',
    marketPrice: 10,
    buySpread: 0.03,
    sellSpread: 0.03,
    quantity: 5,
    targetStock: 100,
  });
  const bulkQuote = getPriceQuote({
    productId: 'rice',
    locationId: 'local_market',
    marketPrice: 10,
    buySpread: 0.03,
    sellSpread: 0.03,
    quantity: 50,
    targetStock: 100,
  });
  assert(bulkQuote.priceImpact > smallQuote.priceImpact, 'Bulk purchase incurs higher price impact');

  // 9. Headless Simulator 7-Day Stress Run (Invariants Test)
  const initialState = createNewGameState();
  const simRun = runHeadlessSimulation(initialState, 7);
  assert(simRun.invariantsPassed, `Headless 7-day simulation invariants passed without exploit (${simRun.issues.length} issues)`);

  return { passed, failed, errors };
}
