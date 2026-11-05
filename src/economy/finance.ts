import { BusinessAssets, LedgerEntry, LedgerEntryType, PlayerRank } from '../types';
import { PLAYER_RANKS, STORAGE_TIER_CONFIG } from './catalog';

export function createLedgerEntry({
  gameDay,
  gameHour,
  type,
  description,
  amount,
  cogs = 0,
  balanceAfter,
}: {
  gameDay: number;
  gameHour: number;
  type: LedgerEntryType;
  description: string;
  amount: number;
  cogs?: number;
  balanceAfter: number;
}): LedgerEntry {
  const netProfit = amount > 0 ? Math.round((amount - cogs) * 100) / 100 : undefined;
  return {
    id: `ledger_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    gameDay,
    gameHour,
    type,
    description,
    amount: Math.round(amount * 100) / 100,
    cogs: cogs > 0 ? Math.round(cogs * 100) / 100 : undefined,
    netProfit,
    balanceAfter: Math.round(balanceAfter * 100) / 100,
  };
}

export function calculateBusinessAssetValue(business: BusinessAssets): number {
  let value = 0;
  // Storage tier investment
  if (business.storageTier === 'cool') value += 2500;
  if (business.storageTier === 'refrigerated') value += 17500;

  // Owned stalls
  if (business.ownedStalls.localMarket) value += 8000;
  if (business.ownedStalls.wholesaleMarket) value += 25000;

  // Vehicles / Capacity upgrades
  const capacityUpgrades = Math.max(0, business.maxInventoryCapacity - 40);
  value += capacityUpgrades * 15;

  return value;
}

export function calculateNetWorth({
  cash,
  inventoryLiquidationValue,
  business,
  liabilities = 0,
}: {
  cash: number;
  inventoryLiquidationValue: number;
  business: BusinessAssets;
  liabilities?: number;
}): number {
  const assetValue = calculateBusinessAssetValue(business);
  const netWorth = cash + inventoryLiquidationValue + assetValue - liabilities;
  return Math.round(Math.max(0, netWorth) * 100) / 100;
}

export function getRankForNetWorth(netWorth: number): PlayerRank {
  for (let i = PLAYER_RANKS.length - 1; i >= 0; i--) {
    if (netWorth >= PLAYER_RANKS[i].minNetWorth) {
      return PLAYER_RANKS[i];
    }
  }
  return PLAYER_RANKS[0];
}

export function getHourlyOperatingCosts(business: BusinessAssets): number {
  let hourlyCost = 0;
  // Storage rent
  hourlyCost += STORAGE_TIER_CONFIG[business.storageTier].rentPerHour;

  // Employee wages
  hourlyCost += business.employees.assistants * 1.5;
  hourlyCost += business.employees.drivers * 2.0;
  hourlyCost += business.employees.accountants * 3.0;

  return hourlyCost;
}
