import { useEffect, useRef } from 'react';
import { Header } from '../components/common/Header';
import { MessageBubble } from '../components/chat/MessageBubble';
import { MessageInput } from '../components/chat/MessageInput';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { useAppStore } from '../stores/useAppStore';
import { useChatStore } from '../stores/useChatStore';
import { useContactStore } from '../stores/useContactStore';
import type { Message } from '../types';

// 空消息数组常量，避免 Zustand selector 返回新引用导致无限重渲染
const EMPTY_MESSAGES: Message[] = [];

export function ChatDetailPage() {
  const conversationId = useAppStore((state) => {
    const top = state.pageStack[state.pageStack.length - 1];
    return top?.type === 'chat-detail' ? top.conversationId : null;
  });
  const navigateBack = useAppStore((state) => state.navigateBackToTabs);
  const messages = useChatStore((state) =>
    conversationId ? state.messages[conversationId] ?? EMPTY_MESSAGES : EMPTY_MESSAGES
  );
  const isTyping = useChatStore((state) =>
    conversationId ? state.typingConversations[conversationId] ?? false : false
  );
  const sendMessage = useChatStore((state) => state.sendMessage);
  const markConversationRead = useChatStore((state) => state.markConversationRead);
  const conversation = useChatStore((state) =>
    state.conversations.find((c) => c.id === conversationId)
  );
  const contact = useContactStore((state) =>
    state.contacts.find((c) => c.id === conversation?.contactId)
  );
  const contacts = useContactStore((state) => state.contacts);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      markConversationRead(conversationId);
    }
  }, [conversationId, markConversationRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 未选择会话时不渲染（App.tsx 始终挂载该组件用于转场动画）
  if (!conversationId || !conversation) return null;
  const isGroup = conversation.type === 'group';
  if (!isGroup && !contact) return null;

  const title = isGroup ? conversation.name ?? '群聊' : contact!.name;

  // 群聊按发言者解析昵称头像，单聊统一用联系人信息
  const senderOf = (senderId: string) => {
    if (!isGroup) return { name: contact!.name, avatar: contact!.avatar };
    const sender = contacts.find((c) => c.id === senderId);
    return { name: sender?.name ?? '', avatar: sender?.avatar ?? '' };
  };

  return (
    <div className="h-full bg-wechat-bg flex flex-col" data-testid="chat-detail-page">
      <Header title={title} onBack={navigateBack} />
      <div className="flex-1 min-h-0 overflow-y-auto pb-24" data-testid="chat-message-list">
        {messages.map((message) => {
          const sender = senderOf(message.senderId);
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isMe={message.senderId === 'me'}
              contactName={sender.name}
              contactAvatar={sender.avatar}
            />
          );
        })}
        {isTyping && (
          <TypingIndicator
            avatar={isGroup ? conversation.avatar ?? '' : contact!.avatar}
            name={title}
          />
        )}
        <div ref={bottomRef} />
      </div>
      <MessageInput
        onSend={(text) => sendMessage(conversationId, text)}
        members={
          isGroup
            ? contacts
                .filter((c) => conversation.memberIds?.includes(c.id))
                .map((c) => ({ id: c.id, name: c.name }))
            : undefined
        }
      />
    </div>
  );
}
