# WeChat Solo Sprint 2 Implementation Plan: Agent Engine & Message Status Flow

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现规则驱动的 Agent 回复引擎、完整消息状态流转（sending → sent → delivered → read）、"对方正在输入…"提示，以及 Agent 回复后的会话预览/未读数更新。

**Architecture:** 在 `src/agents/engine.ts` 中放置纯函数 Agent 引擎，根据联系人的人设规则返回 `ReplyPlan`；`useChatStore` 按 plan 调度状态流转和 UI 状态；新增 `TypingIndicator` 组件并在 `ChatDetailPage` 中接入；所有延迟通过 `timeScale` 可缩放，测试时传 0。

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, Dexie.js, Vitest, React Testing Library, lucide-react.

## Global Constraints

- 项目根目录：`C:\Users\Nan\wechat-solo`
- TypeScript strict mode。
- 移动端优先 UI，桌面端最大宽度 430px 居中。
- 品牌色 WeChat green `#07C160`。
- UI 文字简体中文；代码注释使用中文。
- 不调用真实 LLM API，Agent 回复完全由本地规则驱动。
- 数据通过 Dexie.js 持久化到浏览器 IndexedDB，无后端。
- 每个 Task 结束时必须有通过的测试或验证步骤，并提交 git。

---

## File Structure

```
src/
├── agents/
│   ├── engine.ts                 # 新增：Agent 回复引擎
│   └── types.ts                  # 修改：导出 GenerateReplyInput / ReplyPlan
├── components/chat/
│   ├── MessageBubble.tsx         # 不变，只消费 Message.status
│   └── TypingIndicator.tsx       # 新增：对方正在输入提示
├── pages/
│   └── ChatDetailPage.tsx        # 修改：接入 typing 状态
├── stores/
│   ├── useAppStore.ts            # 不变
│   └── useChatStore.ts           # 修改：状态流转与 Agent 调度
└── __tests__/
    ├── agents/engine.test.ts     # 新增
    ├── components/chat/TypingIndicator.test.tsx  # 新增
    ├── stores/chatStore.test.ts  # 替换为 Sprint 2 用例
    └── chat-flow.test.tsx        # 修改：支持 timeScale=0 与 Agent 回复断言
```

---

### Task 1: 扩展 Agent 类型定义

**Files:**
- Create: none
- Modify: `src/agents/types.ts`
- Test: `src/__tests__/agents/types.test.ts`（已有，追加类型用例）

**Interfaces:**
- Consumes: `Contact`, `Message` from `src/types/index.ts`
- Produces: `GenerateReplyInput` 与 `ReplyPlan` 类型，供 `engine.ts` 与 `useChatStore.ts` 使用

- [ ] **Step 1: 修改 `src/agents/types.ts`**

```typescript
import type { Contact, Message } from '../types';

export type {
  AgentPersona,
  AgentBehavior,
  ReplyRule,
  ReplyTrigger,
} from '../types';

// Agent 引擎输入
export interface GenerateReplyInput {
  contact: Contact;
  userMessage: Message;
  recentMessages: Message[];
  options?: {
    timeScale?: number; // 默认 1；测试传 0
  };
}

// Agent 回复计划
export interface ReplyPlan {
  conversationId: string;
  contactId: string;
  readUserMessageIds: string[];       // 要标为 read 的用户消息 id
  readDelayMs: number;                // 从发送到 read 的延迟
  typingDurationMs: number;           // 0 表示不显示"正在输入"
  replyDelayMs: number;               // 从发送到 Agent 回复出现的总延迟
  replyMessages: Array<{ content: string }>;
}
```

- [ ] **Step 2: 在 `src/__tests__/agents/types.test.ts` 追加用例**

```typescript
import { describe, it, expect } from 'vitest';
import type { GenerateReplyInput, ReplyPlan } from '../../agents/types';
import type { Contact, Message } from '../../types';

describe('agents/types ReplyPlan', () => {
  it('accepts a valid ReplyPlan object', () => {
    const plan: ReplyPlan = {
      conversationId: 'conv-1',
      contactId: 'mom',
      readUserMessageIds: ['msg-1'],
      readDelayMs: 300,
      typingDurationMs: 500,
      replyDelayMs: 1000,
      replyMessages: [{ content: '吃了吗？' }],
    };
    expect(plan.replyMessages[0].content).toBe('吃了吗？');
  });
});
```

