import React from 'react';
import { GameSaveState } from '../../types';
import { PRODUCTS } from '../../economy/catalog';

interface NewsPanelProps {
  state: GameSaveState;
}

export function NewsPanel({ state }: NewsPanelProps) {
  const activeEvents = state.activeEvents;

  return (
    <div className="news-view">
      <div className="news-header">
        <div>
          <h3>Bản Tin Thương Trường & Dự Báo Thị Trường</h3>
          <p className="subtext">
            Nắm bắt tin tức thời tiết, biến động vận tải và tin đồn đầu cơ để đi tắt đón đầu thị trường!
          </p>
        </div>
      </div>

      {activeEvents.length === 0 ? (
        <div className="empty-news-card">
          <span>📰</span>
          <h4>Thị trường đang êm ả</h4>
          <p>Thời tiết thuận lợi, nguồn cung và sức mua tại hai chợ đang giữ nhịp ổn định. Hãy sẵn sàng cho những đợt sóng giá tiếp theo!</p>
        </div>
      ) : (
        <div className="news-events-grid">
          {activeEvents.map((ev) => {
            const isHigh = ev.severity === 'high' || ev.severity === 'critical';
            return (
              <div className={`news-card ${ev.severity}`} key={ev.id}>
                <div className="news-card-top">
                  <div className="news-headline">
                    <span className="news-icon">{ev.isRumor ? '👂' : '⚡'}</span>
                    <div>
                      <strong>{ev.title}</strong>
                      <span className="news-meta">
                        {ev.isRumor ? 'Tin Đồn Vỉa Hè' : 'Sự Kiện Thời Tiết / Thương Mại'} · Thời lượng: {ev.durationHours}h
                      </span>
                    </div>
                  </div>
                  <span className={`severity-tag ${ev.severity}`}>
                    {ev.severity.toUpperCase()}
                  </span>
                </div>

                <p className="news-body">{ev.description}</p>

                {/* Affected Commodities */}
                <div className="affected-products-row">
                  <span>Mặt hàng chịu tác động:</span>
                  <div className="affected-pills">
                    {ev.affectedProducts.map((pid) => (
                      <span className="affected-pill" key={pid}>
                        {PRODUCTS[pid].emoji} {PRODUCTS[pid].vietnameseName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Impact details */}
                <div className="impact-details-grid">
                  <div className="impact-item">
                    <span>Nguồn cung:</span>
                    <strong className={ev.supplyMultiplier >= 1 ? 'text-income' : 'text-danger'}>
                      {(ev.supplyMultiplier * 100).toFixed(0)}%
                    </strong>
                  </div>
                  <div className="impact-item">
                    <span>Nhu cầu tiêu thụ:</span>
                    <strong className={ev.demandMultiplier >= 1 ? 'text-warning' : 'text-info'}>
                      {(ev.demandMultiplier * 100).toFixed(0)}%
                    </strong>
                  </div>
                  <div className="impact-item">
                    <span>Độ tin cậy:</span>
                    <strong>{(ev.reliability * 100).toFixed(0)}%</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
