import React from 'react';
import { GameSaveState, ProductId } from '../../types';
import { PRODUCTS } from '../../economy/catalog';

interface MarketDashboardProps {
  state: GameSaveState;
  onOpenTrade: (productId: ProductId, mode: 'buy' | 'sell') => void;
}

export function MarketDashboard({ state, onOpenTrade }: MarketDashboardProps) {
  const currentLoc = state.locations[state.currentLocation];
  const productIds: ProductId[] = ['tomato', 'greens', 'onion', 'egg', 'fish', 'rice'];

  const renderSparkline = (history: number[], isPositive: boolean) => {
    if (!history || history.length < 2) return null;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = Math.max(1, max - min);
    const width = 80;
    const height = 24;

    const points = history
      .map((val, idx) => {
        const x = (idx / (history.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const strokeColor = isPositive ? '#38a169' : '#e53e3e';

    return (
      <svg width={width} height={height} className="sparkline-svg">
        <polyline fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" points={points} />
      </svg>
    );
  };

  return (
    <div className="market-dashboard-view">
      <div className="dashboard-header">
        <div>
          <h3>Bảng Giá & Thanh Khoản Thị Trường</h3>
          <p className="subtext">
            Địa điểm hiện tại: <strong>{currentLoc.name}</strong> · Giá cập nhật theo cung cầu thực tế
          </p>
        </div>
      </div>

      <div className="commodity-grid">
        {productIds.map((pid) => {
          const item = currentLoc.items[pid];
          const pDef = PRODUCTS[pid];
          const priceDiff = item.currentPrice - item.previousPrice;
          const pctChange = item.previousPrice > 0 ? (priceDiff / item.previousPrice) * 100 : 0;
          const isUp = priceDiff >= 0;

          // Check if player has any lots in inventory
          const ownedQty = state.inventory
            .filter((l) => l.productId === pid)
            .reduce((s, l) => s + l.quantity, 0);

          return (
            <div className="commodity-card" key={pid}>
              <div className="card-top">
                <div className="prod-identity">
                  <span className="prod-avatar">{pDef.emoji}</span>
                  <div>
                    <strong>{pDef.vietnameseName}</strong>
                    <span className="prod-category">Hạn: {pDef.shelfLifeHours}h · {pDef.unitWeightKg}kg/đv</span>
                  </div>
                </div>

                <div className="price-cluster">
                  <div className="current-price">
                    {item.currentPrice.toFixed(2)} <small>xu</small>
                  </div>
                  <div className={`price-badge ${isUp ? 'up' : 'down'}`}>
                    {isUp ? '▲ +' : '▼ '}
                    {pctChange.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Sparkline & Supply-Demand ratio */}
              <div className="card-middle">
                <div className="sparkline-wrapper">
                  <span className="sparkline-label">Biểu đồ 30 phiên:</span>
                  {renderSparkline(item.priceHistory, isUp)}
                </div>

                <div className="supply-demand-bars">
                  <div className="metric-row">
                    <span>Nguồn cung hàng:</span>
                    <strong>{item.availableSupply} đv</strong>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill supply-bar"
                      style={{ width: `${Math.min(100, (item.availableSupply / (pDef.baseSupply * 2)) * 100)}%` }}
                    />
                  </div>

                  <div className="metric-row">
                    <span>Sức mua thị trường:</span>
                    <strong>{item.currentDemand} đv</strong>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill demand-bar"
                      style={{ width: `${Math.min(100, (item.currentDemand / (pDef.baseDemand * 2)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Ownership status & Actions */}
              <div className="card-bottom">
                <div className="owned-status">
                  Kho của bạn: <strong>{ownedQty}</strong> đv
                </div>

                <div className="card-actions">
                  <button className="btn-buy" onClick={() => onOpenTrade(pid, 'buy')}>
                    Mua vào
                  </button>
                  <button
                    className="btn-sell"
                    disabled={ownedQty <= 0}
                    onClick={() => onOpenTrade(pid, 'sell')}
                  >
                    Bán ra
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
