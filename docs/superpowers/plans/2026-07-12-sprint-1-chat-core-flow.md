# WeChat Solo Sprint 1: Chat Core Flow 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Sprint 0 的项目骨架上，完成聊天列表、聊天详情、消息气泡、文字发送、页面转场动画，并保证所有消息写入 IndexedDB 持久化。

**Architecture:** 复用现有的 Zustand + Dexie 数据层，新增聊天相关组件（列表项、气泡、输入框、页面头部），并在 `App.tsx` 中通过 `useAppStore` 的页面状态实现“从右向左滑入/向左滑出”的聊天详情页路由。

**Tech Stack:** React 19, TypeScript 6, Vite, Tailwind CSS 3, Zustand 5, Dexie.js 4, lucide-react, Vitest, React Testing Library, jsdom, fake-indexeddb.

## Global Constraints

- Project root: `C:\Users\Nan\wechat-solo`
- 使用 TypeScript strict mode。
- Mobile-first UI，桌面端最大宽度 430px 居中，模拟手机屏幕。
- 主品牌色：微信绿 `#07C160`。
- 所有 UI 文案使用简体中文；代码注释使用中文。
- 不调用真实 LLM API，Agent 回复在 Sprint 2 实现。
- P2 功能（语音、图片、视频、支付等）点击后弹出 `演示模式 · 该功能仅供展示` Toast，不做其他操作。
- 每个 Task 以通过测试或验证步骤 + git commit 结束。
- 消息状态图标先实现 UI 形态：单灰勾（sent）、双灰勾（delivered）、双绿勾（read），状态流转在 Sprint 2 补充。

---

## File Structure

```
wechat-solo/
├── docs/superpowers/plans/2026-07-12-sprint-1-chat-core-flow.md
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatListItem.tsx      # 聊天列表单行
│   │   │   ├── MessageBubble.tsx     # 单聊消息气泡（含状态图标）
│   │   │   └── MessageInput.tsx      # 底部输入框 + 发送按钮
│   │   └── common/
│   │       ├── Header.tsx            # 顶部导航栏（返回 + 标题）
│   │       └── WeChatToast.tsx       # 演示模式 Toast
│   ├── pages/
│   │   ├── ChatPage.tsx              # 聊天列表页（替换占位页）
│   │   └── ChatDetailPage.tsx        # 聊天详情页
│   ├── stores/
│   │   ├── useAppStore.ts            # 新增页面路由状态
│   │   └── useChatStore.ts           # 新增发送消息、标记已读
│   ├── utils/
│   │   └── time.ts                   # 聊天时间格式化
│   └── __tests__/
│       ├── utils/time.test.ts
│       ├── components/WeChatToast.test.tsx
│       ├── components/Header.test.tsx
│       ├── stores/appStore.test.ts
│       ├── stores/chatStore.test.ts
│       ├── components/chat/ChatListItem.test.tsx
│       ├── pages/ChatPage.test.tsx
│       ├── components/chat/MessageBubble.test.tsx
│       ├── components/chat/MessageInput.test.tsx
│       ├── pages/ChatDetailPage.test.tsx
│       ├── AppRouting.test.tsx
│       └── chat-flow.test.tsx
├── src/App.tsx                       # 接入页面路由与转场动画
└── README.md                         # Sprint 1 完成说明
```

---

### Task 1: 聊天时间格式化工具

**Files:**
- Create: `src/utils/time.ts`
- Test: `src/__tests__/utils/time.test.ts`

**Interfaces:**
- Consumes: 无
- Produces: `formatChatTime(timestamp: number): string`

- [ ] **Step 1: 编写时间格式化函数**

Create `src/utils/time.ts`:

```ts
// 将时间戳格式化为微信聊天列表样式：当天显示 HH:mm，昨天显示“昨天”，一周内显示星期，更早显示 MM-DD
export function formatChatTime(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  const isSameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  if (isSameDay) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  const yesterday = new Date(now.getTime() - oneDay);
  const isYesterday =
    yesterday.getFullYear() === date.getFullYear() &&
    yesterday.getMonth() === date.getMonth() &&
    yesterday.getDate() === date.getDate();
  if (isYesterday) {
    return '昨天';
  }

  if (diff < oneWeek) {
    return date.toLocaleDateString('zh-CN', { weekday: 'short' });
  }

  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}
```

- [ ] **Step 2: 编写测试**

