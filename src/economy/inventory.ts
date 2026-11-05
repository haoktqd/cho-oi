import { InventoryLot, MarketLocationId, ProductId, StorageTierId } from '../types';
import { PRODUCTS, STORAGE_TIER_CONFIG } from './catalog';

export function createInventoryLot({
  productId,
  quantity,
  unitCost,
  currentHour,
  currentDay,
  location,
}: {
  productId: ProductId;
  quantity: number;
  unitCost: number;
  currentHour: number;
  currentDay: number;
  location: MarketLocationId;
}): InventoryLot {
  const product = PRODUCTS[productId];
  const absoluteHour = currentDay * 24 + currentHour;
  return {
    id: `lot_${productId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    productId,
    quantity,
    unitCost,
    quality: 100,
    purchasedGameHour: currentHour,
    purchasedDay: currentDay,
    expiryGameHour: absoluteHour + product.shelfLifeHours,
    storageLocation: location,
  };
}

export function calculateTotalWeight(inventory: InventoryLot[]): number {
  return inventory.reduce((sum, lot) => {
    const product = PRODUCTS[lot.productId];
    return sum + (product ? product.unitWeightKg * lot.quantity : lot.quantity);
  }, 0);
}

export function getTotalQuantityByProduct(inventory: InventoryLot[], productId: ProductId): number {
  return inventory
    .filter((lot) => lot.productId === productId && lot.quantity > 0)
    .reduce((sum, lot) => sum + lot.quantity, 0);
}

export interface FifoDeductionResult {
  remainingInventory: InventoryLot[];
  consumedQuantity: number;
  totalCogs: number;          // Cost of Goods Sold
  averageUnitCost: number;
  averageQuality: number;
  spoilageLots: InventoryLot[];
}

/**
 * Consumes quantity from inventory using FIFO (First In, First Out).
 * Oldest lots are consumed first.
 */
export function consumeInventoryFifo(
  inventory: InventoryLot[],
  productId: ProductId,
  quantityToConsume: number
): FifoDeductionResult {
  let needed = quantityToConsume;
  let totalCogs = 0;
  let totalQualityWeight = 0;
  let actualConsumed = 0;

  // Filter lots of this product and sort by oldest first
  const matchingLots = inventory
    .filter((lot) => lot.productId === productId)
    .sort((a, b) => (a.purchasedDay * 24 + a.purchasedGameHour) - (b.purchasedDay * 24 + b.purchasedGameHour));

  const otherLots = inventory.filter((lot) => lot.productId !== productId);
  const updatedMatchingLots: InventoryLot[] = [];

  for (const lot of matchingLots) {
    if (needed <= 0) {
      updatedMatchingLots.push(lot);
      continue;
    }

    const take = Math.min(lot.quantity, needed);
    actualConsumed += take;
    totalCogs += take * lot.unitCost;
    totalQualityWeight += take * lot.quality;
    needed -= take;

    const remainingInLot = lot.quantity - take;
    if (remainingInLot > 0) {
      updatedMatchingLots.push({
        ...lot,
        quantity: remainingInLot,
      });
    }
  }

  const averageUnitCost = actualConsumed > 0 ? totalCogs / actualConsumed : 0;
  const averageQuality = actualConsumed > 0 ? totalQualityWeight / actualConsumed : 100;

  return {
    remainingInventory: [...otherLots, ...updatedMatchingLots],
    consumedQuantity: actualConsumed,
    totalCogs: Math.round(totalCogs * 100) / 100,
    averageUnitCost: Math.round(averageUnitCost * 100) / 100,
    averageQuality: Math.round(averageQuality * 10) / 10,
    spoilageLots: [],
  };
}

/**
 * Updates quality decay across all inventory lots based on elapsed hours and storage tier.
 * Returns updated inventory and any lots that completely spoiled (quality <= 0).
 */
export function updateInventoryDecay(
  inventory: InventoryLot[],
  elapsedHours: number,
  storageTier: StorageTierId
): { updatedInventory: InventoryLot[]; spoiledLots: InventoryLot[] } {
  const storageMultiplier = STORAGE_TIER_CONFIG[storageTier].multiplier;
  const updatedInventory: InventoryLot[] = [];
  const spoiledLots: InventoryLot[] = [];

  for (const lot of inventory) {
    const product = PRODUCTS[lot.productId];
    if (!product) {
      updatedInventory.push(lot);
      continue;
    }

    const decay = product.decayRatePerHour * elapsedHours * storageMultiplier;
    const newQuality = Math.max(0, lot.quality - decay);

    if (newQuality <= 0) {
      spoiledLots.push({ ...lot, quality: 0 });
    } else {
      updatedInventory.push({
        ...lot,
        quality: Math.round(newQuality * 10) / 10,
      });
    }
  }

  return { updatedInventory, spoiledLots };
}

/**
 * Calculates current liquidation value of all inventory based on current market prices and quality.
 */
export function calculateInventoryLiquidationValue(
  inventory: InventoryLot[],
  marketPrices: Record<ProductId, number>
): number {
  return inventory.reduce((sum, lot) => {
    const marketPrice = marketPrices[lot.productId] || PRODUCTS[lot.productId].basePrice;
    // Lower quality reduces liquidation value proportionally
    const qualityFactor = Math.max(0.3, lot.quality / 100);
    return sum + (lot.quantity * marketPrice * qualityFactor * 0.85); // 15% wholesale liquidation discount
  }, 0);
}
