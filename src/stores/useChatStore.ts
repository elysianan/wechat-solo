import { create } from 'zustand';
import type { Contact, Conversation, Message, MessagePayload } from '../types';
import { db } from '../db/database';
import { generateReply } from '../agents/engine';
import type { ReplyPlan } from '../agents/types';
import { useAppStore } from './useAppStore';
import { makeMessageId } from '../utils/id';

// 转义正则特殊字符，避免昵称中的符号破坏匹配
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// session 级防重复状态: 放模块级而非 Zustand state(避免写入时触发重渲染),
// 页面刷新自然清零; 引擎选取台词时跳过已用, 并直接写入这两个集合
const sessionUsedResponses = new Set<string>();
const sessionRuleUsage = new Map<string, number>();

// 主动发起对话调度器状态
let initiateTimer: ReturnType<typeof setInterval> | null = null;
let lastGlobalInitiateAt = 0; // 全局冷却时间戳(内存级, 单人冷却走 lastInitiatedAt 持久化)

const INITIATE_CHECK_INTERVAL_MS = 60_000; // 检查间隔: 固定 60s 不缩放(避免 timeScale=0 时死循环)
const INITIATE_GLOBAL_COOLDOWN_MS = 90_000; // 全局冷却: 90s × timeScale
const INITIATE_CONTACT_COOLDOWN_MS = 5 * 60_000; // 单联系人冷却: 5 分钟 × timeScale

// 测试用: 重置 session 防重复与调度器冷却状态
export function __resetSessionState(): void {
  sessionUsedResponses.clear();
  sessionRuleUsage.clear();
  lastGlobalInitiateAt = 0;
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

// 根据发送负载构造完整 Message 对象
function buildMessageFromPayload(
  id: string,
  conversationId: string,
  payload: MessagePayload,
  now: number
): Message {
  const base = {
    id,
    conversationId,
    senderId: 'me' as const,
    status: 'sending' as const,
    createdAt: now,
  };

  switch (payload.type) {
    case 'text':
      return { ...base, type: 'text' as const, content: payload.content };
    case 'image':
      return {
        ...base,
        type: 'image' as const,
        url: payload.url,
        width: payload.width,
        height: payload.height,
      };
    case 'voice':
      return {
        ...base,
        type: 'voice' as const,
        url: payload.url,
        duration: payload.duration,
      };
    case 'redpacket':
      return {
        ...base,
        type: 'redpacket' as const,
        amount: payload.amount,
        title: payload.title ?? '恭喜发财，大吉大利',
        packetStatus: 'pending' as const,
      };
    case 'transfer':
      return {
        ...base,
        type: 'transfer' as const,
        amount: payload.amount,
        note: payload.note,
        transferStatus: 'pending' as const,
        transferCreatedAt: now,
      };
    case 'location':
      return {
        ...base,
        type: 'location' as const,
        name: payload.name,
        address: payload.address,
        lat: payload.lat,
        lng: payload.lng,
      };
    case 'contact_card':
      return {
        ...base,
        type: 'contact_card' as const,
        contactId: payload.contactId,
        nickname: payload.nickname,
        avatar: payload.avatar,
        region: payload.region,
        signature: payload.signature,
      };
  }
}

// 将已有消息重建为可发送的负载，用于重试失败消息
function messageToPayload(message: Message): MessagePayload | null {
  switch (message.type) {
    case 'text':
      return { type: 'text', content: message.content };
    case 'image':
      return { type: 'image', url: message.url, width: message.width, height: message.height };
    case 'voice':
      return { type: 'voice', url: message.url, duration: message.duration };
    case 'redpacket':
      return { type: 'redpacket', amount: message.amount, title: message.title };
    default:
      return null;
  }
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  loaded: boolean;
  replyTimeScale: number;
  typingConversations: Record<string, boolean>;
  loadChats: () => Promise<void>;
  sendMessage: (conversationId: string, payload: MessagePayload) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  updateMessageStatus: (messageId: string, status: Message['status']) => Promise<void>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
  retryMessage: (conversationId: string, messageId: string) => Promise<void>;
  setReplyTimeScale: (scale: number) => void;
  startInitiateScheduler: () => void;
  stopInitiateScheduler: () => void;
}

// 加权随机选取
function pickWeighted<T>(items: T[], weightOf: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + weightOf(item), 0);
  let random = Math.random() * total;
  for (const item of items) {
    random -= weightOf(item);
    if (random <= 0) {
      return item;
    }
  }
  return items[items.length - 1];
}