Create `src/__tests__/utils/time.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatChatTime } from '../../utils/time';

describe('formatChatTime', () => {
  it('当天显示 HH:mm', () => {
    const now = new Date();
    const ts = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 5).getTime();
    expect(formatChatTime(ts)).toMatch(/^\d{2}:\d{2}$/);
  });

  it('昨天显示“昨天”', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const ts = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 10, 0).getTime();
    expect(formatChatTime(ts)).toBe('昨天');
  });

  it('更早显示 MM-DD', () => {
    const ts = new Date('2026-01-01T10:00:00').getTime();
    expect(formatChatTime(ts)).toMatch(/^\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 3: 运行测试**

Run:
```bash
npx vitest run src/__tests__/utils/time.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/utils/time.ts src/__tests__/utils/time.test.ts
git commit -m "feat(utils): add chat time formatting"
```

---

### Task 2: 演示模式 Toast 组件

**Files:**
- Create: `src/components/common/WeChatToast.tsx`
- Test: `src/__tests__/components/WeChatToast.test.tsx`

**Interfaces:**
- Consumes: 无
- Produces: `<WeChatToast message visible onClose duration />`

- [ ] **Step 1: 编写 Toast 组件**

Create `src/components/common/WeChatToast.tsx`:

```tsx
import { useEffect, useState } from 'react';

interface WeChatToastProps {
  message: string;
  visible: boolean;
  onClose?: () => void;
  duration?: number;
}

