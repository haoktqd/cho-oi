import React, { useState } from 'react';
import { NPCProfile, ProductId } from '../../types';
import { PRODUCTS } from '../../economy/catalog';

interface DialogueModalProps {
  npc: NPCProfile;
  playerReputation: number;
  onClose: () => void;
  onBargain: (npcId: string, quantity: number) => { success: boolean; discountPercentage: number; message: string };
  onOpenTradeProduct?: (productId: ProductId) => void;
}

export function DialogueModal({
  npc,
  playerReputation,
  onClose,
  onBargain,
  onOpenTradeProduct,
}: DialogueModalProps) {
  const [currentLine, setCurrentLine] = useState<string>(
    npc.dialoguePool[Math.floor(Math.random() * npc.dialoguePool.length)]
  );
  const [bargainResult, setBargainResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleBargain = () => {
    const res = onBargain(npc.id, 10);
    setBargainResult(res);
    setCurrentLine(res.message);
  };

  const nextTip = () => {
    const lines = npc.dialoguePool;
    const random = lines[Math.floor(Math.random() * lines.length)];
    setCurrentLine(random);
    setBargainResult(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card dialog-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-top-header">
          <div className="npc-identity-block">
            <span className="npc-avatar-circle">{npc.avatar}</span>
            <div>
              <h3>{npc.name}</h3>
              <span className="npc-role-tag">{npc.title}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Relationship Meter */}
        <div className="relationship-meter-wrap">
          <div className="meter-label">
            <span>Độ thân thiết:</span>
            <strong>❤️ {npc.relationshipScore} / 100</strong>
          </div>
          <div className="meter-track">
            <div className="meter-fill" style={{ width: `${npc.relationshipScore}%` }} />
          </div>
        </div>

        {/* Dialogue Bubble */}
        <div className="dialog-speech-bubble">
          <p>“{currentLine}”</p>
        </div>

        {/* Specialty Product */}
        {npc.specialtyProduct && (
          <div className="specialty-block">
            <span>Mặt hàng sở trường:</span>
            <button
              className="btn-view-specialty"
              onClick={() => {
                onOpenTradeProduct?.(npc.specialtyProduct!);
                onClose();
              }}
            >
              {PRODUCTS[npc.specialtyProduct].emoji} {PRODUCTS[npc.specialtyProduct].vietnameseName} (Xem giá ngay)
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="dialog-actions-row">
          <button className="btn-dialog-action" onClick={nextTip}>
            🍵 Trò chuyện thêm
          </button>
          <button className="btn-dialog-action highlight" onClick={handleBargain}>
            🤝 Mặc cả chiết khấu
          </button>
        </div>
      </div>
    </div>
  );
}
