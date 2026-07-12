import { create } from 'zustand';
import type { Conversation, Message } from '../types';
import { db } from '../db/database';

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  loaded: boolean;
  loadChats: () => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
}

// 生成唯一消息 id
function makeMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// 聊天状态：加载会话、按会话分组消息、发送消息、标记已读
export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: {},
  loaded: false,
  loadChats: async () => {
    const conversations = await db.conversations.toArray();
    const allMessages = await db.messages.toArray();
    const messages: Record<string, Message[]> = {};

    for (const conversation of conversations) {
      messages[conversation.id] = allMessages
        .filter((m) => m.conversationId === conversation.id)
        .sort((a, b) => a.createdAt - b.createdAt);
    }

    set({ conversations, messages, loaded: true });
  },
  sendMessage: async (conversationId, content) => {
    const now = Date.now();
    const message: Message = {
      id: makeMessageId(),
      conversationId,
      senderId: 'me',
      type: 'text',
      content,
      status: 'sent',
      createdAt: now,
    };

    await db.messages.add(message);
    await db.conversations.update(conversationId, {
      lastMessageId: message.id,
      updatedAt: now,
    });

    set((state) => {
      const conversationMessages = state.messages[conversationId] || [];
      return {
        conversations: state.conversations.map((c) =>
          c.id === conversationId
            ? { ...c, lastMessageId: message.id, updatedAt: now }
            : c
        ),
        messages: {
          ...state.messages,
          [conversationId]: [...conversationMessages, message],
        },
      };
    });
  },
  markConversationRead: async (conversationId) => {
    await db.conversations.update(conversationId, { unreadCount: 0 });
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },
}));
