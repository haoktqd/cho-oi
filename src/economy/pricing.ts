import { MarketLocationId, ProductId } from '../types';

export interface PriceQuote {
  productId: ProductId;
  locationId: MarketLocationId;
  marketPrice: number;
  unitBuyPrice: number;
  unitSellPrice: number;
  quantity: number;
  priceImpact: number;
  totalCost: number;       // For buying
  totalProceeds: number;   // For selling
  estimatedUnitCost: number;
  fee: number;
}

export function calculatePriceImpact(quantity: number, targetStock: number): number {
  if (targetStock <= 0) return 0.25;
  const rawImpact = quantity / targetStock;
  return Math.min(0.25, Math.max(0, rawImpact * 0.5));
}

export function getPriceQuote({
  productId,
  locationId,
  marketPrice,
  buySpread,
  sellSpread,
  quantity,
  targetStock,
  bargainDiscount = 0,
}: {
  productId: ProductId;
  locationId: MarketLocationId;
  marketPrice: number;
  buySpread: number;
  sellSpread: number;
  quantity: number;
  targetStock: number;
  bargainDiscount?: number; // e.g. 0.05 for 5% discount negotiated
}): PriceQuote {
  const safeQty = Math.max(1, Math.floor(quantity));
  const priceImpact = calculatePriceImpact(safeQty, targetStock);

  // Buy price increases with buy spread and price impact, reduced by bargain discount
  const effectiveBuySpread = Math.max(0, buySpread - bargainDiscount);
  const unitBuyPrice = Math.round(marketPrice * (1 + effectiveBuySpread + priceImpact) * 100) / 100;

  // Sell price decreases with sell spread and price impact, increased by bargain bonus
  const effectiveSellSpread = Math.max(0, sellSpread - bargainDiscount);
  const unitSellPrice = Math.max(0.1, Math.round(marketPrice * (1 - effectiveSellSpread - priceImpact) * 100) / 100);

  const totalCost = Math.round(unitBuyPrice * safeQty * 100) / 100;
  const totalProceeds = Math.round(unitSellPrice * safeQty * 100) / 100;

  return {
    productId,
    locationId,
    marketPrice,
    unitBuyPrice,
    unitSellPrice,
    quantity: safeQty,
    priceImpact,
    totalCost,
    totalProceeds,
    estimatedUnitCost: unitBuyPrice,
    fee: Math.round(marketPrice * safeQty * buySpread * 100) / 100,
  };
}
