import { useEffect, useRef } from 'react';
import { Header } from '../components/common/Header';
import { MessageBubble } from '../components/chat/MessageBubble';
import { MessageInput } from '../components/chat/MessageInput';
import { useAppStore } from '../stores/useAppStore';
import { useChatStore } from '../stores/useChatStore';
import { useContactStore } from '../stores/useContactStore';

export function ChatDetailPage() {
  const conversationId = useAppStore((state) => state.currentConversationId)!;
  const navigateBack = useAppStore((state) => state.navigateBackToTabs);
  const messages = useChatStore((state) => state.messages[conversationId] || []);
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

  if (!contact) {
    return (
      <div className="min-h-screen bg-wechat-bg flex items-center justify-center">
        <span className="text-wechat-text-secondary">会话不存在</span>
      </div>
    );
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
