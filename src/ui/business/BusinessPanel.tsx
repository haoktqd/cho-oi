import React from 'react';
import { GameSaveState } from '../../types';
import { PRODUCTS } from '../../economy/catalog';
import { getTotalQuantityByProduct } from '../../economy/inventory';

interface BusinessPanelProps {
  state: GameSaveState;
  onCompleteContract: (contractId: string) => void;
  onHireStaff: (role: 'assistants' | 'drivers' | 'accountants', cost: number) => void;
  onUpgradeCapacity: (amount: number, cost: number) => void;
}

export function BusinessPanel({
  state,
  onCompleteContract,
  onHireStaff,
  onUpgradeCapacity,
}: BusinessPanelProps) {
  const activeContracts = state.contracts.filter((c) => !c.expired);

  return (
    <div className="business-view">
      {/* Header */}
      <div className="business-header">
        <div>
          <h3>Quản Lý & Phát Triển Doanh Nghiệp</h3>
          <p className="subtext">
            Tuyển dụng nhân sự, nâng cấp hậu cần và ký hợp đồng cung ứng nông sản quy mô lớn
          </p>
        </div>
        <div className="reputation-badge">
          <span>Uy tín thương trường:</span>
          <strong>⭐ {state.reputation} điểm</strong>
        </div>
      </div>

      {/* Commercial Contracts Section */}
      <div className="contracts-section">
        <div className="section-title-row">
          <h4>📋 Hợp Đồng Cung Ứng Thương Mại ({activeContracts.length} đơn đặt hàng)</h4>
          <small>Giao đủ số lượng trước thời hạn để nhận thưởng lớn và gia tăng uy tín</small>
        </div>

        <div className="contracts-grid">
          {activeContracts.length === 0 ? (
            <div className="empty-contracts">
              <span>📭</span>
              <p>Hiện chưa có đơn đặt hàng mới. Hãy kiểm tra lại sau ít phút khi thị trường cập nhật!</p>
            </div>
          ) : (
            activeContracts.map((c) => {
              const pDef = PRODUCTS[c.productId];
              const owned = getTotalQuantityByProduct(state.inventory, c.productId);
              const isReady = owned >= c.requiredQuantity && !c.completed;

              return (
                <div className={`contract-card ${c.completed ? 'completed' : ''}`} key={c.id}>
                  <div className="contract-top">
                    <div>
                      <strong>{c.clientName}</strong>
                      <span className="client-role">{c.clientRole}</span>
                    </div>
                    <span className="contract-status-badge">
                      {c.completed ? '✓ Đã hoàn tất' : `Hạn: Ngày ${c.deadlineDay} (${c.deadlineHour}h)`}
                    </span>
                  </div>

                  <div className="contract-product-info">
                    <span className="contract-emoji">{pDef.emoji}</span>
                    <div>
                      <span>Yêu cầu giao:</span>
                      <strong>
                        {c.requiredQuantity} đv {pDef.vietnameseName}
                      </strong>
                    </div>
                  </div>

                  <div className="contract-rewards">
                    <div className="reward-item">
                      <span>Tiền thưởng nhận:</span>
                      <strong className="text-income">+{c.rewardCoins} xu</strong>
                    </div>
                    <div className="reward-item">
                      <span>Điểm uy tín:</span>
                      <strong className="text-warning">+{c.bonusReputation} ⭐</strong>
                    </div>
                  </div>

                  <div className="contract-progress-line">
                    <span>Kho của bạn hiện có: </span>
                    <strong className={owned >= c.requiredQuantity ? 'text-income' : 'text-danger'}>
                      {owned} / {c.requiredQuantity} đv
                    </strong>
                  </div>

                  {!c.completed && (
                    <button
                      className="btn-deliver-contract"
                      disabled={!isReady}
                      onClick={() => onCompleteContract(c.id)}
                    >
                      {isReady ? `Giao Hàng Ngay (+${c.rewardCoins} xu)` : `Chưa đủ hàng (${owned}/${c.requiredQuantity})`}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Staff Hiring Section */}
      <div className="staff-section">
        <div className="section-title-row">
          <h4>👥 Đội Ngũ Nhân Sự & Bộ Máy Vận Hành</h4>
          <small>Nhân viên giúp tự động hóa khâu bán lẻ và tối ưu chi phí vận chuyển</small>
        </div>

        <div className="staff-grid">
          {/* Assistant */}
          <div className="staff-card">
            <div className="staff-header">
              <span className="staff-avatar">👩🏻‍💼</span>
              <div>
                <strong>Phụ Tá Bán Hàng</strong>
                <small>Đã tuyển: {state.business.employees.assistants} người</small>
              </div>
            </div>
            <p className="staff-desc">
              Tự động bán nông sản lưu trong kho tại sạp Chợ Dân Sinh theo giá bán lẻ thị trường.
            </p>
            <div className="staff-wage">Lương: 1.5 xu / giờ</div>
            <button
              className="btn-hire"
              onClick={() => onHireStaff('assistants', 350)}
            >
              Tuyển Phụ Tá (350 xu)
            </button>
          </div>

          {/* Driver */}
          <div className="staff-card">
            <div className="staff-header">
              <span className="staff-avatar">🛵</span>
              <div>
                <strong>Tài Xế Giao Hàng</strong>
                <small>Đã tuyển: {state.business.employees.drivers} người</small>
              </div>
            </div>
            <p className="staff-desc">
              Giảm 60% chi phí đi lại giữa Chợ Đầu Mối và Chợ Dân Sinh, bảo quản hàng chống dập nát.
            </p>
            <div className="staff-wage">Lương: 2.0 xu / giờ</div>
            <button
              className="btn-hire"
              onClick={() => onHireStaff('drivers', 500)}
            >
              Tuyển Tài Xế (500 xu)
            </button>
          </div>

          {/* Accountant */}
          <div className="staff-card">
            <div className="staff-header">
              <span className="staff-avatar">👨🏻‍💻</span>
              <div>
                <strong>Kế Toán Trưởng</strong>
                <small>Đã tuyển: {state.business.employees.accountants} người</small>
              </div>
            </div>
            <p className="staff-desc">
              Tối ưu thuế phí giao dịch và đưa ra dự báo biến động giá thị trường trong các bản tin sớm.
            </p>
            <div className="staff-wage">Lương: 3.0 xu / giờ</div>
            <button
              className="btn-hire"
              onClick={() => onHireStaff('accountants', 850)}
            >
              Tuyển Kế Toán (850 xu)
            </button>
          </div>
        </div>
      </div>

      {/* Logistics & Fleet Upgrades */}
      <div className="fleet-section">
        <div className="section-title-row">
          <h4>🚛 Nâng Cấp Phương Tiện Hậu Cần</h4>
          <small>Tăng sức chứa tối đa để gom được nhiều hàng sỉ giá hời hơn</small>
        </div>

        <div className="fleet-grid">
          <div className="fleet-card">
            <div className="fleet-title">
              <span>🚲</span>
              <strong>Xe Đạp Thồ Nông Sản</strong>
            </div>
            <p>Tăng thêm +50 kg tải trọng kho hàng cá nhân.</p>
            <button
              className="btn-upgrade-fleet"
              onClick={() => onUpgradeCapacity(50, 450)}
            >
              Nâng cấp (+50 kg · 450 xu)
            </button>
          </div>

          <div className="fleet-card">
            <div className="fleet-title">
              <span>🛺</span>
              <strong>Xe Ba Gác Máy</strong>
            </div>
            <p>Tăng thêm +150 kg tải trọng cho các chuyến gom hàng sỉ lớn.</p>
            <button
              className="btn-upgrade-fleet"
              onClick={() => onUpgradeCapacity(150, 1400)}
            >
              Nâng cấp (+150 kg · 1.400 xu)
            </button>
          </div>

          <div className="fleet-card">
            <div className="fleet-title">
              <span>🚚</span>
              <strong>Xe Tải Nhẹ 1 Tấn</strong>
            </div>
            <p>Tăng thêm +400 kg sức chứa quy mô nhà phân phối.</p>
            <button
              className="btn-upgrade-fleet"
              onClick={() => onUpgradeCapacity(400, 3800)}
            >
              Nâng cấp (+400 kg · 3.800 xu)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