- [ ] **Step 3: 运行测试**

Run: `npx vitest run src/__tests__/agents/types.test.ts`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/agents/types.ts src/__tests__/agents/types.test.ts
git commit -m "feat(agents): add GenerateReplyInput and ReplyPlan types"
```

---

### Task 2: 实现 Agent 回复引擎

**Files:**
- Create: `src/agents/engine.ts`
- Modify: none
- Test: `src/__tests__/agents/engine.test.ts`

**Interfaces:**
- Consumes: `GenerateReplyInput`, `ReplyPlan` from `src/agents/types.ts`; `ReplyRule`, `Contact`, `Message` from `src/types`
- Produces: `generateReply(input)` 函数，返回 `ReplyPlan`

- [ ] **Step 1: 编写 `src/__tests__/agents/engine.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { generateReply } from '../../agents/engine';
import type { Contact, Message } from '../../types';

function createContact(overrides?: Partial<Contact>): Contact {
  return {
    id: 'test-contact',
    name: '测试联系人',
    avatar: '/avatar.svg',
    wechatId: 'wxid_test',
    region: '中国',
    signature: '',
    tags: [],
    isOnline: true,
    persona: {
      id: 'test',
      name: '测试',
      avatar: '/avatar.svg',
      wechatId: 'wxid_test',
      region: '中国',
      signature: '',
      tags: [],
      behavior: {
        replyDelayMin: 1000,
        replyDelayMax: 1000,
        typingIndicatorChance: 0,
        readButNoReplyChance: 0,
        multiMessageChance: 0,
        emojiChance: 0,
      },
      rules: [],
    },
    ...overrides,
  } as Contact;
}

function createUserMessage(content: string): Message {
  return {
    id: 'msg-user-1',
    conversationId: 'conv-1',
    senderId: 'me',
    type: 'text',
    content,
    status: 'sent',
    createdAt: Date.now(),
  };
}

