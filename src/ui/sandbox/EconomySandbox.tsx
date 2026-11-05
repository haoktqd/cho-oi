import React, { useState } from 'react';
import { GameSaveState, ProductId } from '../../types';
import { runHeadlessSimulation } from '../../economy/simulation';
import { PRODUCTS } from '../../economy/catalog';

interface EconomySandboxProps {
  state: GameSaveState;
  onClose: () => void;
  onApplySimulatedState?: (simulatedState: GameSaveState) => void;
}

export function EconomySandbox({ state, onClose, onApplySimulatedState }: EconomySandboxProps) {
  const [days, setDays] = useState<number>(7);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<{
    finalState: GameSaveState;
    dailyMetrics: { day: number; avgPrices: Record<ProductId, number>; netWorth: number }[];
    invariantsPassed: boolean;
    issues: string[];
  } | null>(null);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      const simResult = runHeadlessSimulation(state, days);
      setResult(simResult);
      setIsRunning(false);
    }, 60);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card sandbox-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>🧪 Phòng Thử Nghiệm Kinh Tế (Headless Sandbox)</h3>
            <span className="subtitle">
              Mô phỏng toán học tốc độ cao, kiểm tra bất biến chống gian lận & cân bằng thị trường
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Controls */}
        <div className="sandbox-controls">
          <div className="control-group">
            <label>Khoảng thời gian mô phỏng:</label>
            <div className="days-selector">
              <button className={days === 1 ? 'active' : ''} onClick={() => setDays(1)}>
                1 Ngày (24h)
              </button>
              <button className={days === 7 ? 'active' : ''} onClick={() => setDays(7)}>
                7 Ngày (1 Tuần)
              </button>
              <button className={days === 30 ? 'active' : ''} onClick={() => setDays(30)}>
                30 Ngày (1 Tháng)
              </button>
            </div>
          </div>

          <button className="btn-run-sim" disabled={isRunning} onClick={handleRun}>
            {isRunning ? 'Đang tính toán mô phỏng...' : `🚀 Chạy Mô Phỏng ${days} Ngày`}
          </button>
        </div>

        {/* Result view */}
        {result && (
          <div className="sim-result-section">
            <div className={`invariant-status-card ${result.invariantsPassed ? 'passed' : 'failed'}`}>
              <div className="status-title">
                <span>{result.invariantsPassed ? '✓' : '⚠️'}</span>
                <strong>
                  {result.invariantsPassed
                    ? 'Tất Cả Quy Tắc Bất Biến Đều Hợp Lệ (Invariants Passed)'
                    : `Phát hiện ${result.issues.length} cảnh báo bất biến`}
                </strong>
              </div>
              <p>
                {result.invariantsPassed
                  ? 'Không có giá âm, không tồn kho âm, không tích lũy tiền ảo. Thuật toán cân bằng hoàn hảo!'
                  : result.issues.join('; ')}
              </p>
            </div>

            {/* Metrics preview */}
            <div className="sim-metrics-summary">
              <div className="metric-box">
                <span>Số ngày mô phỏng:</span>
                <strong>{days} ngày ({days * 24} ticks)</strong>
              </div>
              <div className="metric-box">
                <span>Tài sản ròng cuối kỳ:</span>
                <strong>{result.finalState.cash.toFixed(1)} xu</strong>
              </div>
              <div className="metric-box">
                <span>Số sự kiện đã phát sinh:</span>
                <strong>{result.finalState.activeEvents.length} sự kiện</strong>
              </div>
            </div>

            {/* Daily Price Trajectory Table */}
            <div className="sim-table-wrap">
              <h4>Bảng Theo Dõi Giá Nông Sản Trung Bình Hàng Ngày:</h4>
              <table className="sim-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Cà Chua 🍅</th>
                    <th>Rau Cải 🥬</th>
                    <th>Hành Tím 🧅</th>
                    <th>Trứng Gà 🥚</th>
                    <th>Cá Rô 🐟</th>
                    <th>Gạo ST25 🌾</th>
                  </tr>
                </thead>
                <tbody>
                  {result.dailyMetrics.slice(0, 10).map((m) => (
                    <tr key={m.day}>
                      <td>Ngày {m.day}</td>
                      <td>{m.avgPrices.tomato?.toFixed(2)}</td>
                      <td>{m.avgPrices.greens?.toFixed(2)}</td>
                      <td>{m.avgPrices.onion?.toFixed(2)}</td>
                      <td>{m.avgPrices.egg?.toFixed(2)}</td>
                      <td>{m.avgPrices.fish?.toFixed(2)}</td>
                      <td>{m.avgPrices.rice?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {onApplySimulatedState && (
              <div className="apply-sim-row">
                <button
                  className="btn-apply-state"
                  onClick={() => {
                    onApplySimulatedState(result.finalState);
                    onClose();
                  }}
                >
                  Áp Dụng Kết Quả Mô Phỏng Vào Trò Chơi Hiện Tại
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
