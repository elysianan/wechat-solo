import { create } from 'zustand';
import type { Conversation, Message } from '../types';
import { db } from '../db/database';
import { generateReply } from '../agents/engine';
import type { ReplyPlan } from '../agents/types';
import { useAppStore } from './useAppStore';

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  loaded: boolean;
  replyTimeScale: number;
  typingConversations: Record<string, boolean>;
  loadChats: () => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  updateMessageStatus: (messageId: string, status: Message['status']) => Promise<void>;
  setReplyTimeScale: (scale: number) => void;
}

// 生成唯一消息 id
function makeMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// 按 Agent 计划调度状态流转与回复
function scheduleStatusFlow(userMessage: Message, plan: ReplyPlan) {
  const { replyDelayMs, readDelayMs, typingDurationMs, readUserMessageIds, replyMessages } = plan;
  const { conversationId } = userMessage;

  const sentAt = replyDelayMs * 0.15;
  const deliveredAt = replyDelayMs * 0.30;

  // sent
  setTimeout(() => {
    useChatStore.getState().updateMessageStatus(userMessage.id, 'sent').catch((err) => {
      console.error('消息状态更新失败:', err);
    });
  }, sentAt);

  // delivered
  setTimeout(() => {
    useChatStore.getState().updateMessageStatus(userMessage.id, 'delivered').catch((err) => {
      console.error('消息状态更新失败:', err);
    });
  }, deliveredAt);

  // read + 回复：先标记已读，再展示"正在输入"，最后写入回复
  setTimeout(() => {
    readUserMessageIds.forEach((id) => {
      useChatStore.getState().updateMessageStatus(id, 'read').catch((err) => {
        console.error('消息状态更新失败:', err);
      });
    });

    const shouldShowTyping = typingDurationMs > 0;
    if (shouldShowTyping) {
      useChatStore.setState((state) => ({
        typingConversations: { ...state.typingConversations, [conversationId]: true },
      }));
    }

    setTimeout(() => {
      if (replyMessages.length > 0) {
        receiveAgentReply(plan).catch((err) => {
          console.error('Agent 回复写入失败:', err);
        });
      }
      useChatStore.setState((state) => ({
        typingConversations: { ...state.typingConversations, [conversationId]: false },
      }));
    }, typingDurationMs);
  }, readDelayMs);
}

// 接收 Agent 回复并写入数据层
async function receiveAgentReply(plan: ReplyPlan) {
  const { conversationId, contactId, replyMessages } = plan;
  if (replyMessages.length === 0) return;

  const now = Date.now();
  const agentMessages: Message[] = replyMessages.map((reply, index) => ({
    id: makeMessageId(),
    conversationId,
    senderId: contactId,
    type: 'text',
    content: reply.content,
    status: 'sent',
    createdAt: now + index * 500,
  }));

  await db.messages.bulkAdd(agentMessages);

  const lastMessage = agentMessages[agentMessages.length - 1];
  const isCurrent = useAppStore.getState().currentConversationId === conversationId;

  await db.conversations.where('id').equals(conversationId).modify((conversation) => {
    conversation.lastMessageId = lastMessage.id;
    conversation.updatedAt = now;
    conversation.unreadCount = isCurrent ? 0 : conversation.unreadCount + 1;
  });

  useChatStore.setState((state) => {
    const existing = state.messages[conversationId] || [];
    return {
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastMessageId: lastMessage.id,
              updatedAt: now,
              unreadCount: isCurrent ? 0 : c.unreadCount + 1,
            }
          : c
      ),
      messages: {
        ...state.messages,
        [conversationId]: [...existing, ...agentMessages],
      },
    };
  });
}

// 聊天状态：加载会话、按会话分组消息、发送消息、标记已读
export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: {},
  loaded: false,
  replyTimeScale: 1,
  typingConversations: {},

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

  setReplyTimeScale: (scale) => set({ replyTimeScale: scale }),

  updateMessageStatus: async (messageId, status) => {
    await db.messages.update(messageId, { status });
    set((state) => {
      const next: Record<string, Message[]> = {};
      for (const convId of Object.keys(state.messages)) {
        next[convId] = state.messages[convId].map((m) =>
          m.id === messageId ? { ...m, status } : m
        );
      }
      return { messages: next };
    });
  },

  sendMessage: async (conversationId, content) => {
    const now = Date.now();
    const message: Message = {
      id: makeMessageId(),
      conversationId,
      senderId: 'me',
      type: 'text',
      content,
      status: 'sending',
      createdAt: now,
    };

    try {
      await db.messages.add(message);
    } catch {
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [
            ...(state.messages[conversationId] || []),
            { ...message, status: 'failed' },
          ],
        },
      }));
      return;
    }

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

    // 为当前会话生成 Agent 回复计划
    try {
      const conversation = await db.conversations.get(conversationId);
      const contact = conversation?.contactId
        ? await db.contacts.get(conversation.contactId)
        : undefined;
      if (!contact) return;

      const timeScale = useChatStore.getState().replyTimeScale;
      const recentMessages = useChatStore.getState().messages[conversationId] || [];
      const plan = generateReply({
        contact,
        userMessage: message,
        recentMessages,
        options: { timeScale },
      });

      scheduleStatusFlow(message, plan);
    } catch (error) {
      console.error('Agent 回复调度失败:', error);
      await useChatStore.getState().updateMessageStatus(message.id, 'failed');
    }
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