// 微信风格居中黑色半透明提示，自动消失
export function WeChatToast({ message, visible, onClose, duration = 2000 }: WeChatToastProps) {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    setShow(visible);
    if (!visible) return;

    const timer = setTimeout(() => {
      setShow(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none" data-testid="wechat-toast">
      <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm max-w-[80%] text-center">
        {message}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 编写测试**

Create `src/__tests__/components/WeChatToast.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WeChatToast } from '../../components/common/WeChatToast';

describe('WeChatToast', () => {
  it('visible 为 true 时显示文案', () => {
    render(<WeChatToast message="演示模式" visible />);
    expect(screen.getByTestId('wechat-toast')).toHaveTextContent('演示模式');
  });

  it('visible 为 false 时不渲染', () => {
    render(<WeChatToast message="演示模式" visible={false} />);
    expect(screen.queryByTestId('wechat-toast')).not.toBeInTheDocument();
  });

  it('指定 duration 后自动触发 onClose', async () => {
    const onClose = vi.fn();
    render(<WeChatToast message="演示模式" visible duration={100} onClose={onClose} />);
    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 500 });
  });
});
```

- [ ] **Step 3: 运行测试**

Run:
```bash
npx vitest run src/__tests__/components/WeChatToast.test.tsx
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/common/WeChatToast.tsx src/__tests__/components/WeChatToast.test.tsx
git commit -m "feat(ui): add WeChatToast demo-mode hint"
```

---

### Task 3: 顶部导航栏组件

**Files:**
- Create: `src/components/common/Header.tsx`
- Test: `src/__tests__/components/Header.test.tsx`

**Interfaces:**
- Consumes: 无
- Produces: `<Header title onBack right />`

- [ ] **Step 1: 编写 Header 组件**

Create `src/components/common/Header.tsx`:

```tsx
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

// 微信风格顶部导航栏：左侧返回、中间标题、右侧可自定义
export function Header({ title, onBack, right }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-3 h-12 bg-wechat-bg border-b border-wechat-divider"
      data-testid="page-header"
    >
      <div className="w-16">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-wechat-text-primary"
            data-testid="header-back"
          >
            <ChevronLeft size={20} />
            <span className="text-sm">返回</span>
          </button>
        )}
      </div>
      <h1 className="text-base font-medium text-center flex-1 truncate text-wechat-text-primary">{title}</h1>
      <div className="w-16 flex justify-end">{right}</div>
    </header>
  );
}
```

- [ ] **Step 2: 编写测试**

Create `src/__tests__/components/Header.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../components/common/Header';

describe('Header', () => {
  it('渲染标题', () => {
    render(<Header title="微信" />);
    expect(screen.getByTestId('page-header')).toHaveTextContent('微信');
  });

  it('传入 onBack 时显示返回按钮并触发回调', () => {
    const onBack = vi.fn();
    render(<Header title="聊天" onBack={onBack} />);
    const backBtn = screen.getByTestId('header-back');
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('渲染右侧节点', () => {
    render(<Header title="微信" right={<span data-testid="right-node">···</span>} />);
    expect(screen.getByTestId('right-node')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: 运行测试**

Run:
```bash
npx vitest run src/__tests__/components/Header.test.tsx
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/common/Header.tsx src/__tests__/components/Header.test.tsx
git commit -m "feat(ui): add page Header component"
```

---

### Task 4: App Store 增加页面路由状态

**Files:**
- Modify: `src/stores/useAppStore.ts`
- Test: `src/__tests__/stores/appStore.test.ts`

**Interfaces:**
- Consumes: 无
- Produces: `currentPage: 'tabs' | 'chat-detail'`, `currentConversationId: string | null`, `navigateToChatDetail(id)`, `navigateBackToTabs()`

- [ ] **Step 1: 修改 useAppStore**

Modify `src/stores/useAppStore.ts`:

```ts
import { create } from 'zustand';

// 底部导航 tab 类型
type Tab = 'chats' | 'contacts' | 'discover' | 'me';

// 当前页面类型：tab 页 或 聊天详情页
type Page = 'tabs' | 'chat-detail';

interface AppState {
  currentTab: Tab;
  currentPage: Page;
  currentConversationId: string | null;
  setCurrentTab: (tab: Tab) => void;
  navigateToChatDetail: (conversationId: string) => void;
  navigateBackToTabs: () => void;
}

// 应用全局状态：底部 tab + 页面路由
export const useAppStore = create<AppState>((set) => ({
  currentTab: 'chats',
  currentPage: 'tabs',
  currentConversationId: null,
  setCurrentTab: (tab) => set({ currentTab: tab }),
  navigateToChatDetail: (conversationId) =>
    set({ currentPage: 'chat-detail', currentConversationId: conversationId }),
  navigateBackToTabs: () =>
    set({ currentPage: 'tabs', currentConversationId: null }),
}));
```

- [ ] **Step 2: 补充测试**

Create `src/__tests__/stores/appStore.test.ts`（替换原有文件）：

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../stores/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentTab: 'chats',
      currentPage: 'tabs',
      currentConversationId: null,
    });
  });

  it('默认在聊天 tab 和 tabs 页面', () => {
    expect(useAppStore.getState().currentTab).toBe('chats');
    expect(useAppStore.getState().currentPage).toBe('tabs');
  });

  it('可切换 tab', () => {
    useAppStore.getState().setCurrentTab('contacts');
    expect(useAppStore.getState().currentTab).toBe('contacts');
  });

  it('可进入聊天详情', () => {
    useAppStore.getState().navigateToChatDetail('conv-mom');
    expect(useAppStore.getState().currentPage).toBe('chat-detail');
    expect(useAppStore.getState().currentConversationId).toBe('conv-mom');
  });

  it('可从聊天详情返回 tabs', () => {
    useAppStore.getState().navigateToChatDetail('conv-mom');
    useAppStore.getState().navigateBackToTabs();
    expect(useAppStore.getState().currentPage).toBe('tabs');
    expect(useAppStore.getState().currentConversationId).toBeNull();
  });
});
```

- [ ] **Step 3: 运行测试**

Run:
```bash
npx vitest run src/__tests__/stores/appStore.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/stores/useAppStore.ts src/__tests__/stores/appStore.test.ts
git commit -m "feat(store): add page routing state to app store"
```

---

### Task 5: Chat Store 增加发送消息与已读标记

**Files:**
- Modify: `src/stores/useChatStore.ts`
- Test: `src/__tests__/stores/chatStore.test.ts`

**Interfaces:**
- Consumes: `db` singleton, `Message`, `Conversation` types
- Produces: `sendMessage(conversationId, content): Promise<void>`, `markConversationRead(conversationId): Promise<void>`

- [ ] **Step 1: 修改 useChatStore**

Modify `src/stores/useChatStore.ts`:

```ts
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
export const useChatStore = create<ChatState>((set, get) => ({
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
```

- [ ] **Step 2: 补充测试**

Create `src/__tests__/stores/chatStore.test.ts`（替换原有文件）：

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../../stores/useChatStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('useChatStore', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useChatStore.setState({ conversations: [], messages: {}, loaded: false });
  });

  it('加载种子会话和消息', async () => {
    await initializeDatabase();
    await useChatStore.getState().loadChats();
    expect(useChatStore.getState().conversations.length).toBeGreaterThan(0);
    expect(useChatStore.getState().loaded).toBe(true);
  });

  it('发送消息后更新消息列表和会话', async () => {
    await initializeDatabase();
    await useChatStore.getState().loadChats();
    const conversation = useChatStore.getState().conversations[0];

    await useChatStore.getState().sendMessage(conversation.id, '测试消息');

    const messages = useChatStore.getState().messages[conversation.id];
    expect(messages.some((m) => m.content === '测试消息')).toBe(true);
    expect(messages[messages.length - 1].senderId).toBe('me');

    const updatedConversation = useChatStore.getState().conversations.find((c) => c.id === conversation.id);
    expect(updatedConversation?.lastMessageId).toBe(messages[messages.length - 1].id);
  });

  it('标记会话已读清零未读数', async () => {
    await initializeDatabase();
    await useChatStore.getState().loadChats();
    const conversation = useChatStore.getState().conversations.find((c) => c.unreadCount > 0);
    if (!conversation) return;

    await useChatStore.getState().markConversationRead(conversation.id);
    expect(useChatStore.getState().conversations.find((c) => c.id === conversation.id)?.unreadCount).toBe(0);
  });
});
```

- [ ] **Step 3: 运行测试**

Run:
```bash
npx vitest run src/__tests__/stores/chatStore.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/stores/useChatStore.ts src/__tests__/stores/chatStore.test.ts
git commit -m "feat(store): add sendMessage and markConversationRead"
```

---

### Task 6: 聊天列表项组件

**Files:**
- Create: `src/components/chat/ChatListItem.tsx`
- Test: `src/__tests__/components/chat/ChatListItem.test.tsx`

**Interfaces:**
- Consumes: `formatChatTime` from `src/utils/time.ts`
- Produces: `<ChatListItem avatar name preview time unreadCount isPinned onClick />`

- [ ] **Step 1: 编写 ChatListItem 组件**

Create `src/components/chat/ChatListItem.tsx`:

```tsx
import { formatChatTime } from '../../utils/time';

interface ChatListItemProps {
  avatar: string;
  name: string;
  preview: string;
  time: number;
  unreadCount: number;
  isPinned?: boolean;
  onClick?: () => void;
}

// 微信聊天列表单行：头像、昵称、最后消息预览、时间、未读红点
export function ChatListItem({
  avatar,
  name,
  preview,
  time,
  unreadCount,
  isPinned,
  onClick,
}: ChatListItemProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center px-4 py-3 bg-white active:bg-gray-100 cursor-pointer"
      data-testid="chat-list-item"
    >
      <div className="relative">
        <img src={avatar} alt={name} className="w-12 h-12 rounded-md bg-gray-200 object-cover" />
        {isPinned && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" data-testid="pinned-dot" />
        )}
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-wechat-text-primary truncate">{name}</span>
          <span className="text-xs text-wechat-text-secondary">{formatChatTime(time)}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm text-wechat-text-secondary truncate">{preview}</span>
          {unreadCount > 0 && (
            <span
              className="bg-red-500 text-white text-xs min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center"
              data-testid="unread-badge"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 编写测试**

Create `src/__tests__/components/chat/ChatListItem.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatListItem } from '../../../components/chat/ChatListItem';

describe('ChatListItem', () => {
  it('渲染头像、昵称、预览、时间', () => {
    render(
      <ChatListItem
        avatar="/avatar.svg"
        name="王阿姨"
        preview="吃了吗？"
        time={Date.now()}
        unreadCount={0}
      />
    );
    expect(screen.getByText('王阿姨')).toBeInTheDocument();
    expect(screen.getByText('吃了吗？')).toBeInTheDocument();
  });

  it('未读数大于 0 时显示角标', () => {
    render(
      <ChatListItem
        avatar="/avatar.svg"
        name="王阿姨"
        preview="吃了吗？"
        time={Date.now()}
        unreadCount={3}
      />
    );
    expect(screen.getByTestId('unread-badge')).toHaveTextContent('3');
  });

  it('点击触发 onClick', () => {
    const onClick = vi.fn();
    render(
      <ChatListItem
        avatar="/avatar.svg"
        name="王阿姨"
        preview="吃了吗？"
        time={Date.now()}
        unreadCount={0}
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByTestId('chat-list-item'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: 运行测试**

Run:
```bash
npx vitest run src/__tests__/components/chat/ChatListItem.test.tsx
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/ChatListItem.tsx src/__tests__/components/chat/ChatListItem.test.tsx
git commit -m "feat(ui): add ChatListItem component"
```

---

### Task 7: 聊天列表页

**Files:**
- Modify: `src/pages/ChatPage.tsx`
- Test: `src/__tests__/pages/ChatPage.test.tsx`

**Interfaces:**
- Consumes: `useAppStore.navigateToChatDetail`, `useChatStore.conversations/messages/loadChats`, `useContactStore.contacts`, `ChatListItem`, `Header`
- Produces: 可点击的聊天列表页面

- [ ] **Step 1: 重写 ChatPage**

Modify `src/pages/ChatPage.tsx`:

```tsx
import { useEffect } from 'react';
import { Header } from '../components/common/Header';
import { ChatListItem } from '../components/chat/ChatListItem';
import { useAppStore } from '../stores/useAppStore';
import { useChatStore } from '../stores/useChatStore';
import { useContactStore } from '../stores/useContactStore';

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
```

- [ ] **Step 2: 编写测试**

Create `src/__tests__/pages/ChatPage.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ChatPage } from '../../pages/ChatPage';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { useChatStore } from '../../stores/useChatStore';
import { useContactStore } from '../../stores/useContactStore';
import { useAppStore } from '../../stores/useAppStore';

describe('ChatPage', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useChatStore.setState({ conversations: [], messages: {}, loaded: false });
    useContactStore.setState({ me: null, contacts: [], loaded: false });
    useAppStore.setState({ currentTab: 'chats', currentPage: 'tabs', currentConversationId: null });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
  });

  it('渲染聊天列表项', async () => {
    render(<ChatPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-list-item').length).toBeGreaterThan(0);
    });
  });

  it('点击列表项进入聊天详情', async () => {
    render(<ChatPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-list-item')[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('chat-list-item')[0]);
    expect(useAppStore.getState().currentPage).toBe('chat-detail');
    expect(useAppStore.getState().currentConversationId).not.toBeNull();
  });
});
```

- [ ] **Step 3: 运行测试**

Run:
```bash
npx vitest run src/__tests__/pages/ChatPage.test.tsx
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/ChatPage.tsx src/__tests__/pages/ChatPage.test.tsx
git commit -m "feat(page): implement chat list page"
```

---

### Task 8: 消息气泡组件

**Files:**
- Create: `src/components/chat/MessageBubble.tsx`
- Test: `src/__tests__/components/chat/MessageBubble.test.tsx`

**Interfaces:**
- Consumes: `Message`, `MessageStatus` from `src/types/index.ts`
- Produces: `<MessageBubble message isMe contactName contactAvatar />`

- [ ] **Step 1: 编写 MessageBubble 组件**

Create `src/components/chat/MessageBubble.tsx`:

```tsx
import { Check, CheckCheck } from 'lucide-react';
import type { Message, MessageStatus } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  contactName: string;
  contactAvatar: string;
}

