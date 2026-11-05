import React from 'react';
import { GameSaveState, ProductId } from '../../types';
import { PLAYER_RANKS } from '../../economy/catalog';
import { calculateBusinessAssetValue, calculateNetWorth } from '../../economy/finance';
import { calculateInventoryLiquidationValue } from '../../economy/inventory';

interface FinanceDashboardProps {
  state: GameSaveState;
}

export function FinanceDashboard({ state }: FinanceDashboardProps) {
  const currentPrices: Record<ProductId, number> = {
    tomato: state.locations.local_market.items.tomato.currentPrice,
    greens: state.locations.local_market.items.greens.currentPrice,
    onion: state.locations.local_market.items.onion.currentPrice,
    egg: state.locations.local_market.items.egg.currentPrice,
    fish: state.locations.local_market.items.fish.currentPrice,
    rice: state.locations.local_market.items.rice.currentPrice,
  };

  const inventoryValue = calculateInventoryLiquidationValue(state.inventory, currentPrices);
  const assetValue = calculateBusinessAssetValue(state.business);
  const netWorth = calculateNetWorth({
    cash: state.cash,
    inventoryLiquidationValue: inventoryValue,
    business: state.business,
  });

  const grossProfit = Math.round((state.financialStats.totalRevenue - state.financialStats.totalCOGS) * 100) / 100;

  return (
    <div className="finance-dashboard-view">
      {/* Top Net Worth Card */}
      <div className="networth-hero-card">
        <div className="hero-text">
          <span>Tổng Giá Trị Tài Sản Ròng (Net Worth)</span>
          <h2>{netWorth.toLocaleString('vi-VN')} <small>xu</small></h2>
        </div>
        <div className="networth-breakdown">
          <div className="breakdown-item">
            <span>Tiền mặt:</span>
            <strong>{state.cash.toLocaleString('vi-VN')} xu</strong>
          </div>
          <div className="breakdown-item">
            <span>Giá trị nông sản kho:</span>
            <strong>{inventoryValue.toFixed(1)} xu</strong>
          </div>
          <div className="breakdown-item">
            <span>Cơ sở & Sạp hàng:</span>
            <strong>{assetValue.toLocaleString('vi-VN')} xu</strong>
          </div>
        </div>
      </div>

      {/* P&L Financial Metrics */}
      <div className="financial-pnl-grid">
        <div className="pnl-card">
          <span>Tổng Doanh Thu</span>
          <strong className="text-income">+{state.financialStats.totalRevenue.toFixed(1)} xu</strong>
          <small>Từ buôn bán & hợp đồng</small>
        </div>
        <div className="pnl-card">
          <span>Giá Vốn Hàng Bán (COGS)</span>
          <strong className="text-expense">-{state.financialStats.totalCOGS.toFixed(1)} xu</strong>
          <small>Tính chính xác theo FIFO</small>
        </div>
        <div className="pnl-card">
          <span>Lợi Nhuận Gộp</span>
          <strong className={grossProfit >= 0 ? 'text-income' : 'text-danger'}>
            {grossProfit >= 0 ? '+' : ''}{grossProfit.toFixed(1)} xu
          </strong>
          <small>Doanh thu trừ giá vốn</small>
        </div>
        <div className="pnl-card">
          <span>Lợi Nhuận Ròng Lũy Kế</span>
          <strong className={state.financialStats.netProfit >= 0 ? 'text-income' : 'text-danger'}>
            {state.financialStats.netProfit >= 0 ? '+' : ''}{state.financialStats.netProfit.toFixed(1)} xu
          </strong>
          <small>Hiệu quả kinh doanh thực</small>
        </div>
      </div>

      {/* Merchant Rank Roadmap */}
      <div className="rank-roadmap-section">
        <h3>Lộ Trình Thăng Tiến Thương Gia</h3>
        <div className="ranks-scroll-track">
          {PLAYER_RANKS.map((r) => {
            const isCurrent = state.playerRankLevel === r.level;
            const isUnlocked = state.playerRankLevel >= r.level;

            return (
              <div className={`rank-step-card ${isCurrent ? 'current' : isUnlocked ? 'unlocked' : 'locked'}`} key={r.level}>
                <div className="rank-badge-header">
                  <span className="rank-lvl">Cấp {r.level}</span>
                  {isCurrent && <span className="current-indicator">Đang đạt</span>}
                </div>
                <strong>{r.title}</strong>
                <span className="networth-req">Yêu cầu: {r.minNetWorth.toLocaleString('vi-VN')} xu</span>
                <ul className="rank-perks">
                  {r.perks.map((p, idx) => (
                    <li key={idx}>✓ {p}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Ledger */}
      <div className="ledger-section">
        <h3>Sổ Cái Nhật Ký Giao Dịch (Ledger)</h3>
        <div className="ledger-table-wrap">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Thời Gian</th>
                <th>Phân Loại</th>
                <th>Nội Dung Chi Tiết</th>
                <th>Số Tiền</th>
                <th>Số Dư Ví</th>
              </tr>
            </thead>
            <tbody>
              {state.ledger.slice(0, 30).map((entry) => (
                <tr key={entry.id}>
                  <td>
                    {entry.timestamp} (N{entry.gameDay} · {entry.gameHour}h)
                  </td>
                  <td>
                    <span className={`ledger-type-badge ${entry.type.toLowerCase()}`}>
                      {entry.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{entry.description}</td>
                  <td className={entry.amount >= 0 ? 'text-income' : 'text-expense'}>
                    {entry.amount >= 0 ? `+${entry.amount.toFixed(1)}` : entry.amount.toFixed(1)} xu
                  </td>
                  <td><strong>{entry.balanceAfter.toFixed(1)} xu</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
