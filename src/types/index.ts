// CHỢ ƠI! - Type Definitions

export type ProductId = 'tomato' | 'greens' | 'onion' | 'egg' | 'fish' | 'rice';

export type ProcessedRecipeId = 
  | 'soup_tomato_egg' 
  | 'stir_fried_greens' 
  | 'braised_fish' 
  | 'comfort_rice_set';

export type MarketLocationId = 'local_market' | 'wholesale_market';

export type StorageTierId = 'ambient' | 'cool' | 'refrigerated';

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'stormy';

export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';

export interface ProductDefinition {
  id: ProductId;
  name: string;
  vietnameseName: string;
  category: 'vegetable' | 'spice' | 'dairy_poultry' | 'seafood' | 'grain';
  basePrice: number;        // Base price in coins
  baseSupply: number;       // Base supply units per cycle
  baseDemand: number;       // Base demand units per cycle
  demandElasticity: number; // e.g. 1.20
  supplyElasticity: number; // e.g. 0.85
  volatility: number;       // e.g. 0.15
  shelfLifeHours: number;   // Hours until 0% quality
  decayRatePerHour: number; // % quality loss per hour
  unitWeightKg: number;     // Weight per unit in kg
  minPrice: number;
  maxPrice: number;
  color: string;
  emoji: string;
  description: string;
}

export interface ProcessedRecipe {
  id: ProcessedRecipeId;
  name: string;
  emoji: string;
  description: string;
  ingredients: { productId: ProductId; quantity: number }[];
  laborCost: number;       // Processing fee in coins
  saleValue: number;       // Default sale price in coins
  cookTimeMinutes: number; // In-game minutes
  unlockedAtRank: number;
}

export interface InventoryLot {
  id: string;
  productId: ProductId;
  quantity: number;
  unitCost: number;        // Purchase price per unit
  quality: number;         // 0 to 100
  purchasedGameHour: number;
  purchasedDay: number;
  expiryGameHour: number;
  storageLocation: MarketLocationId;
}

export interface MarketItemState {
  productId: ProductId;
  currentPrice: number;
  previousPrice: number;
  basePrice: number;
  availableSupply: number;
  targetStock: number;
  currentDemand: number;
  priceHistory: number[];  // Last 30 tick prices for sparklines
  buySpread: number;       // e.g. 0.03
  sellSpread: number;      // e.g. 0.03
}

export interface MarketLocationState {
  id: MarketLocationId;
  name: string;
  shortName: string;
  description: string;
  items: Record<ProductId, MarketItemState>;
  retailMarkupMultiplier: number;
  spread: number;
  trafficFactor: number;
}

export type EventType = 
  | 'HEAVY_RAIN' 
  | 'FLOOD' 
  | 'NEW_SHIPMENT' 
  | 'HARVEST_FESTIVAL' 
  | 'HOLIDAY_DEMAND' 
  | 'TRANSPORT_BREAKDOWN' 
  | 'PRICE_WAR' 
  | 'SCARCITY_RUMOR' 
  | 'SPOILAGE_WAVE';

export interface MarketEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  affectedProducts: ProductId[];
  affectedLocations: MarketLocationId[];
  supplyMultiplier: number;
  demandMultiplier: number;
  priceMultiplier: number;
  startDay: number;
  startHour: number;
  durationHours: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reliability: number; // 0.0 to 1.0 (for rumors)
  isRumor: boolean;
  active: boolean;
}

export interface CommercialContract {
  id: string;
  clientName: string;
  clientRole: string;
  productId: ProductId;
  requiredQuantity: number;
  rewardCoins: number;
  bonusReputation: number;
  deadlineDay: number;
  deadlineHour: number;
  completed: boolean;
  accepted: boolean;
  expired: boolean;
}

export type LedgerEntryType = 
  | 'TRADE_BUY'
  | 'TRADE_SELL'
  | 'RECIPE_PRODUCE'
  | 'RECIPE_SELL'
  | 'CONTRACT_PAYOUT'
  | 'STORAGE_RENT'
  | 'EMPLOYEE_SALARY'
  | 'TRAVEL_EXPENSE'
  | 'SPOILAGE_LOSS'
  | 'ASSET_PURCHASE';

export interface LedgerEntry {
  id: string;
  timestamp: string;
  gameDay: number;
  gameHour: number;
  type: LedgerEntryType;
  description: string;
  amount: number; // positive for income, negative for expense
  cogs?: number;  // Cost of Goods Sold for profit calculations
  netProfit?: number;
  balanceAfter: number;
}

export interface PlayerRank {
  level: number;
  title: string;
  minNetWorth: number;
  perks: string[];
}

export interface BusinessAssets {
  storageTier: StorageTierId;
  maxInventoryCapacity: number;
  ownedStalls: {
    localMarket: boolean;
    wholesaleMarket: boolean;
  };
  employees: {
    assistants: number;  // Boosts retail sales & auto-restocks
    drivers: number;     // Reduces transport time & cost
    accountants: number; // Reduces transaction fees & forecasts news
  };
}

export interface NPCProfile {
  id: string;
  name: string;
  title: string;
  avatar: string;
  role: 'supplier' | 'vendor' | 'wholesaler' | 'consumer' | 'competitor' | 'logistics';
  location: MarketLocationId;
  specialtyProduct?: ProductId;
  budget: number;
  relationshipScore: number; // 0 - 100
  dialoguePool: string[];
  bargainTendency: number;   // Willingness to accept discounts
}

export interface SimulationClock {
  day: number;
  hour: number;      // 0 - 23
  minute: number;    // 0 - 59
  tickSpeed: number; // 1 = normal, 5 = fast, 20 = ultra, 0 = paused
  weather: WeatherType;
}

export interface GameSaveState {
  version: number;
  lastSaved: number;
  clock: SimulationClock;
  cash: number;
  currentLocation: MarketLocationId;
  playerRankLevel: number;
  reputation: number;
  inventory: InventoryLot[];
  processedGoods: Record<ProcessedRecipeId, number>;
  business: BusinessAssets;
  locations: Record<MarketLocationId, MarketLocationState>;
  activeEvents: MarketEvent[];
  eventHistory: MarketEvent[];
  contracts: CommercialContract[];
  ledger: LedgerEntry[];
  financialStats: {
    totalRevenue: number;
    totalCOGS: number;
    totalExpenses: number;
    netProfit: number;
    netWorthHistory: { day: number; netWorth: number }[];
  };
  npcs: Record<string, NPCProfile>;
}
