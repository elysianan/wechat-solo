import { useState } from 'react';
import { X } from 'lucide-react';
import type { TransferPayload } from '../../types';

interface TransferPanelProps {
  visible: boolean;
  onConfirm: (payload: TransferPayload) => void;
  onClose: () => void;
}

export function TransferPanel({ visible, onConfirm, onClose }: TransferPanelProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  if (!visible) return null;

  const handleConfirm = () => {
    const value = parseFloat(amount);
    if (Number.isNaN(value) || value <= 0) return;
    onConfirm({ type: 'transfer', amount: value, note: note.trim() || undefined });
    setAmount('');
    setNote('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
      data-testid="transfer-panel"
    >
      <div className="bg-wechat-bg rounded-t-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-medium">转账</span>
          <button onClick={onClose} data-testid="transfer-panel-close">
            <X size={20} />
          </button>
        </div>
        <input
          type="number"
          inputMode="decimal"
          placeholder="金额"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-wechat-card rounded px-3 py-2 text-sm mb-2 outline-none"
          data-testid="transfer-amount-input"
        />
        <input
          type="text"
          placeholder="备注（可选）"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-wechat-card rounded px-3 py-2 text-sm mb-4 outline-none"
          data-testid="transfer-note-input"
        />
        <button
          onClick={handleConfirm}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full bg-wechat-green text-white text-sm py-2 rounded disabled:opacity-50 active:scale-[0.98] transition-transform"
          data-testid="transfer-confirm-button"
        >
          转账
        </button>
      </div>
    </div>
  );
}
