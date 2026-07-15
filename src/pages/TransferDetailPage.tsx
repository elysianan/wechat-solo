import { useMemo } from 'react';
import { Header } from '../components/common/Header';
import { useAppStore } from '../stores/useAppStore';
import { useChatStore } from '../stores/useChatStore';
import { useContactStore } from '../stores/useContactStore';
import { assetUrl } from '../utils/asset';
import { formatChatTime } from '../utils/time';

// 转账详情页：展示金额、备注，支持收款/退还
export function TransferDetailPage() {
  const pageStack = useAppStore((state) => state.pageStack);
  const popPage = useAppStore((state) => state.popPage);
  const topRoute = pageStack[pageStack.length - 1];
  const messageId = topRoute?.type === 'transfer-detail' ? topRoute.messageId : null;

  const messages = useChatStore((state) => state.messages);
  const updateTransferStatus = useChatStore((state) => state.updateTransferStatus);
  const conversations = useChatStore((state) => state.conversations);
  const contacts = useContactStore((state) => state.contacts);

  const message = useMemo(
    () => Object.values(messages).flat().find((m) => m.id === messageId),
    [messages, messageId]
  );
  if (!message || message.type !== 'transfer') {
    return (
      <div className="h-full bg-wechat-bg flex flex-col" data-testid="transfer-detail-page">
        <Header title="转账详情" onBack={popPage} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-wechat-text-secondary">转账信息不存在</div>
        </div>
      </div>
    );
  }

  const conversation = conversations.find((c) => c.id === message.conversationId);
  const contact = contacts.find((c) => c.id === (conversation?.contactId ?? message.senderId));
  const isMeReceived = message.senderId !== 'me';

  const handleReceive = async () => {
    await updateTransferStatus(message.id, 'received');
    popPage();
  };
  const handleRefund = async () => {
    await updateTransferStatus(message.id, 'refunded');
    popPage();
  };

  return (
    <div className="h-full bg-wechat-bg flex flex-col" data-testid="transfer-detail-page">
      <Header title="转账详情" onBack={popPage} />
      <div className="flex-1 flex flex-col items-center pt-16 px-6">
        <img
          src={assetUrl(contact?.avatar || '')}
          alt={contact?.name || ''}
          className="w-16 h-16 rounded bg-wechat-bg object-cover"
        />
        <div className="mt-3 text-base text-wechat-text-secondary">
          {contact?.name} {isMeReceived ? '向你转账' : '的转账'}
        </div>
        <div className="mt-6 text-4xl font-medium text-wechat-text-primary">
          ¥{message.amount.toFixed(2)}
        </div>
        {message.note && (
          <div className="mt-2 text-sm text-wechat-text-secondary">备注：{message.note}</div>
        )}

        {message.transferStatus === 'pending' && isMeReceived && (
          <div className="w-full mt-10 space-y-3">
            <button
              onClick={handleReceive}
              className="w-full bg-wechat-green text-white text-base py-3 rounded active:scale-[0.98] transition-transform"
              data-testid="transfer-receive-button"
            >
              收款
            </button>
            <button
              onClick={handleRefund}
              className="w-full text-wechat-text-secondary text-sm py-2"
              data-testid="transfer-refund-button"
            >
              退还
            </button>
          </div>
        )}

        {message.transferStatus === 'received' && (
          <div className="mt-10 text-sm text-wechat-text-secondary">
            已收款 {message.transferCompletedAt ? formatChatTime(message.transferCompletedAt) : ''}
          </div>
        )}

        {message.transferStatus === 'refunded' && (
          <div className="mt-10 text-sm text-wechat-text-secondary">
            已退还 {message.transferCompletedAt ? formatChatTime(message.transferCompletedAt) : ''}
          </div>
        )}

        {!isMeReceived && message.transferStatus === 'pending' && (
          <div className="mt-10 text-sm text-wechat-text-secondary">待对方收款</div>
        )}
      </div>
    </div>
  );
}
