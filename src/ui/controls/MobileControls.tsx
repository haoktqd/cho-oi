import React from 'react';

interface MobileControlsProps {
  onDirectionChange: (dir: { x: number; z: number }) => void;
  onOpenQuickMarket: () => void;
  onOpenQuickInventory: () => void;
}

export function MobileControls({
  onDirectionChange,
  onOpenQuickMarket,
  onOpenQuickInventory,
}: MobileControlsProps) {
  const setDir = (x: number, z: number) => {
    onDirectionChange({ x, z });
  };

  const clearDir = () => {
    onDirectionChange({ x: 0, z: 0 });
  };

  return (
    <div className="mobile-controls-overlay">
      {/* Directional Pad */}
      <div className="dpad-container" aria-label="Điều khiển di chuyển">
        <button
          className="dpad-btn up"
          onPointerDown={() => setDir(0, -1)}
          onPointerUp={clearDir}
          onPointerLeave={clearDir}
        >
          ▲
        </button>
        <div className="dpad-middle-row">
          <button
            className="dpad-btn left"
            onPointerDown={() => setDir(-1, 0)}
            onPointerUp={clearDir}
            onPointerLeave={clearDir}
          >
            ◀
          </button>
          <div className="dpad-center-hub" />
          <button
            className="dpad-btn right"
            onPointerDown={() => setDir(1, 0)}
            onPointerUp={clearDir}
            onPointerLeave={clearDir}
          >
            ▶
          </button>
        </div>
        <button
          className="dpad-btn down"
          onPointerDown={() => setDir(0, 1)}
          onPointerUp={clearDir}
          onPointerLeave={clearDir}
        >
          ▼
        </button>
      </div>

      {/* Quick Action Buttons on right */}
      <div className="mobile-actions-cluster">
        <button className="mobile-fab-btn" onClick={onOpenQuickMarket} title="Xem giá thị trường">
          📈 Bảng Giá
        </button>
        <button className="mobile-fab-btn" onClick={onOpenQuickInventory} title="Chiếc làn hàng">
          🧺 Chiếc Làn
        </button>
      </div>
    </div>
  );
}
