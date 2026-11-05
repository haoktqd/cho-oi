import React, { useState } from 'react';
import { GameSaveState, ProductId } from '../../types';
import { PRODUCTS } from '../../economy/catalog';
import { getPriceQuote } from '../../economy/pricing';
import { calculateTotalWeight, getTotalQuantityByProduct } from '../../economy/inventory';

interface TradingTerminalProps {
  state: GameSaveState;
  productId: ProductId;
  initialMode?: 'buy' | 'sell';
  onClose: () => void;
  onExecuteBuy: (productId: ProductId, qty: number, discount: number) => void;
  onExecuteSell: (productId: ProductId, qty: number, discount: number) => void;
  onOpenBargain: (productId: ProductId) => void;
  bargainDiscount?: number;
}

export function TradingTerminal({
  state,
  productId,
  initialMode = 'buy',
  onClose,
  onExecuteBuy,
  onExecuteSell,
  onOpenBargain,
  bargainDiscount = 0,
}: TradingTerminalProps) {
  const [mode, setMode] = useState<'buy' | 'sell'>(initialMode);
  const [quantity, setQuantity] = useState<number>(1);

  const loc = state.locations[state.currentLocation];
  const item = loc.items[productId];
  const pDef = PRODUCTS[productId];

  const ownedQty = getTotalQuantityByProduct(state.inventory, productId);
  const currentTotalWeight = calculateTotalWeight(state.inventory);
  const remainingWeight = Math.max(0, state.business.maxInventoryCapacity - currentTotalWeight);
  const maxBuyByWeight = Math.floor(remainingWeight / pDef.unitWeightKg);
  const maxBuyByCash = Math.floor(state.cash / (item.currentPrice * 1.05));
  const maxPossibleBuy = Math.min(item.availableSupply, maxBuyByWeight, Math.max(0, maxBuyByCash));

  const quote = getPriceQuote({
    productId,
    locationId: state.currentLocation,
    marketPrice: item.currentPrice,
    buySpread: item.buySpread,
    sellSpread: item.sellSpread,
    quantity,
    targetStock: item.targetStock,
    bargainDiscount,
  });

  const canExecuteBuy =
    quantity > 0 &&
    quantity <= item.availableSupply &&
    state.cash >= quote.totalCost &&
    quantity <= maxBuyByWeight;

  const canExecuteSell = quantity > 0 && quantity <= ownedQty;

  const lotsForProduct = state.inventory.filter((l) => l.productId === productId);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card trading-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="product-title-badge">
            <span className="prod-emoji-large">{pDef.emoji}</span>
            <div>
              <h3>Giao Dịch: {pDef.vietnameseName}</h3>
              <span className="subtitle">
                {loc.name} · Giá sàn gốc: {pDef.basePrice} xu
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="trade-mode-tabs">
          <button
            className={`mode-tab buy ${mode === 'buy' ? 'active' : ''}`}
            onClick={() => {
              setMode('buy');
              setQuantity(1);
            }}
          >
            Mua Hàng Vào Kho
          </button>
          <button
            className={`mode-tab sell ${mode === 'sell' ? 'active' : ''}`}
            onClick={() => {
              setMode('sell');
              setQuantity(Math.min(ownedQty, 1));
            }}
          >
            Bán Hàng Kiếm Lời ({ownedQty} đv có sẵn)
          </button>
        </div>

        {/* Price Quote Panel */}
        <div className="quote-panel">
          <div className="quote-row">
            <span>Giá thị trường hiện tại:</span>
            <strong>{item.currentPrice.toFixed(2)} xu / đv</strong>
          </div>
          <div className="quote-row">
            <span>{mode === 'buy' ? 'Giá mua thực tế (gồm spread):' : 'Giá thu mua sạp:'}</span>
            <strong className={mode === 'buy' ? 'text-expense' : 'text-income'}>
              {(mode === 'buy' ? quote.unitBuyPrice : quote.unitSellPrice).toFixed(2)} xu / đv
            </strong>
          </div>
          {bargainDiscount > 0 && (
            <div className="quote-row highlight-bargain">
              <span>🎉 Ưu đãi trả giá thành công:</span>
              <strong>-{(bargainDiscount * 100).toFixed(1)}% giá</strong>
            </div>
          )}
          {quote.priceImpact > 0.02 && (
            <div className="quote-row warning-row">
              <span>⚠️ Trượt giá do khối lượng lớn:</span>
              <span>+{(quote.priceImpact * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="quantity-control-section">
          <label>Số lượng muốn {mode === 'buy' ? 'mua' : 'bán'} (đơn vị):</label>
          <div className="quantity-input-group">
            <button
              className="qty-btn"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max={mode === 'buy' ? maxPossibleBuy || 1 : ownedQty || 1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <button
              className="qty-btn"
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </button>
          </div>

          {/* Quick Increment Buttons */}
          <div className="quick-qty-pills">
            <button onClick={() => setQuantity(5)}>+5</button>
            <button onClick={() => setQuantity(10)}>+10</button>
            <button onClick={() => setQuantity(25)}>+25</button>
            {mode === 'buy' ? (
              <button
                className="max-pill"
                onClick={() => setQuantity(Math.max(1, maxPossibleBuy))}
              >
                Mua Tối Đa ({maxPossibleBuy})
              </button>
            ) : (
              <button
                className="max-pill"
                onClick={() => setQuantity(Math.max(1, ownedQty))}
              >
                Bán Hết ({ownedQty})
              </button>
            )}
          </div>
        </div>

        {/* Summary Breakdown */}
        <div className="trade-summary">
          <div className="summary-line">
            <span>Tổng trọng lượng:</span>
            <strong>{(quantity * pDef.unitWeightKg).toFixed(1)} kg</strong>
          </div>
          <div className="summary-line total-line">
            <span>{mode === 'buy' ? 'Tổng số tiền phải trả:' : 'Tổng tiền dự kiến thu về:'}</span>
            <strong className={mode === 'buy' ? 'total-cost' : 'total-proceeds'}>
              {(mode === 'buy' ? quote.totalCost : quote.totalProceeds).toFixed(2)} xu
            </strong>
          </div>
        </div>

        {/* Optional Bargain Button */}
        {mode === 'buy' && (
          <div className="bargain-prompt">
            <button className="btn-bargain" onClick={() => onOpenBargain(productId)}>
              💬 Trả Giá Với Tiểu Thương (Thử vận may)
            </button>
          </div>
        )}

        {/* Inventory FIFO Lots View (If selling or inspecting) */}
        {lotsForProduct.length > 0 && (
          <div className="fifo-lots-preview">
            <span className="lots-title">Lô hàng đang lưu trong kho (Xuất theo FIFO):</span>
            <div className="lots-scroll">
              {lotsForProduct.map((lot) => (
                <div className="mini-lot-card" key={lot.id}>
                  <span>{lot.quantity} đv</span>
                  <small>Vốn: {lot.unitCost} xu</small>
                  <span className={`quality-badge ${lot.quality > 70 ? 'fresh' : 'aging'}`}>
                    Tươi: {lot.quality.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Đóng
          </button>
          {mode === 'buy' ? (
            <button
              className="btn-confirm-buy"
              disabled={!canExecuteBuy}
              onClick={() => {
                onExecuteBuy(productId, quantity, bargainDiscount);
                onClose();
              }}
            >
              Xác Nhận Mua {quantity} đv ({quote.totalCost.toFixed(2)} xu)
            </button>
          ) : (
            <button
              className="btn-confirm-sell"
              disabled={!canExecuteSell}
              onClick={() => {
                onExecuteSell(productId, quantity, bargainDiscount);
                onClose();
              }}
            >
              Xác Nhận Bán {quantity} đv (+{quote.totalProceeds.toFixed(2)} xu)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