// 主动发起一次对话尝试: 冷却判定 → 加权选人 → 话题注入
async function tryInitiate(): Promise<void> {
  const state = useChatStore.getState();
  const timeScale = state.replyTimeScale;
  const now = Date.now();

  // 全局冷却(内存级, 页面刷新重置)
  if (now - lastGlobalInitiateAt < INITIATE_GLOBAL_COOLDOWN_MS * timeScale) {
    return;
  }

  // 候选: 单聊会话且联系人过了单人冷却(lastInitiatedAt 持久化, 刷新后仍有效)
  const available = state.conversations.filter(
    (conversation) =>
      conversation.type === 'single' &&
      conversation.contactId &&
      now - (conversation.lastInitiatedAt ?? 0) >= INITIATE_CONTACT_COOLDOWN_MS * timeScale
  );
  if (available.length === 0) {
    return;
  }

  const contacts = (
    await db.contacts.bulkGet(available.map((c) => c.contactId!))
  ).filter((c): c is Contact => c !== undefined);

  // 话题池为空的联系人参与不了(规则库扩容前是空数组占位)
  const pool = contacts
    .map((contact) => ({
      contact,
      conversation: available.find((c) => c.contactId === contact.id)!,
    }))
    .filter((item) => item.contact.persona.initiateTopics.length > 0);
  if (pool.length === 0) {
    return;
  }

  // 按人设 initiateChance 加权选人, 话题参与 session 防重复
  const picked = pickWeighted(pool, (item) => item.contact.persona.initiateChance);
  const topics = picked.contact.persona.initiateTopics;
  const unusedTopics = topics.filter((topic) => !sessionUsedResponses.has(topic));
  const topicPool = unusedTopics.length > 0 ? unusedTopics : topics;
  const topic = topicPool[Math.floor(Math.random() * topicPool.length)];
  sessionUsedResponses.add(topic);

  await receiveAgentReply({
    conversationId: picked.conversation.id,
    contactId: picked.contact.id,
    readUserMessageIds: [],
    readDelayMs: 0,
    typingDurationMs: 0,
    replyDelayMs: 0,
    replyMessages: [{ content: topic }],
  });

  lastGlobalInitiateAt = now;
  await db.conversations.update(picked.conversation.id, { lastInitiatedAt: now });
  useChatStore.setState((current) => ({
    conversations: current.conversations.map((c) =>
      c.id === picked.conversation.id ? { ...c, lastInitiatedAt: now } : c
    ),
  }));
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
    type: 'text' as const,
    content: reply.content,
    status: 'sent' as const,
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
  // Sprint7：非文本消息不触发群聊 Agent 回复，仅做状态流转（由 sendMessage 单独处理）
  if (userMessage.type !== 'text') return;

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
  // 并行取数: 不增加 await 链长度, 避免改变状态流转的时序语义
  const [memberResults, me] = await Promise.all([
    db.contacts.bulkGet(memberIds),
    db.me.get('me'),
  ]);
  const members = memberResults.filter((c): c is Contact => c !== undefined);

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
      options: {
        timeScale,
        forceReply: mentioned.length > 0,
        sessionUsedResponses,
        sessionRuleUsage,
        userNickname: me?.nickname,
      },
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

// 群聊非文本消息的状态流转：只到 delivered，不触发成员回复
function scheduleGroupDelivery(message: Message) {
  const timeScale = useChatStore.getState().replyTimeScale;
  setTimeout(() => {
    useChatStore.getState().updateMessageStatus(message.id, 'sent').catch((err) => {
      console.error('消息状态更新失败:', err);
    });
  }, 150 * timeScale);
  setTimeout(() => {
    useChatStore.getState().updateMessageStatus(message.id, 'delivered').catch((err) => {
      console.error('消息状态更新失败:', err);
    });
  }, 300 * timeScale);
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

  // 主动发起对话调度器: 聊天列表页挂载时启动, 卸载时停止
  startInitiateScheduler: () => {
    if (initiateTimer) {
      return;
    }
    // 回调返回 promise: 测试中 advanceTimersByTimeAsync 可 await 完整异步链
    initiateTimer = setInterval(() => {
      return tryInitiate().catch((error) => {
        console.error('主动发起对话失败:', error);
      });
    }, INITIATE_CHECK_INTERVAL_MS);
  },

  stopInitiateScheduler: () => {
    if (initiateTimer) {
      clearInterval(initiateTimer);
      initiateTimer = null;
    }
  },

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

  deleteMessage: async (conversationId, messageId) => {
    await db.messages.delete(messageId);

    set((state) => {
      const remaining = (state.messages[conversationId] || []).filter(
        (m) => m.id !== messageId
      );
      const lastMessage = remaining[remaining.length - 1];
      const nextConversations = state.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          lastMessageId: lastMessage?.id ?? '',
          updatedAt: lastMessage?.createdAt ?? c.updatedAt,
        };
      });
      return {
        conversations: nextConversations,
        messages: { ...state.messages, [conversationId]: remaining },
      };
    });

    const conversation = await db.conversations.get(conversationId);
    if (conversation) {
      const remaining = await db.messages
        .where('conversationId')
        .equals(conversationId)
        .sortBy('createdAt');
      const lastMessage = remaining[remaining.length - 1];
      await db.conversations.update(conversationId, {
        lastMessageId: lastMessage?.id ?? '',
        updatedAt: lastMessage?.createdAt ?? conversation.updatedAt,
      });
    }
  },

  retryMessage: async (conversationId, messageId) => {
    const message = useChatStore
      .getState()
      .messages[conversationId]?.find((m) => m.id === messageId);
    if (!message || message.status !== 'failed') return;

    const payload = messageToPayload(message);
    if (!payload) return;

    await useChatStore.getState().deleteMessage(conversationId, messageId);
    await useChatStore.getState().sendMessage(conversationId, payload);
  },

  sendMessage: async (conversationId, payload) => {
    const now = Date.now();
    const message = buildMessageFromPayload(makeMessageId(), conversationId, payload, now);

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
            { ...message, status: 'failed' as const },
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

    // 非文本消息只做状态流转，不触发 Agent 回复
    const conversation = await db.conversations.get(conversationId);
    if (!conversation) return;

    const timeScale = useChatStore.getState().replyTimeScale;
    if (payload.type !== 'text') {
      if (conversation.type === 'group') {
        scheduleGroupDelivery(message);
      } else {
        scheduleStatusFlow(message, {
          conversationId,
          contactId: conversation.contactId ?? '',
          readUserMessageIds: [message.id],
          readDelayMs: 1200 * timeScale,
          typingDurationMs: 0,
          replyDelayMs: 600 * timeScale,
          replyMessages: [],
        });
      }
      return;
    }

    // 文本消息按原流程生成 Agent 回复
    try {
      // 群聊走群调度，单聊走原有单聊流程
      if (conversation.type === 'group') {
        await scheduleGroupReplies(message, conversation);
        return;
      }

      // 并行取数: 不增加 await 链长度, 避免改变状态流转的时序语义
      const [contact, me] = await Promise.all([
        conversation.contactId
          ? db.contacts.get(conversation.contactId)
          : Promise.resolve(undefined),
        db.me.get('me'),
      ]);
      if (!contact) return;

      const recentMessages = useChatStore.getState().messages[conversationId] || [];
      const plan = generateReply({
        contact,
        userMessage: message,
        recentMessages,
        conversation,
        options: {
          timeScale,
          sessionUsedResponses,
          sessionRuleUsage,
          userNickname: me?.nickname,
        },
      });

      // 剧情进度变更持久化: null=清除, 对象=更新
      if (plan.storyUpdate !== undefined) {
        if (plan.storyUpdate === null) {
          await db.conversations.where('id').equals(conversationId).modify((c) => {
            delete c.storyProgress;
          });
        } else {
          await db.conversations.update(conversationId, { storyProgress: plan.storyUpdate });
        }
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, storyProgress: plan.storyUpdate ?? undefined }
              : c
          ),
        }));
      }

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