describe('AgentEngine', () => {
  it('matches keyword rule', () => {
    const contact = createContact({
      persona: {
        ...createContact().persona,
        rules: [
          { id: 'food', triggers: { keywords: ['吃'] }, responses: ['吃了吗？'], weight: 1 },
          { id: 'default', triggers: { default: true }, responses: ['好的'], weight: 1 },
        ],
      },
    });
    const plan = generateReply({
      contact,
      userMessage: createUserMessage('吃了吗'),
      recentMessages: [],
      options: { timeScale: 0 },
    });
    expect(plan.replyMessages).toHaveLength(1);
    expect(plan.replyMessages[0].content).toBe('吃了吗？');
  });

  it('falls back to default rule', () => {
    const contact = createContact({
      persona: {
        ...createContact().persona,
        rules: [
          { id: 'food', triggers: { keywords: ['吃'] }, responses: ['吃了吗？'], weight: 1 },
          { id: 'default', triggers: { default: true }, responses: ['收到', '尽快'], weight: 1 },
        ],
      },
    });
    const plan = generateReply({
      contact,
      userMessage: createUserMessage('天气不错'),
      recentMessages: [],
      options: { timeScale: 0 },
    });
    expect(['收到', '尽快']).toContain(plan.replyMessages[0].content);
  });

  it('returns empty reply when read but no reply', () => {
    const contact = createContact({
      persona: {
        ...createContact().persona,
        behavior: { ...createContact().persona.behavior, readButNoReplyChance: 1 },
      },
    });
    const userMessage = createUserMessage('hello');
    const plan = generateReply({
      contact,
      userMessage,
      recentMessages: [userMessage],
      options: { timeScale: 0 },
    });
    expect(plan.replyMessages).toHaveLength(0);
    expect(plan.readUserMessageIds).toContain(userMessage.id);
  });

  it('scales time to zero', () => {
    const contact = createContact();
    const plan = generateReply({
      contact,
      userMessage: createUserMessage('hi'),
      recentMessages: [],
      options: { timeScale: 0 },
    });
    expect(plan.replyDelayMs).toBe(0);
    expect(plan.readDelayMs).toBe(0);
  });

  it('produces multiple messages when multiMessageChance is 1', () => {
    const contact = createContact({
      persona: {
        ...createContact().persona,
        behavior: { ...createContact().persona.behavior, multiMessageChance: 1 },
        rules: [{ id: 'default', triggers: { default: true }, responses: ['a', 'b', 'c'], weight: 1 }],
      },
    });
    const plan = generateReply({
      contact,
      userMessage: createUserMessage('hi'),
      recentMessages: [],
      options: { timeScale: 0 },
    });
    expect(plan.replyMessages.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run src/__tests__/agents/engine.test.ts`
Expected: FAIL（`generateReply` 不存在）

- [ ] **Step 3: 实现 `src/agents/engine.ts`**

```typescript
import type { GenerateReplyInput, ReplyPlan } from './types';
import type { ReplyRule } from '../types';

// 生成 [min, max] 之间的随机数
function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// 从数组中随机取一项
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 判断规则是否命中用户消息
function matchesRule(rule: ReplyRule, content: string): boolean {
  if (rule.triggers.keywords?.some((keyword) => content.includes(keyword))) {
    return true;
  }
  if (rule.triggers.patterns?.some((pattern) => pattern.test(content))) {
    return true;
  }
  return false;
}

// 按 weight 加权随机选一条规则
function selectWeightedRule(rules: ReplyRule[]): ReplyRule {
  const totalWeight = rules.reduce((sum, rule) => sum + rule.weight, 0);
  let random = Math.random() * totalWeight;
  for (const rule of rules) {
    random -= rule.weight;
    if (random <= 0) {
      return rule;
    }
  }
  return rules[rules.length - 1];
}

// 选择回复规则：先匹配关键词，无命中则兜底 default
function selectRule(rules: ReplyRule[], content: string): ReplyRule {
  const matched = rules.filter((rule) => matchesRule(rule, content));
  const candidates = matched.length > 0 ? matched : rules.filter((rule) => rule.triggers.default);
  if (candidates.length === 0) {
    // 没有任何规则时回退到最后一条，保证引擎不崩溃
    return rules[rules.length - 1];
  }
  return selectWeightedRule(candidates);
}

// 根据联系人的人设生成回复计划
export function generateReply(input: GenerateReplyInput): ReplyPlan {
  const { contact, userMessage, recentMessages, options } = input;
  const timeScale = options?.timeScale ?? 1;
  const behavior = contact.persona.behavior;

  // 计算时间线
  const baseDelay = randomBetween(behavior.replyDelayMin, behavior.replyDelayMax) * timeScale;
  const showTyping = Math.random() < behavior.typingIndicatorChance;
  const readDelay = baseDelay * randomBetween(0.3, 0.5);
  const typingDuration = showTyping ? (baseDelay - readDelay) * randomBetween(0.4, 0.9) : 0;

  // 所有我发送的消息都视为会被对方 read
  const readUserMessageIds = recentMessages
    .filter((message) => message.senderId === 'me')
    .map((message) => message.id);

  // 已读不回
  if (Math.random() < behavior.readButNoReplyChance) {
    return {
      conversationId: userMessage.conversationId,
      contactId: contact.id,
      readUserMessageIds,
      readDelayMs: readDelay,
      typingDurationMs: 0,
      replyDelayMs: baseDelay,
      replyMessages: [],
    };
  }

  // 选择规则与回复文本
  const rule = selectRule(contact.persona.rules, userMessage.content);
  const firstResponse = pickRandom(rule.responses);
  const replyMessages = [{ content: firstResponse }];

  // 按概率追加第二条消息
  if (
    behavior.multiMessageChance > 0 &&
    rule.responses.length > 1 &&
    Math.random() < behavior.multiMessageChance
  ) {
    replyMessages.push({ content: pickRandom(rule.responses) });
  }

  return {
    conversationId: userMessage.conversationId,
    contactId: contact.id,
    readUserMessageIds,
    readDelayMs: readDelay,
    typingDurationMs: typingDuration,
    replyDelayMs: baseDelay,
    replyMessages,
  };
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npx vitest run src/__tests__/agents/engine.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/agents/engine.ts src/__tests__/agents/engine.test.ts
git commit -m "feat(agents): add rule-based reply engine with ReplyPlan"
```

---

### Task 3: 在 useChatStore 中实现消息状态流转与 Agent 调度

**Files:**
- Create: none
- Modify: `src/stores/useChatStore.ts`
- Test: `src/__tests__/stores/chatStore.test.ts`

**Interfaces:**
- Consumes: `generateReply` from `src/agents/engine.ts`; `ReplyPlan` from `src/agents/types.ts`; `useAppStore` 的 `currentConversationId`
- Produces: `replyTimeScale`、`typingConversations`、`setReplyTimeScale`、`updateMessageStatus`，以及内部调度后的状态变更

- [ ] **Step 1: 编写 Store 测试 `src/__tests__/stores/chatStore.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useChatStore } from '../../stores/useChatStore';
import { useAppStore } from '../../stores/useAppStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('useChatStore agent flow', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await db.delete();
    await db.open();
    await initializeDatabase();
    useChatStore.setState({
      conversations: [],
      messages: {},
      loaded: false,
      replyTimeScale: 0,
      typingConversations: {},
    });
    useAppStore.setState({
      currentTab: 'chats',
      currentPage: 'tabs',
      currentConversationId: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends message and transitions status to read', async () => {
    await useChatStore.getState().loadChats();
    const conversation = useChatStore.getState().conversations[0];
    await useChatStore.getState().sendMessage(conversation.id, '测试消息');

    let messages = useChatStore.getState().messages[conversation.id];
    expect(messages[messages.length - 1].status).toBe('sending');

    await vi.runAllTimersAsync();
    messages = useChatStore.getState().messages[conversation.id];
    expect(messages[messages.length - 1].status).toBe('read');
  });

  it('receives agent reply after user message', async () => {
    // 把 mom 的已读不回概率设为 0，避免测试随机失败
    await db.contacts.where('id').equals('mom').modify((contact) => {
      contact.persona.behavior.readButNoReplyChance = 0;
    });

    await useChatStore.getState().loadChats();
    const conversation = useChatStore.getState().conversations.find((c) => c.contactId === 'mom')!;
    await useChatStore.getState().sendMessage(conversation.id, '吃了吗');
    await vi.runAllTimersAsync();

    const messages = useChatStore.getState().messages[conversation.id];
    const lastMessage = messages[messages.length - 1];
    expect(lastMessage.senderId).toBe('mom');
  });

  it('shows typing indicator then hides', async () => {
    await db.contacts.where('id').equals('mom').modify((contact) => {
      contact.persona.behavior.readButNoReplyChance = 0;
    });

    await useChatStore.getState().loadChats();
    const conversation = useChatStore.getState().conversations.find((c) => c.contactId === 'mom')!;
    await useChatStore.getState().sendMessage(conversation.id, '吃了吗');

    expect(useChatStore.getState().typingConversations[conversation.id]).toBe(true);
    await vi.runAllTimersAsync();
    expect(useChatStore.getState().typingConversations[conversation.id]).toBeFalsy();
  });

  it('increments unread count when user is not in conversation', async () => {
    await db.contacts.where('id').equals('mom').modify((contact) => {
      contact.persona.behavior.readButNoReplyChance = 0;
    });

    await useChatStore.getState().loadChats();
    const conversation = useChatStore.getState().conversations.find((c) => c.contactId === 'mom')!;
    useAppStore.setState({ currentConversationId: 'other-conv' });

    await useChatStore.getState().sendMessage(conversation.id, '吃了吗');
    await vi.runAllTimersAsync();

    const updated = useChatStore.getState().conversations.find((c) => c.id === conversation.id);
    expect(updated?.unreadCount).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run src/__tests__/stores/chatStore.test.ts`
Expected: FAIL（缺少 `replyTimeScale`、`typingConversations`、`setReplyTimeScale` 等）

- [ ] **Step 3: 修改 `src/stores/useChatStore.ts`**

```typescript
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
    useChatStore.getState().updateMessageStatus(userMessage.id, 'sent');
  }, sentAt);

  // delivered
  setTimeout(() => {
    useChatStore.getState().updateMessageStatus(userMessage.id, 'delivered');
  }, deliveredAt);

  // read + 正在输入 + 回复
  setTimeout(() => {
    readUserMessageIds.forEach((id) => {
      useChatStore.getState().updateMessageStatus(id, 'read');
    });

    if (typingDurationMs > 0) {
      useChatStore.setState((state) => ({
        typingConversations: { ...state.typingConversations, [conversationId]: true },
      }));
    }

    if (replyMessages.length === 0) {
      useChatStore.setState((state) => ({
        typingConversations: { ...state.typingConversations, [conversationId]: false },
      }));
      return;
    }

    setTimeout(() => {
      receiveAgentReply(plan);
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
    const target = state.conversations.find((c) => c.id === conversationId);
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
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npx vitest run src/__tests__/stores/chatStore.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/stores/useChatStore.ts src/__tests__/stores/chatStore.test.ts
git commit -m "feat(store): add message status flow, typing state, and agent reply scheduling"
```

---

### Task 4: 添加"对方正在输入…"组件并接入聊天详情页

**Files:**
- Create: `src/components/chat/TypingIndicator.tsx`
- Create: `src/__tests__/components/chat/TypingIndicator.test.tsx`
- Modify: `src/pages/ChatDetailPage.tsx`
- Test: `src/__tests__/pages/ChatDetailPage.test.tsx`（已有，可追加用例或保持）

**Interfaces:**
- Consumes: `typingConversations` from `useChatStore`; `avatar`/`name` props
- Produces: `TypingIndicator` 组件，在 `ChatDetailPage` 中条件渲染

- [ ] **Step 1: 创建 `src/components/chat/TypingIndicator.tsx`**

```tsx
interface TypingIndicatorProps {
  avatar: string;
  name: string;
}

// 聊天详情页中的"对方正在输入…"提示
export function TypingIndicator({ avatar, name }: TypingIndicatorProps) {
  return (
    <div
      className="flex justify-start mb-4 px-4"
      data-testid="typing-indicator"
    >
      <img
        src={avatar}
        alt={name}
        className="w-10 h-10 rounded-md bg-gray-200 object-cover mr-3 flex-shrink-0"
      />
      <div className="flex flex-col items-start max-w-[70%]">
        <span className="text-xs text-wechat-text-secondary mb-1">{name}</span>
        <div className="px-3 py-2 rounded-lg text-sm bg-white text-wechat-text-primary">
          <div className="flex items-center gap-1">
            <span className="text-xs text-wechat-text-secondary">对方正在输入</span>
            <span className="inline-flex gap-0.5">
              <span
                className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 `src/__tests__/components/chat/TypingIndicator.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypingIndicator } from '../../../components/chat/TypingIndicator';

describe('TypingIndicator', () => {
  it('renders avatar, name and test id', () => {
    render(<TypingIndicator avatar="/avatar.svg" name="王阿姨" />);
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    expect(screen.getByText('王阿姨')).toBeInTheDocument();
    expect(screen.getByText('对方正在输入')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: 修改 `src/pages/ChatDetailPage.tsx`**

```tsx
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
  const conversationId = useAppStore((state) => state.currentConversationId);
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
        {isTyping && <TypingIndicator avatar={contact.avatar} name={contact.name} />}
        <div ref={bottomRef} />
      </div>
      <MessageInput onSend={(text) => sendMessage(conversationId, text)} />
    </div>
  );
}
```

- [ ] **Step 4: 运行相关测试**

Run:
```bash
npx vitest run src/__tests__/components/chat/TypingIndicator.test.tsx
npx vitest run src/__tests__/pages/ChatDetailPage.test.tsx
```
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/components/chat/TypingIndicator.tsx src/pages/ChatDetailPage.tsx src/__tests__/components/chat/TypingIndicator.test.tsx
git commit -m "feat(ui): add typing indicator and wire it into chat detail page"
```

---

### Task 5: 更新集成测试并全量回归

**Files:**
- Create: none
- Modify: `src/__tests__/chat-flow.test.tsx`
- Test: `src/__tests__/chat-flow.test.tsx` + `npm test`

**Interfaces:**
- Consumes: `useChatStore.setReplyTimeScale(0)` 来消除测试等待
- Produces: 通过的全量测试套件

- [ ] **Step 1: 修改 `src/__tests__/chat-flow.test.tsx`**

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';
import { db } from '../db/database';
import { initializeDatabase } from '../db/init';
import { useChatStore } from '../stores/useChatStore';
import { useContactStore } from '../stores/useContactStore';
import { useAppStore } from '../stores/useAppStore';

describe('Chat Core Flow', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    await db.delete();
    await db.open();
    useChatStore.setState({
      conversations: [],
      messages: {},
      loaded: false,
      replyTimeScale: 0,
      typingConversations: {},
    });
    useContactStore.setState({ me: null, contacts: [], loaded: false });
    useAppStore.setState({
      currentTab: 'chats',
      currentPage: 'tabs',
      currentConversationId: null,
    });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
  });

  it('完整流程：进入详情、发送消息、收到 Agent 回复、返回后列表预览更新', async () => {
    // 消除随机性：让 mom 一定会回复
    await db.contacts.where('id').equals('mom').modify((contact) => {
      contact.persona.behavior.readButNoReplyChance = 0;
    });

    render(<App />);

    // 等待聊天列表渲染
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-list-item').length).toBeGreaterThan(0);
    });

    // 点击 mom 的会话进入详情
    const momItem = screen.getAllByTestId('chat-list-item').find((el) =>
      el.textContent?.includes('王阿姨')
    );
    expect(momItem).toBeDefined();
    fireEvent.click(momItem!);
    await waitFor(() => {
      expect(screen.getByTestId('chat-detail-page')).toBeInTheDocument();
    });

    // 发送新消息
    fireEvent.change(screen.getByTestId('text-input'), { target: { value: '集成测试消息' } });
    fireEvent.click(screen.getByTestId('send-button'));
    await waitFor(() => {
      expect(
        screen.getAllByTestId('message-content').some((el) => el.textContent === '集成测试消息')
      ).toBe(true);
    });

    // 等待 Agent 回复出现（timeScale=0，很快）
    await waitFor(() => {
      expect(screen.getAllByTestId('message-content').length).toBeGreaterThan(3);
    });

    // 返回列表
    fireEvent.click(screen.getByTestId('header-back'));
    await waitFor(() => {
      expect(screen.getByTestId('chat-page')).toBeInTheDocument();
    });

    // 列表最后消息预览更新为 Agent 回复或用户消息
    await waitFor(() => {
      expect(screen.getByText('集成测试消息')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: 运行集成测试**

Run: `npx vitest run src/__tests__/chat-flow.test.tsx`
Expected: PASS

- [ ] **Step 3: 运行全量测试**

Run: `npm test`
Expected: 0 失败

- [ ] **Step 4: 运行构建检查**

Run: `npm run build`
Expected: 构建成功，无类型错误

- [ ] **Step 5: 提交并打 Sprint 2 标签**

```bash
git add src/__tests__/chat-flow.test.tsx
git commit -m "test: update chat flow integration test for agent reply and timeScale"
git tag sprint-2-complete
```

---

## Self-Review

**1. Spec coverage:**

| Spec 要求 | 对应 Task |
|---|---|
| Agent 回复引擎 | Task 2 |
| `GenerateReplyInput` / `ReplyPlan` 类型 | Task 1 |
| 消息状态 sending → sent → delivered → read | Task 3 |
| "对方正在输入…" | Task 4 |
| 未读数/会话预览更新 | Task 3 |
| `timeScale` 测试支持 | Task 1-3, 5 |
| 集成测试更新 | Task 5 |

无遗漏。

**2. Placeholder scan:**

- 无 TBD/TODO。
- 每个 Task 都包含完整代码、运行命令、预期结果、提交命令。
- 无"适当处理"式模糊描述。

**3. Type consistency:**

- `ReplyPlan` 字段在 Task 1 定义，Task 2 生成，Task 3 消费，名称一致。
- `useChatStore` 新增字段 `replyTimeScale`、`typingConversations` 在 Task 3 定义，Task 4/5 使用，命名一致。
- `generateReply` 输入输出签名在 Task 1/2/3 中一致。

Plan passes self-review.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-12-wechat-solo-sprint2-agent-engine.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

Which approach do you prefer?
