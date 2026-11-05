import React, { useEffect, useState } from 'react';
import { GameSaveState, MarketLocationId, ProcessedRecipeId, ProductId, StorageTierId } from './types';
import { gameManager } from './state/gameState';
import { TopBar } from './ui/hud/TopBar';
import { BottomNav, MainTabType } from './ui/hud/BottomNav';
import { CanvasViewport } from './game/components/CanvasViewport';
import { MarketDashboard } from './ui/market/MarketDashboard';
import { TradingTerminal } from './ui/trading/TradingTerminal';
import { InventoryPanel } from './ui/inventory/InventoryPanel';
import { FinanceDashboard } from './ui/finance/FinanceDashboard';
import { BusinessPanel } from './ui/business/BusinessPanel';
import { KitchenPanel } from './ui/kitchen/KitchenPanel';
import { NewsPanel } from './ui/news/NewsPanel';
import { DialogueModal } from './ui/dialog/DialogueModal';
import { EconomySandbox } from './ui/sandbox/EconomySandbox';
import { MobileControls } from './ui/controls/MobileControls';
import confetti from 'canvas-confetti';

export default function App() {
  const [gameState, setGameState] = useState<GameSaveState>(gameManager.getState());
  const [activeTab, setActiveTab] = useState<MainTabType>('world');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [tradingProduct, setTradingProduct] = useState<{ id: ProductId; mode: 'buy' | 'sell' } | null>(null);
  const [activeNpcId, setActiveNpcId] = useState<string | null>(null);
  const [showSandbox, setShowSandbox] = useState<boolean>(false);
  const [bargainDiscount, setBargainDiscount] = useState<number>(0);

  // Mobile virtual joystick input
  const [mobileDirection, setMobileDirection] = useState<{ x: number; z: number }>({ x: 0, z: 0 });

  useEffect(() => {
    const unsubscribe = gameManager.subscribe((newState) => {
      setGameState(newState);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  const handleTravel = (targetLoc: MarketLocationId) => {
    const res = gameManager.travelTo(targetLoc);
    showToast(res.message);
  };

  const handleExecuteBuy = (productId: ProductId, qty: number, discount: number) => {
    const res = gameManager.buy(productId, qty, discount);
    showToast(res.message);
    setBargainDiscount(0);
  };

  const handleExecuteSell = (productId: ProductId, qty: number, discount: number) => {
    const res = gameManager.sell(productId, qty, discount);
    showToast(res.message);
    setBargainDiscount(0);
  };

  const handleCook = (recipeId: ProcessedRecipeId) => {
    const res = gameManager.cook(recipeId);
    showToast(res.message);
  };

  const handleSellDish = (recipeId: ProcessedRecipeId) => {
    const res = gameManager.sellProcessedGood(recipeId);
    showToast(res.message);
  };

  const handleCompleteContract = (contractId: string) => {
    const res = gameManager.completeContract(contractId);
    showToast(res.message);
    if (res.success) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleUpgradeStorage = (tier: StorageTierId) => {
    const res = gameManager.upgradeStorage(tier);
    showToast(res.message);
  };

  const handleUpgradeCapacity = (amount: number, cost: number) => {
    const res = gameManager.upgradeCapacity(amount, cost);
    showToast(res.message);
  };

  const handleHireStaff = (role: 'assistants' | 'drivers' | 'accountants', cost: number) => {
    const res = gameManager.hireStaff(role, cost);
    showToast(res.message);
  };

  const handleBargain = (npcId: string, quantity: number) => {
    const res = gameManager.bargain(npcId, quantity);
    if (res.success) {
      setBargainDiscount(res.discountPercentage);
    }
    return res;
  };

  return (
    <div className="app-wrapper">
      {/* Top Bar HUD */}
      <TopBar
        state={gameState}
        onTravel={handleTravel}
        onSetSpeed={(s) => gameManager.setTickSpeed(s)}
        onOpenSandbox={() => setShowSandbox(true)}
      />

      {/* Main Game Layout */}
      <main className="main-content-layout">
        {/* 3D WebGL Canvas (Always active in background for smooth immersion) */}
        <div className="viewport-scene-wrapper">
          <CanvasViewport
            locationId={gameState.currentLocation}
            weather={gameState.clock.weather}
            hour={gameState.clock.hour}
            onSelectProduct={(pid) => setTradingProduct({ id: pid, mode: 'buy' })}
            onTalkNpc={(npcId) => setActiveNpcId(npcId)}
            mobileDirection={mobileDirection}
          />

          <div className="world-scene-header-pill">
            <span className="live-pulse-dot" />
            <span>
              {gameState.currentLocation === 'wholesale_market'
                ? 'CHỢ ĐẦU MỐI NÔNG SẢN · BÁN BUÔN SỐ LƯỢNG LỚN'
                : 'CHỢ DÂN SINH TRUYỀN THỐNG · PHIÊN SÁNG TẤP NẬP'}
            </span>
          </div>

          <div className="world-controls-guide">
            <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> hoặc 🖱️ Click chuột vào đất để di chuyển <span>·</span> Click vào sạp để mua bán <span>·</span> Click tiểu thương để trò chuyện
          </div>

          <MobileControls
            onDirectionChange={(dir) => setMobileDirection(dir)}
            onOpenQuickMarket={() => setActiveTab('market')}
            onOpenQuickInventory={() => setActiveTab('inventory')}
          />
        </div>

        {/* Dynamic Panels Overlay when switching tabs */}
        {activeTab !== 'world' && (
          <div className="overlay-view-wrapper">
            {activeTab === 'market' && (
              <MarketDashboard
                state={gameState}
                onOpenTrade={(pid, mode) => setTradingProduct({ id: pid, mode })}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryPanel
                state={gameState}
                onOpenTrade={(pid, mode) => setTradingProduct({ id: pid, mode })}
                onUpgradeStorage={handleUpgradeStorage}
                onUpgradeCapacity={handleUpgradeCapacity}
              />
            )}

            {activeTab === 'finance' && <FinanceDashboard state={gameState} />}

            {activeTab === 'business' && (
              <BusinessPanel
                state={gameState}
                onCompleteContract={handleCompleteContract}
                onHireStaff={handleHireStaff}
                onUpgradeCapacity={handleUpgradeCapacity}
              />
            )}

            {activeTab === 'kitchen' && (
              <KitchenPanel
                state={gameState}
                onCookRecipe={handleCook}
                onSellDish={handleSellDish}
              />
            )}

            {activeTab === 'news' && <NewsPanel state={gameState} />}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        currentTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        inventoryCount={gameState.inventory.length}
        unreadNewsCount={gameState.activeEvents.length}
        contractCount={gameState.contracts.filter((c) => !c.completed && !c.expired).length}
      />

      {/* Trading Modal */}
      {tradingProduct && (
        <TradingTerminal
          state={gameState}
          productId={tradingProduct.id}
          initialMode={tradingProduct.mode}
          onClose={() => setTradingProduct(null)}
          onExecuteBuy={handleExecuteBuy}
          onExecuteSell={handleExecuteSell}
          onOpenBargain={(pid) => {
            const vendorId = pid === 'fish' ? 'ba_sau' : pid === 'rice' ? 'bac_bay' : 'ba_tu';
            setActiveNpcId(vendorId);
          }}
          bargainDiscount={bargainDiscount}
        />
      )}

      {/* NPC Dialogue Modal */}
      {activeNpcId && gameState.npcs[activeNpcId] && (
        <DialogueModal
          npc={gameState.npcs[activeNpcId]}
          playerReputation={gameState.reputation}
          onClose={() => setActiveNpcId(null)}
          onBargain={handleBargain}
          onOpenTradeProduct={(pid) => setTradingProduct({ id: pid, mode: 'buy' })}
        />
      )}

      {/* Headless Sandbox Modal */}
      {showSandbox && (
        <EconomySandbox
          state={gameState}
          onClose={() => setShowSandbox(false)}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast-notification-pill">
          <span>🔔</span> {toastMessage}
        </div>
      )}
    </div>
  );
}
