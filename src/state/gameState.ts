import {
  GameSaveState,
  MarketLocationId,
  ProcessedRecipeId,
  ProductId,
  StorageTierId,
} from '../types';
import { PRODUCTS, RECIPES, STORAGE_TIER_CONFIG } from '../economy/catalog';
import { createInitialLocationState, executeMarketTick } from '../economy/simulation';
import {
  consumeInventoryFifo,
  createInventoryLot,
  calculateTotalWeight,
  getTotalQuantityByProduct,
  calculateInventoryLiquidationValue,
} from '../economy/inventory';
import { getPriceQuote } from '../economy/pricing';
import { calculateNetWorth, createLedgerEntry, getRankForNetWorth } from '../economy/finance';
import { INITIAL_NPCS, attemptBargain, BargainAttemptResult } from '../economy/npc';
import { generateContract } from '../economy/contracts';
import { sound } from '../audio/soundSystem';
import { firebaseService, AuthUser } from '../services/firebase';

const SAVE_KEY = 'cho_oi_master_save_v2';

export function createNewGameState(): GameSaveState {
  const localMarket = createInitialLocationState('local_market');
  const wholesaleMarket = createInitialLocationState('wholesale_market');

  const initialContracts = [
    generateContract(1, 7),
    generateContract(1, 8),
  ];

  return {
    version: 2,
    lastSaved: Date.now(),
    clock: {
      day: 1,
      hour: 7,
      minute: 0,
      tickSpeed: 1,
      weather: 'sunny',
    },
    cash: 500, // 500 coins starting capital as specified in Prompt
    currentLocation: 'local_market',
    playerRankLevel: 1,
    reputation: 25,
    inventory: [
      createInventoryLot({
        productId: 'tomato',
        quantity: 4,
        unitCost: 5,
        currentHour: 7,
        currentDay: 1,
        location: 'local_market',
      }),
      createInventoryLot({
        productId: 'greens',
        quantity: 5,
        unitCost: 4,
        currentHour: 7,
        currentDay: 1,
        location: 'local_market',
      }),
    ],
    processedGoods: {
      soup_tomato_egg: 0,
      stir_fried_greens: 0,
      braised_fish: 0,
      comfort_rice_set: 0,
    },
    business: {
      storageTier: 'ambient',
      maxInventoryCapacity: 40, // 40 kg initial capacity
      ownedStalls: {
        localMarket: false,
        wholesaleMarket: false,
      },
      employees: {
        assistants: 0,
        drivers: 0,
        accountants: 0,
      },
    },
    locations: {
      local_market: localMarket,
      wholesale_market: wholesaleMarket,
    },
    activeEvents: [],
    eventHistory: [],
    contracts: initialContracts,
    ledger: [
      createLedgerEntry({
        gameDay: 1,
        gameHour: 7,
        type: 'TRADE_BUY',
        description: 'Vốn khởi nghiệp ban đầu của tiểu thương',
        amount: 500,
        balanceAfter: 500,
      }),
    ],
    financialStats: {
      totalRevenue: 0,
      totalCOGS: 0,
      totalExpenses: 0,
      netProfit: 0,
      netWorthHistory: [{ day: 1, netWorth: 540 }],
    },
    npcs: { ...INITIAL_NPCS },
  };
}

export class GameManager {
  private state: GameSaveState;
  private listeners: Set<(state: GameSaveState) => void> = new Set();
  private syncListeners: Set<(status: 'synced' | 'syncing' | 'idle' | 'error') => void> = new Set();
  private tickIntervalId: number | null = null;
  private lastCloudSaveTime: number = 0;
  private isCloudSaving: boolean = false;
  public cloudSyncStatus: 'synced' | 'syncing' | 'idle' | 'error' = 'idle';

  constructor() {
    this.state = this.loadFromStorage() || createNewGameState();
    this.startSimulationLoop();
    this.initCloudAuthSync();
    this.initLifecycleSync();
  }

