import { useEffect } from 'react';
import { Header } from '../components/common/Header';
import { ChatListItem } from '../components/chat/ChatListItem';
import { useAppStore } from '../stores/useAppStore';
import { useChatStore } from '../stores/useChatStore';
import { useContactStore } from '../stores/useContactStore';

// 聊天列表页：展示微信会话列表，点击后进入聊天详情
export function ChatPage() {
  const navigateToChatDetail = useAppStore((state) => state.navigateToChatDetail);
  const conversations = useChatStore((state) => state.conversations);
  const messages = useChatStore((state) => state.messages);
  const loaded = useChatStore((state) => state.loaded);
  const loadChats = useChatStore((state) => state.loadChats);
  const contacts = useContactStore((state) => state.contacts);

  useEffect(() => {
    if (!loaded) {
      loadChats();
    }
  }, [loaded, loadChats]);

  const sortedConversations = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="min-h-screen bg-wechat-bg pb-16" data-testid="chat-page">
      <Header title="微信" />
      <div className="divide-y divide-wechat-divider">
        {sortedConversations.map((conversation) => {
          const contact = contacts.find((c) => c.id === conversation.contactId);
          const lastMessage = messages[conversation.id]?.find((m) => m.id === conversation.lastMessageId);
          if (!contact) return null;

          return (
            <ChatListItem
              key={conversation.id}
              avatar={contact.avatar}
              name={contact.name}
              preview={lastMessage?.content || ''}
              time={conversation.updatedAt}
              unreadCount={conversation.unreadCount}
              isPinned={conversation.isPinned}
              onClick={() => navigateToChatDetail(conversation.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