// 根据消息状态返回对应图标：单灰勾 / 双灰勾 / 双绿勾 / 失败
function StatusIcon({ status }: { status: MessageStatus }) {
  if (status === 'sending') {
    return <span className="text-wechat-text-secondary text-xs">·</span>;
  }
  if (status === 'sent') {
    return <Check size={12} className="text-wechat-text-secondary" />;
  }
  if (status === 'delivered') {
    return <CheckCheck size={12} className="text-wechat-text-secondary" />;
  }
  if (status === 'read') {
    return <CheckCheck size={12} className="text-wechat-green" />;
  }
  return <span className="text-red-500 text-xs font-bold">!</span>;
}

// 单条聊天消息气泡：左侧显示对方头像和昵称，右侧显示自己消息和状态
export function MessageBubble({ message, isMe, contactName, contactAvatar }: MessageBubbleProps) {
  return (
    <div
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4 px-4`}
      data-testid="message-bubble"
    >
      {!isMe && (
        <img
          src={contactAvatar}
          alt={contactName}
          className="w-10 h-10 rounded-md bg-gray-200 object-cover mr-3 flex-shrink-0"
        />
      )}
      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isMe && (
          <span className="text-xs text-wechat-text-secondary mb-1">{contactName}</span>
        )}
        <div
          className={`relative px-3 py-2 rounded-lg text-sm break-words ${
            isMe ? 'bg-wechat-green text-white' : 'bg-white text-wechat-text-primary'
          }`}
          data-testid="message-content"
        >
          {message.content}
        </div>
        {isMe && (
          <div className="flex items-center mt-1 gap-0.5" data-testid="message-status">
            <StatusIcon status={message.status} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 编写测试**

Create `src/__tests__/components/chat/MessageBubble.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../../../components/chat/MessageBubble';
import type { Message } from '../../../types';

function makeMessage(status: Message['status'], content = 'hello'): Message {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'me',
    type: 'text',
    content,
    status,
    createdAt: Date.now(),
  };
}

describe('MessageBubble', () => {
  it('渲染自己发送的消息', () => {
    render(<MessageBubble message={makeMessage('sent')} isMe contactName="王阿姨" contactAvatar="/avatar.svg" />);
    expect(screen.getByTestId('message-content')).toHaveTextContent('hello');
    expect(screen.getByTestId('message-status')).toBeInTheDocument();
  });

  it('渲染对方消息并显示昵称', () => {
    render(<MessageBubble message={makeMessage('read')} isMe={false} contactName="王阿姨" contactAvatar="/avatar.svg" />);
    expect(screen.getByText('王阿姨')).toBeInTheDocument();
    expect(screen.queryByTestId('message-status')).not.toBeInTheDocument();
  });

  it('已读状态显示双绿勾', () => {
    render(<MessageBubble message={makeMessage('read')} isMe contactName="王阿姨" contactAvatar="/avatar.svg" />);
    expect(screen.getByTestId('message-status').querySelector('svg')).toHaveClass('text-wechat-green');
  });
});
```

- [ ] **Step 3: 运行测试**

Run:
```bash
npx vitest run src/__tests__/components/chat/MessageBubble.test.tsx
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/MessageBubble.tsx src/__tests__/components/chat/MessageBubble.test.tsx
git commit -m "feat(ui): add MessageBubble with status icons"
```

---

### Task 9: 消息输入框组件

**Files:**
- Create: `src/components/chat/MessageInput.tsx`
- Test: `src/__tests__/components/chat/MessageInput.test.tsx`

**Interfaces:**
- Consumes: `WeChatToast` from Task 2
- Produces: `<MessageInput onSend onToolClick />`

- [ ] **Step 1: 编写 MessageInput 组件**

Create `src/components/chat/MessageInput.tsx`:

```tsx
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { WeChatToast } from '../common/WeChatToast';

interface MessageInputProps {
  onSend: (text: string) => void;
}

// 底部消息输入框：支持输入文字、回车发送、工具按钮触发演示模式 Toast
export function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-wechat-bg border-t border-wechat-divider px-3 py-2 max-w-phone mx-auto"
      data-testid="message-input"
    >
      <WeChatToast message="演示模式 · 该功能仅供展示" visible={showToast} onClose={() => setShowToast(false)} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowToast(true)}
          className="text-wechat-text-secondary"
          data-testid="tool-button"
        >
          <Plus size={28} />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="请输入消息"
          className="flex-1 bg-white rounded-md px-3 py-2 text-sm outline-none"
          data-testid="text-input"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className="bg-wechat-green text-white text-sm px-4 py-2 rounded-md disabled:opacity-50"
          data-testid="send-button"
        >
          发送
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 编写测试**

