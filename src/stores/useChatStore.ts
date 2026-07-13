import { create } from 'zustand';
import type { Contact, Conversation, Message } from '../types';
import { db } from '../db/database';
import { generateReply } from '../agents/engine';
import type { ReplyPlan } from '../agents/types';
import { useAppStore } from './useAppStore';
import { makeMessageId } from '../utils/id';

// 转义正则特殊字符，避免昵称中的符号破坏匹配
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 解析消息中的 @成员：最长昵称优先，要求 @名字 后是空格/标点/结尾（边界匹配）
export function parseMentions(content: string, members: Contact[]): Contact[] {
  const sorted = [...members].sort((a, b) => b.name.length - a.name.length);
  const mentioned: Contact[] = [];
  for (const member of sorted) {
    const pattern = new RegExp(`@${escapeRegExp(member.name)}(?=\\s|$|[，。！？、,.!?])`);
    if (pattern.test(content) && !mentioned.some((m) => m.id === member.id)) {
      mentioned.push(member);
    }
  }
  return mentioned;
}

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
async function receiveAgentReply(plan: ReplyPlan) {  const { conversationId, contactId, replyMessages } = plan;
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

  const lastMessage = agentMessages[agentMessages.length - 1];
  const topRoute = useAppStore.getState().pageStack.at(-1);
  const isCurrent = topRoute?.type === 'chat-detail' && topRoute.conversationId === conversationId;

  // 将 Agent 消息写入与会话更新放在同一个 Dexie 事务中
  await db.transaction('rw', [db.messages, db.conversations], () => {
    return db.messages.bulkAdd(agentMessages).then(() =>
      db.conversations.where('id').equals(conversationId).modify((conversation) => {
        conversation.lastMessageId = lastMessage.id;
        conversation.updatedAt = now;
        conversation.unreadCount = isCurrent ? 0 : conversation.unreadCount + 1;
      })
    );
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

// 群聊调度：用户消息 sent→delivered（群无已读回执），成员按 @或人设概率依次回复
async function scheduleGroupReplies(userMessage: Message, conversation: Conversation) {
  const { conversationId } = userMessage;
  const timeScale = useChatStore.getState().replyTimeScale;

  // 用户消息状态流转：群聊没有已读回执，到 delivered 为止
  setTimeout(() => {
    useChatStore.getState().updateMessageStatus(userMessage.id, 'sent').catch((err) => {
      console.error('消息状态更新失败:', err);
    });
  }, 150 * timeScale);
  setTimeout(() => {
    useChatStore.getState().updateMessageStatus(userMessage.id, 'delivered').catch((err) => {
      console.error('消息状态更新失败:', err);
    });
  }, 300 * timeScale);

  const memberIds = conversation.memberIds ?? [];
  const members = (await db.contacts.bulkGet(memberIds)).filter(
    (c): c is Contact => c !== undefined
  );

  // @提及必回；无 @ 时每人按人设 groupReplyChance 独立判定
  const mentioned = parseMentions(userMessage.content, members);
  const repliers =
    mentioned.length > 0
      ? mentioned
      : members.filter((m) => Math.random() < m.persona.behavior.groupReplyChance);
  if (repliers.length === 0) return;

  const recentMessages = useChatStore.getState().messages[conversationId] || [];
  let cursor = 0;

  // 多人回复时依次排队：一人"正在输入"结束，下一人再开始
  for (const member of repliers) {
    const plan = generateReply({
      contact: member,
      userMessage,
      recentMessages,
      options: { timeScale, forceReply: mentioned.length > 0 },
    });
    const startAt = cursor + plan.replyDelayMs;

    setTimeout(() => {
      if (plan.typingDurationMs > 0) {
        useChatStore.setState((state) => ({
          typingConversations: { ...state.typingConversations, [conversationId]: true },
        }));
      }
      setTimeout(() => {
        if (plan.replyMessages.length > 0) {
          receiveAgentReply(plan).catch((err) => {
            console.error('Agent 回复写入失败:', err);
          });
        }
        useChatStore.setState((state) => ({
          typingConversations: { ...state.typingConversations, [conversationId]: false },
        }));
      }, plan.typingDurationMs);
    }, startAt);

    cursor = startAt + plan.typingDurationMs;
  }
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
    const messages: Record<string, Message[]> = {};

    // 按会话分别加载最近 50 条消息，避免消息量增长后一次性全量读取
    for (const conversation of conversations) {
      const conversationMessages = await db.messages
        .where('conversationId')
        .equals(conversation.id)
        .sortBy('createdAt');
      messages[conversation.id] = conversationMessages.slice(-50);
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

    // 将消息与会话更新放在同一个 Dexie 事务中，避免不一致
    try {
      await db.transaction('rw', [db.messages, db.conversations], () => {
        return db.messages.add(message).then(() =>
          db.conversations.update(conversationId, {
            lastMessageId: message.id,
            updatedAt: now,
          })
        );
      });
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
      if (!conversation) return;

      // 群聊走群调度，单聊走原有单聊流程
      if (conversation.type === 'group') {
        await scheduleGroupReplies(message, conversation);
        return;
      }

      const contact = conversation.contactId
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