  private initCloudAuthSync() {
    if (typeof window !== 'undefined') {
      firebaseService.subscribeAuth(async (user: AuthUser | null) => {
        if (user) {
          this.setCloudSyncStatus('syncing');
          try {
            const cloudSave = await firebaseService.loadGameStateFromCloud(user.uid);
            if (cloudSave) {
              // Tự động nạp tiến trình từ đám mây về máy
              this.state = cloudSave;
              this.saveToStorage(false); // Lưu cục bộ làm bộ đệm
              this.notify();
              this.setCloudSyncStatus('synced');
            } else {
              // Lần đầu đăng nhập: tự động tải tiến trình hiện tại lên đám mây
              await firebaseService.saveGameStateToCloud(user.uid, this.state);
              this.setCloudSyncStatus('synced');
            }
          } catch (err) {
            this.setCloudSyncStatus('error');
          }
        } else {
          this.setCloudSyncStatus('idle');
        }
      });
    }
  }

  /**
   * Tự động lưu đám mây khi người chơi đóng tab hoặc chuyển tab/ứng dụng trên điện thoại
   */
  private initLifecycleSync() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.triggerCloudSave(true);
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.triggerCloudSave(true);
        }
      });
    }
  }

  public subscribeSyncStatus(listener: (status: 'synced' | 'syncing' | 'idle' | 'error') => void): () => void {
    this.syncListeners.add(listener);
    listener(this.cloudSyncStatus);
    return () => this.syncListeners.delete(listener);
  }

  private setCloudSyncStatus(status: 'synced' | 'syncing' | 'idle' | 'error') {
    this.cloudSyncStatus = status;
    this.syncListeners.forEach((l) => l(status));
  }

  public getState(): GameSaveState {
    return this.state;
  }

  public subscribe(listener: (state: GameSaveState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify(immediateCloud: boolean = false) {
    this.listeners.forEach((l) => l(this.state));
    this.saveToStorage(true);
    if (immediateCloud) {
      this.triggerCloudSave(true);
    }
  }

  private startSimulationLoop() {
    if (this.tickIntervalId) {
      clearInterval(this.tickIntervalId);
    }
    // Only run automatic interval if in browser
    if (typeof window !== 'undefined') {
      this.tickIntervalId = window.setInterval(() => {
        if (this.state.clock.tickSpeed > 0) {
          const minutes = 5 * this.state.clock.tickSpeed;
          this.state = executeMarketTick(this.state, minutes);
          this.notify();
        }
      }, 1200);
    }
  }

  public setTickSpeed(speed: number) {
    this.state = {
      ...this.state,
      clock: {
        ...this.state.clock,
        tickSpeed: speed,
      },
    };
    this.notify();
  }

  public advanceTick(minutes: number = 60) {
    this.state = executeMarketTick(this.state, minutes);
    this.notify();
  }

  public travelTo(targetLocation: MarketLocationId): { success: boolean; message: string } {
    if (this.state.currentLocation === targetLocation) {
      return { success: false, message: 'Bạn đang ở địa điểm này rồi!' };
    }

    const travelFee = this.state.business.employees.drivers > 0 ? 3 : 8;
    if (this.state.cash < travelFee) {
      return { success: false, message: `Không đủ tiền đi lại! Cần ${travelFee} xu tiền xe.` };
    }

    // Deduct fee and advance time 30 mins
    const newCash = this.state.cash - travelFee;
    let nextState = executeMarketTick(
      {
        ...this.state,
        cash: newCash,
        currentLocation: targetLocation,
        ledger: [
          createLedgerEntry({
            gameDay: this.state.clock.day,
            gameHour: this.state.clock.hour,
            type: 'TRAVEL_EXPENSE',
            description: `Di chuyển sang ${targetLocation === 'wholesale_market' ? 'Chợ Đầu Mối' : 'Chợ Dân Sinh'}`,
            amount: -travelFee,
            balanceAfter: newCash,
          }),
          ...this.state.ledger,
        ],
      },
      30
    );

    this.state = nextState;
    sound.playCoin();
    this.notify(true);
    return {
      success: true,
      message: `Đã di chuyển tới ${targetLocation === 'wholesale_market' ? 'Chợ Đầu Mối' : 'Chợ Dân Sinh'} (Phí xe: ${travelFee} xu).`,
    };
  }

  public buy(
    productId: ProductId,
    quantity: number,
    bargainDiscount: number = 0
  ): { success: boolean; message: string } {
    const loc = this.state.locations[this.state.currentLocation];
    const item = loc.items[productId];
    const product = PRODUCTS[productId];

    // Check inventory capacity
    const currentWeight = calculateTotalWeight(this.state.inventory);
    const addedWeight = product.unitWeightKg * quantity;
    if (currentWeight + addedWeight > this.state.business.maxInventoryCapacity) {
      return {
        success: false,
        message: `Sức chứa không đủ! (Hiện có: ${currentWeight.toFixed(1)}/${this.state.business.maxInventoryCapacity} kg). Cần nâng cấp kho hoặc xe thồ!`,
      };
    }

    // Check market supply
    if (quantity > item.availableSupply) {
      return {
        success: false,
        message: `Chợ chỉ còn ${item.availableSupply} đơn vị ${product.vietnameseName}!`,
      };
    }

    const quote = getPriceQuote({
      productId,
      locationId: this.state.currentLocation,
      marketPrice: item.currentPrice,
      buySpread: item.buySpread,
      sellSpread: item.sellSpread,
      quantity,
      targetStock: item.targetStock,
      bargainDiscount,
    });

    if (this.state.cash < quote.totalCost) {
      return {
        success: false,
        message: `Không đủ tiền! Cần ${quote.totalCost} xu nhưng ví chỉ còn ${this.state.cash} xu.`,
      };
    }

    const newCash = this.state.cash - quote.totalCost;
    const newLot = createInventoryLot({
      productId,
      quantity,
      unitCost: quote.unitBuyPrice,
      currentHour: this.state.clock.hour,
      currentDay: this.state.clock.day,
      location: this.state.currentLocation,
    });

    // Market supply diminishes
    const updatedSupply = Math.max(0, item.availableSupply - quantity);
    const updatedLoc = {
      ...loc,
      items: {
        ...loc.items,
        [productId]: {
          ...item,
          availableSupply: updatedSupply,
        },
      },
    };

    const newLedger = [
      createLedgerEntry({
        gameDay: this.state.clock.day,
        gameHour: this.state.clock.hour,
        type: 'TRADE_BUY',
        description: `Mua ${quantity} ${product.vietnameseName} (${quote.unitBuyPrice} xu/đv)`,
        amount: -quote.totalCost,
        balanceAfter: newCash,
      }),
      ...this.state.ledger,
    ];

    this.state = {
      ...this.state,
      cash: Math.round(newCash * 100) / 100,
      inventory: [newLot, ...this.state.inventory],
      locations: {
        ...this.state.locations,
        [this.state.currentLocation]: updatedLoc,
      },
      ledger: newLedger.slice(0, 100),
    };

    sound.playCoin();
    this.notify(true);
    return {
      success: true,
      message: `Đã mua thành công ${quantity} ${product.vietnameseName} với giá ${quote.totalCost} xu!`,
    };
  }

  public sell(
    productId: ProductId,
    quantity: number,
    bargainDiscount: number = 0
  ): { success: boolean; message: string; profit: number } {
    const loc = this.state.locations[this.state.currentLocation];
    const item = loc.items[productId];
    const product = PRODUCTS[productId];

    const currentOwned = getTotalQuantityByProduct(this.state.inventory, productId);
    if (currentOwned < quantity) {
      return {
        success: false,
        message: `Bạn chỉ có ${currentOwned} đơn vị ${product.vietnameseName} trong kho!`,
        profit: 0,
      };
    }

    const quote = getPriceQuote({
      productId,
      locationId: this.state.currentLocation,
      marketPrice: item.currentPrice,
      buySpread: item.buySpread,
      sellSpread: item.sellSpread,
      quantity,
      targetStock: item.targetStock,
      bargainDiscount,
    });

    // Consume inventory using FIFO
    const fifoResult = consumeInventoryFifo(this.state.inventory, productId, quantity);
    const revenue = quote.totalProceeds;
    const cogs = fifoResult.totalCogs;
    const profit = Math.round((revenue - cogs) * 100) / 100;
    const newCash = this.state.cash + revenue;

    // Market receives supply
    const updatedSupply = item.availableSupply + quantity;
    const updatedLoc = {
      ...loc,
      items: {
        ...loc.items,
        [productId]: {
          ...item,
          availableSupply: updatedSupply,
        },
      },
    };

    const newLedger = [
      createLedgerEntry({
        gameDay: this.state.clock.day,
        gameHour: this.state.clock.hour,
        type: 'TRADE_SELL',
        description: `Bán ${quantity} ${product.vietnameseName} (Thu: ${revenue} xu, Vốn: ${cogs} xu)`,
        amount: revenue,
        cogs,
        balanceAfter: newCash,
      }),
      ...this.state.ledger,
    ];

    this.state = {
      ...this.state,
      cash: Math.round(newCash * 100) / 100,
      inventory: fifoResult.remainingInventory,
      locations: {
        ...this.state.locations,
        [this.state.currentLocation]: updatedLoc,
      },
      ledger: newLedger.slice(0, 100),
      financialStats: {
        ...this.state.financialStats,
        totalRevenue: this.state.financialStats.totalRevenue + revenue,
        totalCOGS: this.state.financialStats.totalCOGS + cogs,
        netProfit: this.state.financialStats.netProfit + profit,
      },
      reputation: this.state.reputation + Math.max(1, Math.floor(quantity / 5)),
    };

    if (profit > 15) {
      sound.playCashRegister();
    } else {
      sound.playCoin();
    }

    this.notify(true);
    return {
      success: true,
      message: `Đã bán ${quantity} ${product.vietnameseName}! Thu về ${revenue} xu (Lợi nhuận: ${profit >= 0 ? '+' : ''}${profit} xu).`,
      profit,
    };
  }

  public cook(recipeId: ProcessedRecipeId): { success: boolean; message: string } {
    const recipe = RECIPES[recipeId];
    if (this.state.playerRankLevel < recipe.unlockedAtRank) {
      return { success: false, message: `Chưa mở khóa công thức này (Yêu cầu Cấp ${recipe.unlockedAtRank})!` };
    }

    if (this.state.cash < recipe.laborCost) {
      return { success: false, message: `Không đủ tiền công nấu nướng (${recipe.laborCost} xu)!` };
    }

    // Check ingredients
    for (const ing of recipe.ingredients) {
      const owned = getTotalQuantityByProduct(this.state.inventory, ing.productId);
      if (owned < ing.quantity) {
        return {
          success: false,
          message: `Thiếu nguyên liệu! Cần ${ing.quantity} ${PRODUCTS[ing.productId].vietnameseName} (Bạn có ${owned}).`,
        };
      }
    }

    // Consume ingredients FIFO
    let currentInv = [...this.state.inventory];
    let totalIngredientCost = 0;
    for (const ing of recipe.ingredients) {
      const res = consumeInventoryFifo(currentInv, ing.productId, ing.quantity);
      currentInv = res.remainingInventory;
      totalIngredientCost += res.totalCogs;
    }

    const newCash = this.state.cash - recipe.laborCost;
    const currentProcessed = this.state.processedGoods[recipeId] || 0;

    const newLedger = [
      createLedgerEntry({
        gameDay: this.state.clock.day,
        gameHour: this.state.clock.hour,
        type: 'RECIPE_PRODUCE',
        description: `Chế biến ${recipe.name} (Phí chế biến: ${recipe.laborCost} xu)`,
        amount: -recipe.laborCost,
        balanceAfter: newCash,
      }),
      ...this.state.ledger,
    ];

    this.state = {
      ...this.state,
      cash: newCash,
      inventory: currentInv,
      processedGoods: {
        ...this.state.processedGoods,
        [recipeId]: currentProcessed + 1,
      },
      ledger: newLedger.slice(0, 100),
    };

    sound.playCooking();
    this.notify(true);
    return {
      success: true,
      message: `Đã chế biến thành công một suất ${recipe.name}! Món ăn sẵn sàng bán giá cao!`,
    };
  }

  public sellProcessedGood(recipeId: ProcessedRecipeId): { success: boolean; message: string } {
    const recipe = RECIPES[recipeId];
    const count = this.state.processedGoods[recipeId] || 0;
    if (count <= 0) {
      return { success: false, message: `Bạn không còn ${recipe.name} nào trong bếp!` };
    }

    const revenue = recipe.saleValue;
    const newCash = this.state.cash + revenue;

    const newLedger = [
      createLedgerEntry({
        gameDay: this.state.clock.day,
        gameHour: this.state.clock.hour,
        type: 'RECIPE_SELL',
        description: `Bán suất ${recipe.name} cho thực khách`,
        amount: revenue,
        balanceAfter: newCash,
      }),
      ...this.state.ledger,
    ];

    this.state = {
      ...this.state,
      cash: newCash,
      processedGoods: {
        ...this.state.processedGoods,
        [recipeId]: count - 1,
      },
      ledger: newLedger.slice(0, 100),
      reputation: this.state.reputation + 4,
    };

    sound.playCashRegister();
    this.notify(true);
    return {
      success: true,
      message: `Bán ${recipe.name} thành công! Nhận được ${revenue} xu!`,
    };
  }

  public completeContract(contractId: string): { success: boolean; message: string } {
    const contract = this.state.contracts.find((c) => c.id === contractId);
    if (!contract || contract.completed || contract.expired) {
      return { success: false, message: 'Hợp đồng không hợp lệ hoặc đã kết thúc!' };
    }

    const owned = getTotalQuantityByProduct(this.state.inventory, contract.productId);
    if (owned < contract.requiredQuantity) {
      return {
        success: false,
        message: `Không đủ hàng giao! Cần ${contract.requiredQuantity} ${PRODUCTS[contract.productId].vietnameseName} (Bạn có ${owned}).`,
      };
    }

    const fifoRes = consumeInventoryFifo(this.state.inventory, contract.productId, contract.requiredQuantity);
    const revenue = contract.rewardCoins;
    const newCash = this.state.cash + revenue;

    const updatedContracts = this.state.contracts.map((c) =>
      c.id === contractId ? { ...c, completed: true } : c
    );

    const newLedger = [
      createLedgerEntry({
        gameDay: this.state.clock.day,
        gameHour: this.state.clock.hour,
        type: 'CONTRACT_PAYOUT',
        description: `Hoàn tất hợp đồng: ${contract.clientName} (+${contract.rewardCoins} xu)`,
        amount: revenue,
        cogs: fifoRes.totalCogs,
        balanceAfter: newCash,
      }),
      ...this.state.ledger,
    ];

    this.state = {
      ...this.state,
      cash: newCash,
      inventory: fifoRes.remainingInventory,
      contracts: updatedContracts,
      ledger: newLedger.slice(0, 100),
      reputation: this.state.reputation + contract.bonusReputation,
    };

    sound.playSuccessFanfare();
    this.notify(true);
    return {
      success: true,
      message: `Xuất sắc! Đã giao hợp đồng cho ${contract.clientName}! Nhận ${revenue} xu và +${contract.bonusReputation} uy tín!`,
    };
  }

  public upgradeStorage(newTier: StorageTierId): { success: boolean; message: string } {
    const config = STORAGE_TIER_CONFIG[newTier];
    if (this.state.business.storageTier === newTier) {
      return { success: false, message: 'Bạn đang sở hữu tầng kho bãi này rồi!' };
    }

    if (this.state.cash < config.upgradeCost) {
      return {
        success: false,
        message: `Không đủ tiền! Cần ${config.upgradeCost} xu để nâng cấp ${config.name}.`,
      };
    }

    const newCash = this.state.cash - config.upgradeCost;
    const newCapacity = Math.max(this.state.business.maxInventoryCapacity, config.capacity);

    this.state = {
      ...this.state,
      cash: newCash,
      business: {
        ...this.state.business,
        storageTier: newTier,
        maxInventoryCapacity: newCapacity,
      },
      ledger: [
        createLedgerEntry({
          gameDay: this.state.clock.day,
          gameHour: this.state.clock.hour,
          type: 'ASSET_PURCHASE',
          description: `Nâng cấp cơ sở vật chất: ${config.name}`,
          amount: -config.upgradeCost,
          balanceAfter: newCash,
        }),
        ...this.state.ledger,
      ],
    };

    sound.playSuccessFanfare();
    this.notify(true);
    return {
      success: true,
      message: `Chúc mừng! Bạn đã nâng cấp thành công ${config.name}! Tốc độ hư hỏng hàng hóa giảm đáng kể.`,
    };
  }

  public upgradeCapacity(amount: number, cost: number): { success: boolean; message: string } {
    if (this.state.cash < cost) {
      return { success: false, message: `Không đủ tiền! Cần ${cost} xu để sắm phương tiện mới.` };
    }

    const newCash = this.state.cash - cost;
    const newCapacity = this.state.business.maxInventoryCapacity + amount;

    this.state = {
      ...this.state,
      cash: newCash,
      business: {
        ...this.state.business,
        maxInventoryCapacity: newCapacity,
      },
      ledger: [
        createLedgerEntry({
          gameDay: this.state.clock.day,
          gameHour: this.state.clock.hour,
          type: 'ASSET_PURCHASE',
          description: `Mua thêm xe đẩy/sọt hàng (+${amount} kg sức chứa)`,
          amount: -cost,
          balanceAfter: newCash,
        }),
        ...this.state.ledger,
      ],
    };

    sound.playSuccessFanfare();
    this.notify(true);
    return {
      success: true,
      message: `Nâng cấp thành công! Sức chứa hàng hóa hiện tại đã lên tới ${newCapacity} kg!`,
    };
  }

  public hireStaff(role: 'assistants' | 'drivers' | 'accountants', hiringCost: number): { success: boolean; message: string } {
    if (this.state.cash < hiringCost) {
      return { success: false, message: `Không đủ tiền ký quỹ tuyển dụng (${hiringCost} xu)!` };
    }

    const newCash = this.state.cash - hiringCost;
    const currentEmployees = { ...this.state.business.employees };
    currentEmployees[role] = (currentEmployees[role] || 0) + 1;

    this.state = {
      ...this.state,
      cash: newCash,
      business: {
        ...this.state.business,
        employees: currentEmployees,
      },
      ledger: [
        createLedgerEntry({
          gameDay: this.state.clock.day,
          gameHour: this.state.clock.hour,
          type: 'EMPLOYEE_SALARY',
          description: `Tuyển nhân viên mới: ${role === 'assistants' ? 'Phụ tá bán hàng' : role === 'drivers' ? 'Tài xế giao hàng' : 'Kế toán kho'}`,
          amount: -hiringCost,
          balanceAfter: newCash,
        }),
        ...this.state.ledger,
      ],
    };

    sound.playSuccessFanfare();
    this.notify(true);
    return {
      success: true,
      message: `Tuyển dụng thành công! Nhân viên mới đã bắt đầu ca làm việc hỗ trợ bạn buôn bán.`,
    };
  }

  public bargain(npcId: string, targetQuantity: number): BargainAttemptResult {
    const npc = this.state.npcs[npcId];
    if (!npc) {
      return { success: false, discountPercentage: 0, message: 'Không tìm thấy tiểu thương này.', relationshipChange: 0 };
    }

    const result = attemptBargain(npc, this.state.reputation, targetQuantity);
    const newRelationship = Math.max(0, Math.min(100, npc.relationshipScore + result.relationshipChange));

    this.state = {
      ...this.state,
      npcs: {
        ...this.state.npcs,
        [npcId]: {
          ...npc,
          relationshipScore: newRelationship,
        },
      },
    };

    if (result.success) {
      sound.playBargainSuccess();
    }
    this.notify();
    return result;
  }

  public saveToStorage(syncCloud: boolean = true) {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        this.state.lastSaved = Date.now();
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
        if (syncCloud) {
          this.triggerCloudSave(false);
        }
      }
    } catch {
      // Storage unavailable / quota exceeded
    }
  }

  /**
   * Tự động đồng bộ tiến trình lên Cloud (Firebase Firestore)
   * - immediate = true: Lưu ngay lập tức khi người chơi Mua/Bán/Nấu ăn/Đổi chợ/Thoát tab
   * - immediate = false: Tự động gom và lưu định kỳ (mỗi 15s) trong lúc chơi bình thường
   */
  public async triggerCloudSave(immediate: boolean = false) {
    if (typeof window === 'undefined') return;
    const user = firebaseService.currentUser;
    if (!user || this.isCloudSaving) return;

    const now = Date.now();
    // Throttle định kỳ 15 giây khi không phải hành động khẩn cấp
    if (!immediate && now - this.lastCloudSaveTime < 15000) {
      return;
    }

    this.isCloudSaving = true;
    this.setCloudSyncStatus('syncing');

    try {
      const res = await firebaseService.saveGameStateToCloud(user.uid, this.state);
      this.lastCloudSaveTime = Date.now();
      this.setCloudSyncStatus(res.success ? 'synced' : 'error');
    } catch {
      this.setCloudSyncStatus('error');
    } finally {
      this.isCloudSaving = false;
    }
  }

  private loadFromStorage(): GameSaveState | null {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === 2) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return null;
  }

  public reset() {
    this.state = createNewGameState();
    this.saveToStorage();
    this.notify();
  }

  public exportSave(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importSave(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data && data.version === 2) {
        this.state = data;
        this.saveToStorage();
        this.notify();
        return true;
      }
    } catch {}
    return false;
  }
}

export const gameManager = new GameManager();