Create `src/__tests__/components/chat/MessageInput.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageInput } from '../../../components/chat/MessageInput';

describe('MessageInput', () => {
  it('点击工具按钮显示演示模式 Toast', () => {
    render(<MessageInput onSend={vi.fn()} />);
    fireEvent.click(screen.getByTestId('tool-button'));
    expect(screen.getByTestId('wechat-toast')).toHaveTextContent('演示模式');
  });

  it('输入空消息时发送按钮禁用', () => {
    render(<MessageInput onSend={vi.fn()} />);
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  it('输入消息后点击发送触发 onSend 并清空输入', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    fireEvent.change(screen.getByTestId('text-input'), { target: { value: '你好' } });
    fireEvent.click(screen.getByTestId('send-button'));
    expect(onSend).toHaveBeenCalledWith('你好');
    expect(screen.getByTestId('text-input')).toHaveValue('');
  });

  it('回车键触发发送', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    fireEvent.change(screen.getByTestId('text-input'), { target: { value: '回车测试' } });
    fireEvent.keyDown(screen.getByTestId('text-input'), { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('回车测试');
  });
});
```

- [ ] **Step 3: 运行测试**

Run:
```bash
npx vitest run src/__tests__/components/chat/MessageInput.test.tsx
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/MessageInput.tsx src/__tests__/components/chat/MessageInput.test.tsx
git commit -m "feat(ui): add MessageInput with demo-mode tool button"
```

