import React, { useState } from 'react';
import { GameSaveState, ProductId, StorageTierId } from '../../types';
import { PRODUCTS, STORAGE_TIER_CONFIG } from '../../economy/catalog';
import { calculateTotalWeight } from '../../economy/inventory';

interface InventoryPanelProps {
  state: GameSaveState;
  onOpenTrade: (productId: ProductId, mode: 'buy' | 'sell') => void;
  onUpgradeStorage: (tier: StorageTierId) => void;
  onUpgradeCapacity: (amount: number, cost: number) => void;
}

export function InventoryPanel({
  state,
  onOpenTrade,
  onUpgradeStorage,
  onUpgradeCapacity,
}: InventoryPanelProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const totalWeight = calculateTotalWeight(state.inventory);
  const maxCap = state.business.maxInventoryCapacity;
  const capPercent = Math.min(100, (totalWeight / maxCap) * 100);
  const storageConfig = STORAGE_TIER_CONFIG[state.business.storageTier];

  const filteredLots = state.inventory.filter((lot) => {
    if (selectedFilter === 'all') return true;
    return lot.productId === selectedFilter;
  });

  return (
    <div className="inventory-view">
      {/* Capacity & Storage Tier Summary */}
      <div className="storage-summary-card">
        <div className="capacity-header">
          <div>
            <h3>Kho Hàng & Sức Chứa Nông Sản</h3>
            <span className="tier-tag">{storageConfig.name}</span>
          </div>
          <div className="capacity-number">
            <strong>{totalWeight.toFixed(1)}</strong> / {maxCap} kg
          </div>
        </div>

        {/* Progress Bar */}
        <div className="capacity-bar-track">
          <div
            className={`capacity-bar-fill ${capPercent > 85 ? 'full' : capPercent > 60 ? 'warning' : 'normal'}`}
            style={{ width: `${capPercent}%` }}
          />
        </div>

        {/* Storage Upgrades Row */}
        <div className="storage-upgrades-row">
          <div className="upgrade-block">
            <span>Tầng bảo quản lạnh:</span>
            {state.business.storageTier === 'ambient' && (
              <button
                className="btn-upgrade-sm"
                onClick={() => onUpgradeStorage('cool')}
              >
                Lên Kho Mát (2.500 xu - Giảm 50% thối hỏng)
              </button>
            )}
            {state.business.storageTier === 'cool' && (
              <button
                className="btn-upgrade-sm"
                onClick={() => onUpgradeStorage('refrigerated')}
              >
                Lên Kho Lạnh (15.000 xu - Giảm 80% thối hỏng)
              </button>
            )}
            {state.business.storageTier === 'refrigerated' && (
              <span className="badge-max">✓ Tầng Kho Lạnh Tối Tân</span>
            )}
          </div>

          <div className="upgrade-block">
            <span>Mở rộng tải trọng:</span>
            <button
              className="btn-upgrade-sm"
              onClick={() => onUpgradeCapacity(50, 450)}
            >
              +50 kg Xe Thồ (450 xu)
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="inventory-filter-tabs">
        <button
          className={selectedFilter === 'all' ? 'active' : ''}
          onClick={() => setSelectedFilter('all')}
        >
          Tất cả ({state.inventory.length} lô)
        </button>
        {(['tomato', 'greens', 'onion', 'egg', 'fish', 'rice'] as ProductId[]).map((pid) => (
          <button
            key={pid}
            className={selectedFilter === pid ? 'active' : ''}
            onClick={() => setSelectedFilter(pid)}
          >
            {PRODUCTS[pid].emoji} {PRODUCTS[pid].vietnameseName}
          </button>
        ))}
      </div>

      {/* Lots Grid */}
      {filteredLots.length === 0 ? (
        <div className="empty-inventory">
          <span>🧺</span>
          <h4>Kho hàng trống!</h4>
          <p>Hãy dạo quanh các sạp chợ và mua nông sản với giá tốt để bắt đầu buôn bán kiếm lời.</p>
        </div>
      ) : (
        <div className="lots-grid">
          {filteredLots.map((lot) => {
            const pDef = PRODUCTS[lot.productId];
            const isFresh = lot.quality >= 70;
            const isMedium = lot.quality >= 40 && lot.quality < 70;

            return (
              <div className="lot-card" key={lot.id}>
                <div className="lot-header">
                  <div className="lot-identity">
                    <span className="lot-emoji">{pDef.emoji}</span>
                    <div>
                      <strong>{pDef.vietnameseName}</strong>
                      <small>
                        Mua ngày {lot.purchasedDay} lúc {lot.purchasedGameHour}:00
                      </small>
                    </div>
                  </div>
                  <span className="lot-qty-pill">× {lot.quantity} đv</span>
                </div>

                <div className="lot-metrics">
                  <div className="metric-item">
                    <span>Giá vốn nhập:</span>
                    <strong>{lot.unitCost.toFixed(2)} xu / đv</strong>
                  </div>
                  <div className="metric-item">
                    <span>Độ tươi ngon:</span>
                    <strong
                      className={
                        isFresh
                          ? 'text-fresh'
                          : isMedium
                          ? 'text-warning'
                          : 'text-danger'
                      }
                    >
                      {lot.quality.toFixed(1)}%
                    </strong>
                  </div>
                </div>

                {/* Freshness Bar */}
                <div className="freshness-bar-track">
                  <div
                    className={`freshness-bar-fill ${
                      isFresh ? 'fresh' : isMedium ? 'warning' : 'spoiling'
                    }`}
                    style={{ width: `${Math.max(5, lot.quality)}%` }}
                  />
                </div>

                <div className="lot-footer">
                  <small>
                    {isFresh
                      ? '✓ Hàng còn rất mới'
                      : isMedium
                      ? '⚡ Cần bán sớm'
                      : '⚠️ Sắp hỏng! Nên xả hàng'}
                  </small>
                  <button
                    className="btn-lot-sell"
                    onClick={() => onOpenTrade(lot.productId, 'sell')}
                  >
                    Bán Lô Này
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
