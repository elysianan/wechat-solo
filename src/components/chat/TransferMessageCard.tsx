import { Banknote } from 'lucide-react';
import type { TransferMessage } from '../../types';

interface TransferMessageCardProps {
  message: TransferMessage;
  isMe: boolean;
}

function statusText(status: TransferMessage['transferStatus'], isMe: boolean): string {
  switch (status) {
    case 'pending':
      return isMe ? '待对方收款' : '待收款';
    case 'received':
      return isMe ? '已被领取' : '已收款';
    case 'refunded':
      return '已退还';
    default:
      return '';
  }
}

export function TransferMessageCard({ message, isMe }: TransferMessageCardProps) {
  return (
    <div
      className="flex items-center gap-3 w-[200px] p-3 rounded-lg"
      data-testid="transfer-message-card"
    >
      <div className="flex-shrink-0">
        <Banknote size={32} className="text-current" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-lg font-medium text-current truncate">¥{message.amount.toFixed(2)}</div>
        <div className="text-xs text-current/80 truncate">{statusText(message.transferStatus, isMe)}</div>
      </div>
    </div>
  );
}
