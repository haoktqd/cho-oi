import React, { useEffect } from 'react';

export type MainTabType = 'world' | 'market' | 'inventory' | 'finance' | 'business' | 'kitchen' | 'news';

interface BottomNavProps {
  currentTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
  inventoryCount: number;
  unreadNewsCount: number;
  contractCount: number;
}

export function BottomNav({
  currentTab,
  onChangeTab,
  inventoryCount,
  unreadNewsCount,
  contractCount,
}: BottomNavProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;
      if (e.key === '1') onChangeTab('world');
      if (e.key === '2') onChangeTab('market');
      if (e.key === '3') onChangeTab('inventory');
      if (e.key === '4') onChangeTab('finance');
      if (e.key === '5') onChangeTab('business');
      if (e.key === '6') onChangeTab('kitchen');
      if (e.key === '7') onChangeTab('news');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onChangeTab]);

  return (
    <nav className="bottom-nav-container">
      <div className="nav-buttons-cluster">
        <button
          className={`nav-tab-btn ${currentTab === 'world' ? 'active' : ''}`}
          onClick={() => onChangeTab('world')}
        >
          <span className="tab-icon">🏞️</span>
          <span className="tab-title">Chợ 3D</span>
          <kbd>1</kbd>
        </button>

        <button
          className={`nav-tab-btn ${currentTab === 'market' ? 'active' : ''}`}
          onClick={() => onChangeTab('market')}
        >
          <span className="tab-icon">📈</span>
          <span className="tab-title">Bảng Giá</span>
          <kbd>2</kbd>
        </button>

        <button
          className={`nav-tab-btn ${currentTab === 'inventory' ? 'active' : ''}`}
          onClick={() => onChangeTab('inventory')}
        >
          <span className="tab-icon">🧺</span>
          <span className="tab-title">Kho Hàng</span>
          {inventoryCount > 0 && <span className="tab-counter-badge">{inventoryCount}</span>}
          <kbd>3</kbd>
        </button>

        <button
          className={`nav-tab-btn ${currentTab === 'finance' ? 'active' : ''}`}
          onClick={() => onChangeTab('finance')}
        >
          <span className="tab-icon">💰</span>
          <span className="tab-title">Tài Chính</span>
          <kbd>4</kbd>
        </button>

        <button
          className={`nav-tab-btn ${currentTab === 'business' ? 'active' : ''}`}
          onClick={() => onChangeTab('business')}
        >
          <span className="tab-icon">🏢</span>
          <span className="tab-title">Doanh Nghiệp</span>
          {contractCount > 0 && <span className="tab-counter-badge highlight">{contractCount}</span>}
          <kbd>5</kbd>
        </button>

        <button
          className={`nav-tab-btn ${currentTab === 'kitchen' ? 'active' : ''}`}
          onClick={() => onChangeTab('kitchen')}
        >
          <span className="tab-icon">🍲</span>
          <span className="tab-title">Bếp Ẩm Thực</span>
          <kbd>6</kbd>
        </button>

        <button
          className={`nav-tab-btn ${currentTab === 'news' ? 'active' : ''}`}
          onClick={() => onChangeTab('news')}
        >
          <span className="tab-icon">📰</span>
          <span className="tab-title">Bản Tin</span>
          {unreadNewsCount > 0 && <span className="tab-counter-badge danger">{unreadNewsCount}</span>}
          <kbd>7</kbd>
        </button>
      </div>
    </nav>
  );
}