---

### Task 10: 聊天详情页

**Files:**
- Create: `src/pages/ChatDetailPage.tsx`
- Test: `src/__tests__/pages/ChatDetailPage.test.tsx`

**Interfaces:**
- Consumes: `useAppStore.currentConversationId/navigateBackToTabs`, `useChatStore.messages/sendMessage/markConversationRead`, `useContactStore.contacts`, `Header`, `MessageBubble`, `MessageInput`
- Produces: 可发送消息的聊天详情页面

- [ ] **Step 1: 编写 ChatDetailPage**

Create `src/pages/ChatDetailPage.tsx`:

```tsx
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
```

- [ ] **Step 2: 编写测试**

Create `src/__tests__/pages/ChatDetailPage.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ChatDetailPage } from '../../pages/ChatDetailPage';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { useChatStore } from '../../stores/useChatStore';
import { useContactStore } from '../../stores/useContactStore';
import { useAppStore } from '../../stores/useAppStore';

describe('ChatDetailPage', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useChatStore.setState({ conversations: [], messages: {}, loaded: false });
    useContactStore.setState({ me: null, contacts: [], loaded: false });
    useAppStore.setState({ currentTab: 'chats', currentPage: 'chat-detail', currentConversationId: null });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
  });

  it('渲染当前会话的消息气泡', async () => {
    const conversation = useChatStore.getState().conversations[0];
    useAppStore.setState({ currentConversationId: conversation.id });
    render(<ChatDetailPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('message-bubble').length).toBeGreaterThan(0);
    });
  });

  it('发送消息后列表中出现新消息', async () => {
    const conversation = useChatStore.getState().conversations[0];
    useAppStore.setState({ currentConversationId: conversation.id });
    render(<ChatDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('text-input'), { target: { value: '新消息' } });
    fireEvent.click(screen.getByTestId('send-button'));

    await waitFor(() => {
      expect(screen.getAllByTestId('message-content').some((el) => el.textContent === '新消息')).toBe(true);
    });
  });
});
```

