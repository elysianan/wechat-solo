import { useEffect, useRef } from 'react';
import { Header } from '../components/common/Header';
import { MessageBubble } from '../components/chat/MessageBubble';
import { MessageInput } from '../components/chat/MessageInput';
import { useAppStore } from '../stores/useAppStore';
import { useChatStore } from '../stores/useChatStore';
import { useContactStore } from '../stores/useContactStore';
import type { Message } from '../types';

// 空消息数组常量，避免 Zustand selector 返回新引用导致无限重渲染
const EMPTY_MESSAGES: Message[] = [];

export function ChatDetailPage() {
  const conversationId = useAppStore((state) => state.currentConversationId);
  const navigateBack = useAppStore((state) => state.navigateBackToTabs);
  const messages = useChatStore((state) =>
    conversationId ? state.messages[conversationId] ?? EMPTY_MESSAGES : EMPTY_MESSAGES
  );
  const sendMessage = useChatStore((state) => state.sendMessage);
  const markConversationRead = useChatStore((state) => state.markConversationRead);
  const conversation = useChatStore((state) =>
    state.conversations.find((c) => c.id === conversationId)
  );
  const contact = useContactStore((state) =>
    state.contacts.find((c) => c.id === conversation?.contactId)
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      markConversationRead(conversationId);
    }
  }, [conversationId, markConversationRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 未选择会话时不渲染（App.tsx 始终挂载该组件用于转场动画）
  if (!conversationId || !contact) {
    return null;
  }

  return (
    <div className="min-h-screen bg-wechat-bg flex flex-col" data-testid="chat-detail-page">
      <Header title={contact.name} onBack={navigateBack} />
      <div className="flex-1 overflow-y-auto pb-24">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isMe={message.senderId === 'me'}
            contactName={contact.name}
            contactAvatar={contact.avatar}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <MessageInput onSend={(text) => sendMessage(conversationId, text)} />
    </div>
  );
}
