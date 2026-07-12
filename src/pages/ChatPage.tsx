import { useEffect, useMemo } from 'react';
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

  // 置顶会话排在最前，其余按最后更新时间倒序
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return b.updatedAt - a.updatedAt;
    });
  }, [conversations]);

  // 把已加载消息建成 id → message 映射，避免每条会话都 O(n) 查找最后消息
  const messageMap = useMemo(() => {
    const map: Record<string, { content: string }> = {};
    for (const list of Object.values(messages)) {
      for (const message of list) {
        map[message.id] = message;
      }
    }
    return map;
  }, [messages]);

  return (
    <div className="min-h-screen bg-wechat-bg pb-16" data-testid="chat-page">
      <Header title="微信" />
      <div className="divide-y divide-wechat-divider">
        {sortedConversations.map((conversation) => {
          const contact = contacts.find((c) => c.id === conversation.contactId);
          const lastMessage = messageMap[conversation.lastMessageId];
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
