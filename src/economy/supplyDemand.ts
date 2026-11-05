/**
 * CHỢ ƠI! - Pure Supply & Demand Mathematical Models
 * Fully deterministic & pure functions as required by Part IV of the Master Specification.
 */

export interface CalculateDemandParams {
  baseDemand: number;
  demandFactor: number;
  currentPrice: number;
  basePrice: number;
  demandElasticity: number;
}

export function calculateDemand({
  baseDemand,
  demandFactor,
  currentPrice,
  basePrice,
  demandElasticity,
}: CalculateDemandParams): number {
  if (basePrice <= 0) return baseDemand;
  const priceRatio = Math.max(0.1, currentPrice / basePrice);
  const demand = baseDemand * demandFactor * Math.pow(priceRatio, -demandElasticity);
  return Math.max(0, demand);
}

export interface CalculateSupplyParams {
  baseSupply: number;
  supplyFactor: number;
  currentPrice: number;
  basePrice: number;
  supplyElasticity: number;
}

export function calculateSupply({
  baseSupply,
  supplyFactor,
  currentPrice,
  basePrice,
  supplyElasticity,
}: CalculateSupplyParams): number {
  if (basePrice <= 0) return baseSupply;
  const priceRatio = Math.max(0.1, currentPrice / basePrice);
  const supply = baseSupply * supplyFactor * Math.pow(priceRatio, supplyElasticity);
  return Math.max(0, supply);
}

export function calculateMarketImbalance(demand: number, supply: number): number {
  const maxVolume = Math.max(demand, supply, 1);
  return (demand - supply) / maxVolume;
}

export function calculateStockPressure(targetStock: number, availableStock: number): number {
  const maxTarget = Math.max(targetStock, 1);
  return (targetStock - availableStock) / maxTarget;
}

export function calculateMarketPressure(imbalance: number, stockPressure: number): number {
  // Clamped between -2.0 and +2.0 to prevent runaway exponentials
  const rawPressure = 0.65 * imbalance + 0.35 * stockPressure;
  return Math.max(-2.0, Math.min(2.0, rawPressure));
}

export interface CalculateTargetPriceParams {
  basePrice: number;
  eventMultiplier: number;
  volatility: number;
  marketPressure: number;
  minPrice: number;
  maxPrice: number;
}

export function calculateTargetPrice({
  basePrice,
  eventMultiplier,
  volatility,
  marketPressure,
  minPrice,
  maxPrice,
}: CalculateTargetPriceParams): number {
  // TargetPrice = BasePrice * EventMultiplier * exp(Volatility * MarketPressure)
  const target = basePrice * Math.max(0.2, eventMultiplier) * Math.exp(volatility * marketPressure);
  return Math.max(minPrice, Math.min(maxPrice, target));
}

export function calculateSmoothedPrice(
  oldPrice: number,
  targetPrice: number,
  alpha: number = 0.25
): number {
  // NewPrice = OldPrice + Alpha * (TargetPrice - OldPrice)
  const newPrice = oldPrice + alpha * (targetPrice - oldPrice);
  return Math.round(newPrice * 100) / 100;
}