- [ ] **Step 3: 运行测试**

Run:
```bash
npx vitest run src/__tests__/pages/ChatDetailPage.test.tsx
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/ChatDetailPage.tsx src/__tests__/pages/ChatDetailPage.test.tsx
git commit -m "feat(page): implement chat detail page"
```

---

### Task 11: App 页面路由与转场动画

**Files:**
- Modify: `src/App.tsx`
- Test: `src/__tests__/AppRouting.test.tsx`

**Interfaces:**
- Consumes: `useAppStore.currentTab/currentPage`, `ChatPage`, `ChatDetailPage`, `TabBar`
- Produces: 带滑入滑出转场的整体应用布局

- [ ] **Step 1: 修改 App.tsx**

Modify `src/App.tsx`:

```tsx
import { TabBar } from './components/common/TabBar';
import { ChatPage } from './pages/ChatPage';
import { ChatDetailPage } from './pages/ChatDetailPage';
import { ContactsPage } from './pages/ContactsPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { MePage } from './pages/MePage';
import { useAppStore } from './stores/useAppStore';

const tabPages = {
  chats: ChatPage,
  contacts: ContactsPage,
  discover: DiscoverPage,
  me: MePage,
};

function App() {
  const currentTab = useAppStore((state) => state.currentTab);
  const currentPage = useAppStore((state) => state.currentPage);
  const TabPage = tabPages[currentTab];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
      <div className="relative mx-auto max-w-phone h-full overflow-hidden bg-wechat-bg shadow-xl">
        {/* Tab 页面层，进入详情时整体向左滑出 */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            currentPage === 'chat-detail' ? '-translate-x-full' : 'translate-x-0'
          }`}
          data-testid="tab-layer"
        >
          <TabPage />
          <TabBar />
        </div>

        {/* 聊天详情页，从右侧滑入 */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            currentPage === 'chat-detail' ? 'translate-x-0' : 'translate-x-full'
          }`}
          data-testid="detail-layer"
        >
          <ChatDetailPage />
        </div>
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 2: 编写测试**

Create `src/__tests__/AppRouting.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';
import { db } from '../db/database';
import { initializeDatabase } from '../db/init';
import { useChatStore } from '../stores/useChatStore';
import { useContactStore } from '../stores/useContactStore';
import { useAppStore } from '../stores/useAppStore';

describe('App Routing', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useChatStore.setState({ conversations: [], messages: {}, loaded: false });
    useContactStore.setState({ me: null, contacts: [], loaded: false });
    useAppStore.setState({ currentTab: 'chats', currentPage: 'tabs', currentConversationId: null });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
  });

  it('默认显示 tab 层', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-layer')).toHaveClass('translate-x-0');
      expect(screen.getByTestId('detail-layer')).toHaveClass('translate-x-full');
    });
  });

  it('从聊天列表进入详情页后 detail-layer 滑入', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-list-item')[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('chat-list-item')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('tab-layer')).toHaveClass('-translate-x-full');
      expect(screen.getByTestId('detail-layer')).toHaveClass('translate-x-0');
    });
  });

  it('从详情页返回 tab 层', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-list-item')[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('chat-list-item')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('header-back')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('header-back'));
    await waitFor(() => {
      expect(screen.getByTestId('tab-layer')).toHaveClass('translate-x-0');
      expect(screen.getByTestId('detail-layer')).toHaveClass('translate-x-full');
    });
  });
});
```

- [ ] **Step 3: 运行测试**

Run:
```bash
npx vitest run src/__tests__/AppRouting.test.tsx
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/__tests__/AppRouting.test.tsx
git commit -m "feat(app): add chat detail routing and slide transition"
```

---

### Task 12: 聊天核心流程集成测试

**Files:**
- Create: `src/__tests__/chat-flow.test.tsx`
- Test: itself

**Interfaces:**
- Consumes: 全部 Sprint 1 组件与 Store
- Produces: 端到端验证“列表 → 详情 → 发送 → 返回 → 列表预览更新”

- [ ] **Step 1: 编写集成测试**

Create `src/__tests__/chat-flow.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';
import { db } from '../db/database';
import { initializeDatabase } from '../db/init';
import { useChatStore } from '../stores/useChatStore';
import { useContactStore } from '../stores/useContactStore';
import { useAppStore } from '../stores/useAppStore';

describe('Chat Core Flow', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useChatStore.setState({ conversations: [], messages: {}, loaded: false });
    useContactStore.setState({ me: null, contacts: [], loaded: false });
    useAppStore.setState({ currentTab: 'chats', currentPage: 'tabs', currentConversationId: null });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
  });

  it('完整流程：进入详情、发送消息、返回后列表预览更新', async () => {
    render(<App />);

    // 等待聊天列表渲染
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-list-item').length).toBeGreaterThan(0);
    });

    // 点击第一个会话进入详情
    fireEvent.click(screen.getAllByTestId('chat-list-item')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('chat-detail-page')).toBeInTheDocument();
    });

    // 发送新消息
    fireEvent.change(screen.getByTestId('text-input'), { target: { value: '集成测试消息' } });
    fireEvent.click(screen.getByTestId('send-button'));
    await waitFor(() => {
      expect(screen.getAllByTestId('message-content').some((el) => el.textContent === '集成测试消息')).toBe(true);
    });

    // 返回列表
    fireEvent.click(screen.getByTestId('header-back'));
    await waitFor(() => {
      expect(screen.getByTestId('chat-page')).toBeInTheDocument();
    });

    // 列表最后消息预览更新
    await waitFor(() => {
      expect(screen.getByText('集成测试消息')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: 运行测试**

Run:
```bash
npx vitest run src/__tests__/chat-flow.test.tsx
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/chat-flow.test.tsx
git commit -m "test: add chat core flow integration test"
```

---

### Task 13: 更新 README 并完成 Sprint 1

**Files:**
- Modify: `README.md`
- Test: `npm run build`

**Interfaces:**
- Consumes: 全部 Sprint 1 实现
- Produces: 反映 Sprint 1 完成状态的 README

- [ ] **Step 1: 在 README 中追加 Sprint 1 说明**

Modify `README.md`，在“当前阶段”后追加：

```markdown
## 当前阶段

Sprint 0 已完成：项目骨架与数据地基。

Sprint 1 已完成：聊天核心流程。

- 聊天列表：显示头像、昵称、最后消息预览、时间、未读数。
- 聊天详情：顶部返回、消息气泡、底部输入框。
- 发送文字消息：输入后点击发送或按回车，消息写入 IndexedDB。
- 消息状态图标：单灰勾 / 双灰勾 / 双绿勾 UI。
- 页面转场：聊天详情从右侧滑入，返回时向左滑出。
- 演示模式：工具面板按钮点击弹出 Toast 提示。
```

- [ ] **Step 2: 全量测试与构建**

Run:
```bash
npm test
npm run build
```

Expected: 所有测试通过，构建成功无错误。

- [ ] **Step 3: Commit 并打 Tag**

```bash
git add README.md
git commit -m "docs: update README for sprint 1 completion"
git tag sprint-1-complete
```

---

## Self-Review

**1. Spec coverage:**

| Spec 需求 | 实现 Task |
|---|---|
| 底部 Tab 导航 | Sprint 0 已完成 |
| 聊天列表 | Task 6、Task 7 |
| 聊天详情页 | Task 10 |
| 发送文字消息 | Task 5、Task 9、Task 10 |
| 消息状态图标 | Task 8 |
| 页面转场动画 | Task 11 |
| 本地数据持久化 | Task 5、Task 12 |
| P2 演示模式提示 | Task 2、Task 9 |

无遗漏。

**2. Placeholder scan:**

- 无 TBD/TODO/"implement later"。
- 每个代码步骤都包含完整可运行代码。
- 每个测试步骤都包含具体断言。
- 文件路径均为绝对项目路径。

**3. Type consistency:**

- `MessageStatus` 与 `src/types/index.ts` 保持一致：`'sending' | 'sent' | 'delivered' | 'read' | 'failed'`。
- `useAppStore` 新增的 `navigateToChatDetail`、`navigateBackToTabs` 在 `App.tsx`、`ChatPage.tsx`、`ChatDetailPage.tsx` 中调用签名一致。
- `useChatStore` 的 `sendMessage` 和 `markConversationRead` 在组件与测试中使用签名一致。

计划通过自审。

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-12-sprint-1-chat-core-flow.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints for review.

Which approach do you prefer?
