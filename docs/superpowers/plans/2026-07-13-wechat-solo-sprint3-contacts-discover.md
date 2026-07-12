# WeChat Solo Sprint 3 实现计划：通讯录与发现页

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现高保真通讯录列表/搜索/字母索引、好友资料页、发现页入口、朋友圈列表/点赞/评论，并把子页面统一纳入轻量页面栈。

**Architecture:** 先改造底层路由栈与数据 store，再自下而上搭建可复用 UI 组件，最后补全页面级测试与回归测试。所有状态变更均同步写入 IndexedDB。

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Zustand + Dexie.js + vitest + pinyin-pro

## Global Constraints

- 不引入真实图片上传、图片查看器、群聊、标签管理、深色模式。
- 点赞/评论必须持久化到 IndexedDB，刷新不丢失。
- 子页面统一从右向左滑入/滑出。
- 测试先行：每个 Task 先写/改测试，再实现，测试通过后再提交。
- 所有新增代码均需中文注释。
- 当前分支：`feat/sprint3-contacts-discover`。

---

## 文件结构总览

| 文件 | 职责 |
|------|------|
| `src/stores/useAppStore.ts` | 维护页面栈 `pageStack`，提供 push/pop/导航 action。 |
| `src/App.tsx` | 根据栈顶 route 渲染页面，处理滑入/滑出动画。 |
| `src/utils/id.ts` | 唯一 ID 生成器，复用于消息、评论、动态。 |
| `src/stores/useContactStore.ts` | 加载联系人、提供搜索与筛选。 |
| `src/stores/useMomentStore.ts` | 加载朋友圈、点赞、评论。 |
| `src/components/contacts/AlphabetIndex.tsx` | 右侧 A-Z 字母索引。 |
| `src/components/contacts/ContactListSection.tsx` | 按字母分组渲染联系人。 |
| `src/components/contacts/ContactTopEntries.tsx` | 顶部“新的朋友/群聊/标签”占位入口。 |
| `src/pages/ContactsPage.tsx` | 通讯录整页。 |
| `src/pages/ContactDetailPage.tsx` | 好友资料页。 |
| `src/pages/DiscoverPage.tsx` | 发现页入口矩阵。 |
| `src/components/moments/MomentImageGrid.tsx` | 朋友圈图片网格。 |
| `src/components/moments/MomentCard.tsx` | 单条朋友圈卡片。 |
| `src/components/moments/MomentCoverHeader.tsx` | 朋友圈封面区 + 我的头像昵称。 |
| `src/components/moments/BottomInputSheet.tsx` | 底部评论输入弹层。 |
| `src/pages/MomentsPage.tsx` | 朋友圈列表页。 |
| `src/data/seed.ts` | 增加带图片的朋友圈动态。 |
| `src/__tests__/AppRouting.test.tsx` | 页面栈路由测试。 |
| `src/__tests__/pages/ContactsPage.test.tsx` | 通讯录页面测试。 |
| `src/__tests__/pages/ContactDetailPage.test.tsx` | 资料页测试。 |
| `src/__tests__/pages/DiscoverPage.test.tsx` | 发现页测试。 |
| `src/__tests__/pages/MomentsPage.test.tsx` | 朋友圈页面测试。 |
| `src/__tests__/stores/momentStore.test.ts` | 朋友圈 store 测试。 |

---

### Task 1: 页面栈路由改造

**Files:**
- Modify: `src/stores/useAppStore.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: 无
- Produces:
  - `PageRoute` 联合类型
  - `useAppStore` 新增 `pageStack`, `pushPage`, `popPage`, `navigateToChatDetail`, `navigateToContactDetail`, `navigateToMoments`, `navigateBackToTabs`

- [ ] **Step 1: 改写 `useAppStore.ts`**

```typescript
import { create } from 'zustand';

type Tab = 'chats' | 'contacts' | 'discover' | 'me';

export type PageRoute =
  | { type: 'tabs' }
  | { type: 'chat-detail'; conversationId: string }
  | { type: 'contact-detail'; contactId: string }
  | { type: 'moments' };

interface AppState {
  currentTab: Tab;
  pageStack: PageRoute[];
  setCurrentTab: (tab: Tab) => void;
  pushPage: (route: PageRoute) => void;
  popPage: () => void;
  navigateToChatDetail: (conversationId: string) => void;
  navigateToContactDetail: (contactId: string) => void;
  navigateToMoments: () => void;
  navigateBackToTabs: () => void;
}

// 应用全局状态：底部 tab + 页面路由栈
export const useAppStore = create<AppState>((set) => ({
  currentTab: 'chats',
  pageStack: [{ type: 'tabs' }],

  setCurrentTab: (tab) => set({ currentTab: tab }),

  pushPage: (route) =>
    set((state) => ({
      pageStack: [...state.pageStack, route],
    })),

  popPage: () =>
    set((state) => ({
      pageStack: state.pageStack.length > 1 ? state.pageStack.slice(0, -1) : state.pageStack,
    })),

  navigateToChatDetail: (conversationId) =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'chat-detail', conversationId }],
    })),

  navigateToContactDetail: (contactId) =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'contact-detail', contactId }],
    })),

  navigateToMoments: () =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'moments' }],
    })),

  navigateBackToTabs: () => set({ pageStack: [{ type: 'tabs' }] }),
}));
```

- [ ] **Step 2: 改写 `App.tsx`**

```tsx
import { useEffect } from 'react';
import { TabBar } from './components/common/TabBar';
import { ChatPage } from './pages/ChatPage';
import { ChatDetailPage } from './pages/ChatDetailPage';
import { ContactsPage } from './pages/ContactsPage';
import { ContactDetailPage } from './pages/ContactDetailPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { MomentsPage } from './pages/MomentsPage';
import { MePage } from './pages/MePage';
import { useAppStore } from './stores/useAppStore';
import { useContactStore } from './stores/useContactStore';
import { useChatStore } from './stores/useChatStore';

const tabPages = {
  chats: ChatPage,
  contacts: ContactsPage,
  discover: DiscoverPage,
  me: MePage,
};

function App() {
  const currentTab = useAppStore((state) => state.currentTab);
  const pageStack = useAppStore((state) => state.pageStack);
  const topRoute = pageStack[pageStack.length - 1];
  const isTabLayerActive = topRoute.type === 'tabs';
  const TabPage = tabPages[currentTab];

  const loadContacts = useContactStore((state) => state.loadContacts);
  const loadChats = useChatStore((state) => state.loadChats);
  const contactsLoaded = useContactStore((state) => state.loaded);
  const chatsLoaded = useChatStore((state) => state.loaded);

  useEffect(() => {
    if (!contactsLoaded) loadContacts();
    if (!chatsLoaded) loadChats();
  }, [contactsLoaded, loadContacts, chatsLoaded, loadChats]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
      <div className="relative mx-auto max-w-phone h-full overflow-hidden bg-wechat-bg shadow-xl">
        {/* Tab 页面层 */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            isTabLayerActive ? 'translate-x-0' : '-translate-x-full'
          }`}
          data-testid="tab-layer"
        >
          <TabPage />
          <TabBar />
        </div>

        {/* 子页面层：栈顶非 tabs 时渲染 */}
        {topRoute.type !== 'tabs' && (
          <div
            className="absolute inset-0 transition-transform duration-300 ease-in-out translate-x-0"
            data-testid="detail-layer"
          >
            {topRoute.type === 'chat-detail' && <ChatDetailPage />}
            {topRoute.type === 'contact-detail' && <ContactDetailPage />}
            {topRoute.type === 'moments' && <MomentsPage />}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 3: 更新 `ChatDetailPage` 以使用页面栈**

`src/pages/ChatDetailPage.tsx` 原依赖 `currentConversationId`，现改为从 `pageStack` 栈顶读取：

```tsx
const conversationId = useAppStore((state) => {
  const top = state.pageStack[state.pageStack.length - 1];
  return top?.type === 'chat-detail' ? top.conversationId : null;
});
```

其余逻辑不变。

- [ ] **Step 4: 更新 `useChatStore` 的当前会话判断**

`src/stores/useChatStore.ts` 中 `receiveAgentReply` 原本读取 `currentConversationId`。改为读取 `pageStack` 栈顶：

```typescript
const topRoute = useAppStore.getState().pageStack.at(-1);
const isCurrent = topRoute?.type === 'chat-detail' && topRoute.conversationId === conversationId;
```

删除所有对 `useAppStore.getState().currentConversationId` 的引用。

- [ ] **Step 5: 验证类型**

Run: `npx tsc -b`
Expected: 无错误（路由测试会在 Task 2 更新）。

- [ ] **Step 6: 提交**

```bash
git add src/stores/useAppStore.ts src/App.tsx src/pages/ChatDetailPage.tsx src/stores/useChatStore.ts
git commit -m "feat(routing): 轻量级页面栈，支持 chat-detail/contact-detail/moments"
```

---

### Task 2: 更新路由测试

**Files:**
- Modify: `src/__tests__/AppRouting.test.tsx`

**Interfaces:**
- Consumes: `useAppStore` 的 `pageStack` 初始状态
- Produces: 通过 `data-testid` 断言页面栈行为

- [ ] **Step 1: 更新测试文件**

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';
import { db } from '../db/database';
import { initializeDatabase } from '../db/init';
import { useChatStore } from '../stores/useChatStore';
import { useContactStore } from '../stores/useContactStore';
import { useAppStore } from '../stores/useAppStore';

describe('App Routing', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    await db.delete();
    await db.open();
    useChatStore.setState({ conversations: [], messages: {}, loaded: false });
    useContactStore.setState({ me: null, contacts: [], loaded: false });
    useAppStore.setState({ currentTab: 'chats', pageStack: [{ type: 'tabs' }] });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
  });

  it('默认显示 tab 层', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-layer')).toHaveClass('translate-x-0');
    });
  });

  it('从聊天列表进入详情页后 tab 层滑出', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-list-item')[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('chat-list-item')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('tab-layer')).toHaveClass('-translate-x-full');
      expect(screen.getByTestId('detail-layer')).toBeInTheDocument();
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
    });
  });
});
```

- [ ] **Step 2: 运行测试**

Run: `npm test -- src/__tests__/AppRouting.test.tsx`
Expected: 3 passed

- [ ] **Step 3: 提交**

```bash
git add src/__tests__/AppRouting.test.tsx
git commit -m "test(routing): 更新路由测试适配页面栈"
```

---

### Task 3: 添加拼音库与统一 ID 生成器

**Files:**
- Modify: `package.json`
- Create: `src/utils/id.ts`
- Modify: `src/data/seed.ts`
- Modify: `src/stores/useChatStore.ts`

**Interfaces:**
- Consumes: 无
- Produces: `makeId(prefix: string): string`, 后续用于评论/动态 ID

- [ ] **Step 1: 安装依赖**

Run: `npm install pinyin-pro`

- [ ] **Step 2: 创建 `src/utils/id.ts`**

```typescript
const counters: Record<string, number> = {};

// 生成带前缀的递增唯一 ID，用于 seed 数据与运行时评论/动态
export function makeId(prefix: string): string {
  const next = (counters[prefix] ?? 0) + 1;
  counters[prefix] = next;
  return `${prefix}-${next}`;
}

// 生成带时间戳与随机后缀的消息 ID
export function makeMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
```

- [ ] **Step 3: 更新 `src/data/seed.ts`**

替换本地 `makeId` 为从 `src/utils/id.ts` 导入：

```typescript
import type { Me, Contact, Conversation, Message, Moment, AgentPersona } from '../types';
import { makeId } from '../utils/id';
```

删除文件中旧的 `idCounters` 与 `makeId` 函数定义。

- [ ] **Step 4: 更新 `src/stores/useChatStore.ts`**

替换本地 `makeMessageId`：

```typescript
import { makeMessageId } from '../utils/id';
```

删除文件中旧的 `makeMessageId` 函数。

- [ ] **Step 5: 运行测试**

Run: `npm test`
Expected: 全部通过

- [ ] **Step 6: 提交**

```bash
git add package.json package-lock.json src/utils/id.ts src/data/seed.ts src/stores/useChatStore.ts
git commit -m "chore(deps): 添加 pinyin-pro，提取统一 ID 生成器"
```

---

### Task 4: 扩展联系人 Store 搜索能力

**Files:**
- Modify: `src/stores/useContactStore.ts`

**Interfaces:**
- Consumes: `Contact`, `pinyin-pro`
- Produces: `searchKeyword`, `setSearchKeyword`, `filteredContacts`

- [ ] **Step 1: 改写 store**

```typescript
import { create } from 'zustand';
import type { Contact, Me } from '../types';
import { db } from '../db/database';
import { pinyin } from 'pinyin-pro';

interface ContactState {
  me: Me | null;
  contacts: Contact[];
  loaded: boolean;
  searchKeyword: string;
  loadContacts: () => Promise<void>;
  setSearchKeyword: (keyword: string) => void;
}

// 判断联系人是否匹配搜索关键词：支持中文包含、拼音首字母、全拼
function contactMatches(contact: Contact, keyword: string): boolean {
  if (!keyword) return true;
  const lowerKeyword = keyword.toLowerCase();
  const name = contact.name;

  if (name.includes(keyword)) return true;

  const firstLetters = pinyin(name, { pattern: 'first', toneType: 'none', type: 'string' });
  if (firstLetters.toLowerCase().includes(lowerKeyword)) return true;

  const fullPinyin = pinyin(name, { toneType: 'none', type: 'string' });
  if (fullPinyin.toLowerCase().includes(lowerKeyword)) return true;

  return false;
}

// 联系人状态：从 IndexedDB 加载当前用户与联系人列表，支持搜索
export const useContactStore = create<ContactState>((set, get) => ({
  me: null,
  contacts: [],
  loaded: false,
  searchKeyword: '',

  loadContacts: async () => {
    const me = await db.me.get('me');
    const contacts = await db.contacts.toArray();
    set({ me: me ?? null, contacts, loaded: true });
  },

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
}));

// 按搜索关键词过滤后的联系人列表
export function selectFilteredContacts(state: ContactState): Contact[] {
  const keyword = state.searchKeyword.trim();
  if (!keyword) return state.contacts;
  return state.contacts.filter((contact) => contactMatches(contact, keyword));
}
```

- [ ] **Step 2: 更新联系人 store 测试**

Modify `src/__tests__/stores/contactStore.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useContactStore, selectFilteredContacts } from '../../stores/useContactStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('useContactStore', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useContactStore.setState({ me: null, contacts: [], loaded: false, searchKeyword: '' });
  });

  it('从数据库加载联系人', async () => {
    await initializeDatabase();
    await useContactStore.getState().loadContacts();

    expect(useContactStore.getState().contacts).toHaveLength(5);
    expect(useContactStore.getState().loaded).toBe(true);
    expect(useContactStore.getState().me).not.toBeNull();
  });

  it('搜索中文名字', async () => {
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    useContactStore.setState({ searchKeyword: '王' });
    const filtered = selectFilteredContacts(useContactStore.getState());
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('王阿姨');
  });

  it('搜索拼音首字母', async () => {
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    useContactStore.setState({ searchKeyword: 'wa' });
    const filtered = selectFilteredContacts(useContactStore.getState());
    expect(filtered.some((c) => c.name === '王阿姨')).toBe(true);
  });
});
```

- [ ] **Step 3: 运行测试**

Run: `npm test -- src/__tests__/stores/contactStore.test.ts`
Expected: 3 passed

- [ ] **Step 4: 提交**

```bash
git add src/stores/useContactStore.ts src/__tests__/stores/contactStore.test.ts
git commit -m "feat(contacts): 联系人 Store 支持中文与拼音首字母搜索"
```

---

### Task 5: 扩展朋友圈 Store 点赞/评论能力

**Files:**
- Modify: `src/stores/useMomentStore.ts`

**Interfaces:**
- Consumes: `Moment`, `db.moments`, `makeId`
- Produces: `toggleLike(momentId)`, `addComment(momentId, content)`

- [ ] **Step 1: 改写 store**

```typescript
import { create } from 'zustand';
import type { Moment } from '../types';
import { db } from '../db/database';
import { makeId } from '../utils/id';

interface MomentState {
  moments: Moment[];
  loaded: boolean;
  loadMoments: () => Promise<void>;
  toggleLike: (momentId: string) => Promise<void>;
  addComment: (momentId: string, content: string) => Promise<void>;
}

// 朋友圈状态：加载动态、点赞、评论
export const useMomentStore = create<MomentState>((set) => ({
  moments: [],
  loaded: false,

  loadMoments: async () => {
    const moments = await db.moments.toArray();
    set({ moments, loaded: true });
  },

  toggleLike: async (momentId) => {
    const moment = await db.moments.get(momentId);
    if (!moment) return;

    const hasLiked = moment.likes.some((like) => like.contactId === 'me');
    const nextLikes = hasLiked
      ? moment.likes.filter((like) => like.contactId !== 'me')
      : [...moment.likes, { contactId: 'me', createdAt: Date.now() }];

    await db.moments.update(momentId, { likes: nextLikes });

    set((state) => ({
      moments: state.moments.map((m) =>
        m.id === momentId ? { ...m, likes: nextLikes } : m
      ),
    }));
  },

  addComment: async (momentId, content) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const moment = await db.moments.get(momentId);
    if (!moment) return;

    const newComment = {
      id: makeId('comment'),
      contactId: 'me',
      content: trimmed,
      createdAt: Date.now(),
    };
    const nextComments = [...moment.comments, newComment];

    await db.moments.update(momentId, { comments: nextComments });

    set((state) => ({
      moments: state.moments.map((m) =>
        m.id === momentId ? { ...m, comments: nextComments } : m
      ),
    }));
  },
}));
```

- [ ] **Step 2: 更新朋友圈 store 测试**

Modify `src/__tests__/stores/momentStore.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useMomentStore } from '../../stores/useMomentStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('useMomentStore', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useMomentStore.setState({ moments: [], loaded: false });
  });

  it('从数据库加载朋友圈动态', async () => {
    await initializeDatabase();
    await useMomentStore.getState().loadMoments();

    expect(useMomentStore.getState().moments).toHaveLength(3);
    expect(useMomentStore.getState().loaded).toBe(true);
  });

  it('点赞后 likes 包含 me，再点取消', async () => {
    await initializeDatabase();
    await useMomentStore.getState().loadMoments();
    const momentId = useMomentStore.getState().moments[0].id;

    await useMomentStore.getState().toggleLike(momentId);
    expect(useMomentStore.getState().moments[0].likes.some((l) => l.contactId === 'me')).toBe(true);

    await useMomentStore.getState().toggleLike(momentId);
    expect(useMomentStore.getState().moments[0].likes.some((l) => l.contactId === 'me')).toBe(false);
  });

  it('评论后 comments 追加', async () => {
    await initializeDatabase();
    await useMomentStore.getState().loadMoments();
    const momentId = useMomentStore.getState().moments[0].id;

    await useMomentStore.getState().addComment(momentId, '测试评论');
    const comments = useMomentStore.getState().moments[0].comments;
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe('测试评论');
    expect(comments[0].contactId).toBe('me');
  });
});
```

- [ ] **Step 3: 运行测试**

Run: `npm test -- src/__tests__/stores/momentStore.test.ts`
Expected: 4 passed

- [ ] **Step 4: 提交**

```bash
git add src/stores/useMomentStore.ts src/__tests__/stores/momentStore.test.ts
git commit -m "feat(moments): Store 支持点赞与评论持久化"
```

---

### Task 6: 更新 Seed 数据增加带图动态

**Files:**
- Modify: `src/data/seed.ts`

**Interfaces:**
- Consumes: `makeId`
- Produces: 更多 `Moment` 示例，部分含 `images`

- [ ] **Step 1: 在 seedMoments 中追加带图动态**

保留原 3 条，追加 1-2 条：

```typescript
export const seedMoments: Moment[] = [
  // ... 原有 3 条保持不变 ...
  {
    id: makeId('moment'),
    authorId: 'mom',
    content: '周末晒晒被子，舒服。☀️',
    images: ['placeholder', 'placeholder'],
    createdAt: BASE_TIME - 1000 * 60 * 60 * 12,
    likes: [],
    comments: [],
  },
  {
    id: makeId('moment'),
    authorId: 'boss',
    content: '团队本周目标明确，高效执行。',
    images: ['placeholder'],
    createdAt: BASE_TIME - 1000 * 60 * 60 * 36,
    likes: [{ contactId: 'lisa', createdAt: BASE_TIME - 1000 * 60 * 60 * 30 }],
    comments: [],
  },
];
```

说明：`images` 数组里的字符串仅用于占位计数，实际渲染时 `MomentImageGrid` 会用纯色块显示。

- [ ] **Step 2: 更新 seed 测试预期**

Modify `src/__tests__/data/seed.test.ts` 中的动态数量断言，从 3 改为 5（如该文件存在对应断言）。

- [ ] **Step 3: 运行测试**

Run: `npm test -- src/__tests__/data/seed.test.ts src/__tests__/stores/momentStore.test.ts`
Expected: 全部通过

- [ ] **Step 4: 提交**

```bash
git add src/data/seed.ts src/__tests__/data/seed.test.ts
git commit -m "data(seed): 增加带图片占位的朋友圈动态"
```

---

### Task 7: 实现通讯录页面

**Files:**
- Create: `src/components/contacts/AlphabetIndex.tsx`
- Create: `src/components/contacts/ContactListSection.tsx`
- Create: `src/components/contacts/ContactTopEntries.tsx`
- Modify: `src/pages/ContactsPage.tsx`

**Interfaces:**
- Consumes: `useContactStore`, `selectFilteredContacts`, `useAppStore.navigateToContactDetail`
- Produces: 可点击的通讯录列表

- [ ] **Step 1: 创建 `AlphabetIndex.tsx`**

```tsx
import { cn } from '../../utils/cn';

interface AlphabetIndexProps {
  letters: string[];
  activeLetter?: string;
  onLetterClick: (letter: string) => void;
}

// 右侧字母索引条
export function AlphabetIndex({ letters, activeLetter, onLetterClick }: AlphabetIndexProps) {
  return (
    <div
      className="fixed right-1 top-1/2 -translate-y-1/2 flex flex-col items-center py-2 text-xs text-wechat-text-secondary z-20"
      data-testid="alphabet-index"
    >
      {letters.map((letter) => (
        <button
          key={letter}
          onClick={() => onLetterClick(letter)}
          className={cn(
            'w-5 h-5 flex items-center justify-center rounded-full',
            activeLetter === letter ? 'bg-wechat-green text-white' : 'text-wechat-text-secondary'
          )}
          data-testid={`letter-${letter}`}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 创建 `ContactListSection.tsx`**

```tsx
import type { Contact } from '../../types';

interface ContactListSectionProps {
  letter: string;
  contacts: Contact[];
  onContactClick: (contactId: string) => void;
}

// 按字母分组的联系人列表区段
export function ContactListSection({ letter, contacts, onContactClick }: ContactListSectionProps) {
  return (
    <div data-testid={`contact-section-${letter}`}>
      <div className="px-4 py-1 text-sm text-wechat-text-secondary bg-wechat-bg sticky top-12" data-testid="section-letter">
        {letter}
      </div>
      <div className="bg-white">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onContactClick(contact.id)}
            className="w-full flex items-center px-4 py-3 border-b border-wechat-divider last:border-b-0 active:bg-gray-100"
            data-testid="contact-list-item"
          >
            <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-md bg-gray-200 object-cover" />
            <span className="ml-3 text-base text-wechat-text-primary">{contact.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 `ContactTopEntries.tsx`**

```tsx
import { UserPlus, Users, Tag } from 'lucide-react';
import { useState } from 'react';
import { WeChatToast } from '../common/WeChatToast';

interface TopEntry {
  id: string;
  label: string;
  icon: React.ElementType;
}

const entries: TopEntry[] = [
  { id: 'new-friends', label: '新的朋友', icon: UserPlus },
  { id: 'groups', label: '群聊', icon: Users },
  { id: 'tags', label: '标签', icon: Tag },
];

// 通讯录顶部占位入口：点击提示演示模式
export function ContactTopEntries() {
  const [toastVisible, setToastVisible] = useState(false);

  return (
    <>
      <div className="bg-white divide-y divide-wechat-divider" data-testid="contact-top-entries">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.id}
              onClick={() => setToastVisible(true)}
              className="w-full flex items-center px-4 py-3 active:bg-gray-100"
              data-testid={`top-entry-${entry.id}`}
            >
              <Icon size={22} className="text-wechat-green" />
              <span className="ml-3 text-base text-wechat-text-primary">{entry.label}</span>
            </button>
          );
        })}
      </div>
      <WeChatToast
        message="演示模式 · 该功能仅供展示"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </>
  );
}
```

- [ ] **Step 4: 改写 `ContactsPage.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '../components/common/Header';
import { AlphabetIndex } from '../components/contacts/AlphabetIndex';
import { ContactListSection } from '../components/contacts/ContactListSection';
import { ContactTopEntries } from '../components/contacts/ContactTopEntries';
import { useAppStore } from '../stores/useAppStore';
import { useContactStore, selectFilteredContacts } from '../stores/useContactStore';
import { pinyin } from 'pinyin-pro';

// 获取联系人首字母分组键
function getContactLetter(contact: { name: string }): string {
  const firstLetter = pinyin(contact.name.charAt(0), { pattern: 'first', toneType: 'none', type: 'string' });
  const upper = firstLetter.charAt(0).toUpperCase();
  return /^[A-Z]$/.test(upper) ? upper : '#';
}

// 通讯录页面
export function ContactsPage() {
  const navigateToContactDetail = useAppStore((state) => state.navigateToContactDetail);
  const contacts = useContactStore((state) => state.contacts);
  const loaded = useContactStore((state) => state.loaded);
  const loadContacts = useContactStore((state) => state.loadContacts);
  const searchKeyword = useContactStore((state) => state.searchKeyword);
  const setSearchKeyword = useContactStore((state) => state.setSearchKeyword);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeLetter, setActiveLetter] = useState<string>('A');

  useEffect(() => {
    if (!loaded) loadContacts();
  }, [loaded, loadContacts]);

  const filteredContacts = useMemo(() => selectFilteredContacts({
    me: null,
    contacts,
    loaded,
    searchKeyword,
    loadContacts: async () => {},
    setSearchKeyword: () => {},
  }), [contacts, loaded, searchKeyword]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof contacts>();
    for (const contact of filteredContacts) {
      const letter = getContactLetter(contact);
      const list = map.get(letter) ?? [];
      list.push(contact);
      map.set(letter, list);
    }
    return new Map([...map.entries()].sort((a, b) => (a[0] === '#' ? 1 : b[0] === '#' ? -1 : a[0].localeCompare(b[0]))));
  }, [filteredContacts]);

  const letters = useMemo(() => Array.from(grouped.keys()), [grouped]);

  const handleLetterClick = (letter: string) => {
    const el = sectionRefs.current[letter];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveLetter(letter);
    }
  };

  return (
    <div className="min-h-screen bg-wechat-bg pb-16" data-testid="contacts-page">
      <Header title="通讯录" />
      <div className="sticky top-12 z-10 px-3 py-2 bg-wechat-bg">
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="搜索"
          className="w-full bg-white rounded-md px-3 py-2 text-sm outline-none"
          data-testid="contacts-search"
        />
      </div>
      <ContactTopEntries />
      <div className="relative">
        {Array.from(grouped.entries()).map(([letter, list]) => (
          <div
            key={letter}
            ref={(el) => { sectionRefs.current[letter] = el; }}
          >
            <ContactListSection
              letter={letter}
              contacts={list}
              onContactClick={navigateToContactDetail}
            />
          </div>
        ))}
      </div>
      {!searchKeyword && (
        <AlphabetIndex letters={letters} activeLetter={activeLetter} onLetterClick={handleLetterClick} />
      )}
    </div>
  );
}
```

说明：`selectFilteredContacts` 接收完整 state 形状；后续可改为 selector hook。当前 `useMemo` 中构造的 state 仅用于计算。

- [ ] **Step 5: 运行测试**

Run: `npm test -- src/__tests__/pages/ContactsPage.test.tsx`
Expected: 全部通过（测试在 Task 11 编写，此时可能文件不存在，可先跳过或创建空文件后补）。

更实际做法：先运行 `npm run build` 检查类型，并 `npm test` 看是否破坏现有测试。

- [ ] **Step 6: 提交**

```bash
git add src/components/contacts src/pages/ContactsPage.tsx
git commit -m "feat(contacts): 通讯录列表、搜索、字母索引与顶部入口"
```

---

### Task 8: 实现好友资料页

**Files:**
- Create: `src/pages/ContactDetailPage.tsx`

**Interfaces:**
- Consumes: `useAppStore` 的 `pageStack`, `popPage`, `pushPage`; `useContactStore`
- Produces: 只读资料展示 + 发消息跳转

- [ ] **Step 1: 创建文件**

```tsx
import { Header } from '../components/common/Header';
import { useAppStore } from '../stores/useAppStore';
import { useContactStore } from '../stores/useContactStore';
import { useChatStore } from '../stores/useChatStore';

// 好友资料页：只读展示，支持跳转聊天
export function ContactDetailPage() {
  const pageStack = useAppStore((state) => state.pageStack);
  const popPage = useAppStore((state) => state.popPage);
  const pushPage = useAppStore((state) => state.pushPage);
  const route = [...pageStack].reverse().find((r) => r.type === 'contact-detail');
  const contactId = route?.type === 'contact-detail' ? route.contactId : null;

  const contact = useContactStore((state) =>
    state.contacts.find((c) => c.id === contactId)
  );
  const conversation = useChatStore((state) =>
    state.conversations.find((c) => c.contactId === contactId)
  );

  if (!contact) return null;

  const handleSendMessage = () => {
    if (!conversation) return;
    popPage();
    pushPage({ type: 'chat-detail', conversationId: conversation.id });
  };

  return (
    <div className="min-h-screen bg-wechat-bg flex flex-col" data-testid="contact-detail-page">
      <Header title="详细资料" onBack={popPage} />
      <div className="flex-1">
        <div className="bg-white mt-2 px-4 py-4 flex items-center">
          <img
            src={contact.avatar}
            alt={contact.name}
            className="w-16 h-16 rounded-md bg-gray-200 object-cover"
          />
          <div className="ml-4 flex-1">
            <div className="text-lg font-medium text-wechat-text-primary">{contact.name}</div>
            <div className="text-sm text-wechat-text-secondary mt-1">微信号：{contact.wechatId}</div>
          </div>
        </div>

        <div className="bg-white mt-2 divide-y divide-wechat-divider">
          <div className="px-4 py-3 flex">
            <span className="text-sm text-wechat-text-secondary w-20">地区</span>
            <span className="text-sm text-wechat-text-primary flex-1">{contact.region}</span>
          </div>
          <div className="px-4 py-3 flex">
            <span className="text-sm text-wechat-text-secondary w-20">个性签名</span>
            <span className="text-sm text-wechat-text-primary flex-1">{contact.signature}</span>
          </div>
          <div className="px-4 py-3 flex">
            <span className="text-sm text-wechat-text-secondary w-20">标签</span>
            <div className="flex flex-wrap gap-2 flex-1">
              {contact.tags.length > 0 ? (
                contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-gray-100 text-wechat-text-secondary rounded"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-wechat-text-secondary">无标签</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-wechat-divider">
        <button
          onClick={handleSendMessage}
          className="w-full bg-wechat-green text-white py-2 rounded-md"
          data-testid="contact-send-message"
        >
          发消息
        </button>
      </div>
    </div>
  );
}
```

说明：`Array.prototype.findLast` 在旧浏览器可能不支持；如需兼容可改用 `slice().reverse().find`。本项目使用 Vite + 现代浏览器，可直接用。

- [ ] **Step 2: 运行构建检查**

Run: `npx tsc -b`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/pages/ContactDetailPage.tsx
git commit -m "feat(contacts): 好友资料页"
```

---

### Task 9: 实现发现页

**Files:**
- Modify: `src/pages/DiscoverPage.tsx`

**Interfaces:**
- Consumes: `useAppStore.navigateToMoments`, `WeChatToast`
- Produces: 发现页入口矩阵

- [ ] **Step 1: 改写 `DiscoverPage.tsx`**

```tsx
import { useState } from 'react';
import { Header } from '../components/common/Header';
import { WeChatToast } from '../components/common/WeChatToast';
import { useAppStore } from '../stores/useAppStore';
import { Camera, Scan, CircleDot, MapPin, ShoppingBag, Gamepad2 } from 'lucide-react';

interface DiscoverEntry {
  id: string;
  label: string;
  icon: React.ElementType;
  action: 'moments' | 'toast';
}

const entries: DiscoverEntry[] = [
  { id: 'moments', label: '朋友圈', icon: Camera, action: 'moments' },
  { id: 'scan', label: '扫一扫', icon: Scan, action: 'toast' },
  { id: 'shake', label: '摇一摇', icon: CircleDot, action: 'toast' },
  { id: 'nearby', label: '附近的人', icon: MapPin, action: 'toast' },
  { id: 'shopping', label: '购物', icon: ShoppingBag, action: 'toast' },
  { id: 'games', label: '游戏', icon: Gamepad2, action: 'toast' },
];

// 发现页：朋友圈可进入，其余入口演示模式 Toast
export function DiscoverPage() {
  const navigateToMoments = useAppStore((state) => state.navigateToMoments);
  const [toastVisible, setToastVisible] = useState(false);

  const handleClick = (entry: DiscoverEntry) => {
    if (entry.action === 'moments') {
      navigateToMoments();
    } else {
      setToastVisible(true);
    }
  };

  return (
    <div className="min-h-screen bg-wechat-bg pb-16" data-testid="discover-page">
      <Header title="发现" />
      <div className="mt-2 bg-white divide-y divide-wechat-divider">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.id}
              onClick={() => handleClick(entry)}
              className="w-full flex items-center px-4 py-3 active:bg-gray-100"
              data-testid={`discover-entry-${entry.id}`}
            >
              <Icon size={22} className="text-wechat-green" />
              <span className="ml-3 text-base text-wechat-text-primary flex-1 text-left">{entry.label}</span>
              <span className="text-wechat-text-secondary text-sm">›</span>
            </button>
          );
        })}
      </div>
      <WeChatToast
        message="演示模式 · 该功能仅供展示"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/pages/DiscoverPage.tsx
git commit -m "feat(discover): 发现页入口矩阵"
```

---

### Task 10: 实现朋友圈页面与组件

**Files:**
- Create: `src/components/moments/MomentImageGrid.tsx`
- Create: `src/components/moments/MomentCard.tsx`
- Create: `src/components/moments/MomentCoverHeader.tsx`
- Create: `src/components/moments/BottomInputSheet.tsx`
- Create: `src/pages/MomentsPage.tsx`

**Interfaces:**
- Consumes: `useMomentStore`, `useContactStore`, `useAppStore.popPage`
- Produces: 可交互朋友圈列表

- [ ] **Step 1: 创建 `MomentImageGrid.tsx`**

```tsx
interface MomentImageGridProps {
  images: string[];
}

// 朋友圈图片网格占位图
export function MomentImageGrid({ images }: MomentImageGridProps) {
  if (images.length === 0) return null;

  const gridCols = images.length === 1 ? 1 : images.length === 2 || images.length === 4 ? 2 : 3;

  return (
    <div
      className="grid gap-1 mt-2"
      style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      data-testid="moment-image-grid"
    >
      {images.map((_, index) => (
        <div
          key={index}
          className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded"
          data-testid="moment-image"
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 创建 `MomentCard.tsx`**

```tsx
import { Heart, MessageCircle } from 'lucide-react';
import type { Moment } from '../../types';
import { useContactStore } from '../../stores/useContactStore';
import { useMomentStore } from '../../stores/useMomentStore';
import { MomentImageGrid } from './MomentImageGrid';
import { formatChatTime } from '../../utils/time';
import { cn } from '../../utils/cn';

interface MomentCardProps {
  moment: Moment;
  onCommentClick: (momentId: string) => void;
}

// 单条朋友圈卡片
export function MomentCard({ moment, onCommentClick }: MomentCardProps) {
  const author = useContactStore((state) =>
    state.contacts.find((c) => c.id === moment.authorId)
  );
  const toggleLike = useMomentStore((state) => state.toggleLike);
  const contacts = useContactStore((state) => state.contacts);
  const hasLiked = moment.likes.some((like) => like.contactId === 'me');

  if (!author) return null;

  const likedNames = moment.likes
    .map((like) => {
      if (like.contactId === 'me') return '我';
      return contacts.find((c) => c.id === like.contactId)?.name ?? '';
    })
    .filter(Boolean)
    .join('、');

  return (
    <div className="px-4 py-4 border-b border-wechat-divider bg-white" data-testid="moment-card">
      <div className="flex">
        <img src={author.avatar} alt={author.name} className="w-10 h-10 rounded-md bg-gray-200 object-cover" />
        <div className="ml-3 flex-1">
          <div className="text-base font-medium text-wechat-text-primary">{author.name}</div>
          <div className="text-sm text-wechat-text-primary mt-1">{moment.content}</div>
          <MomentImageGrid images={moment.images} />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-wechat-text-secondary">{formatChatTime(moment.createdAt)}</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleLike(moment.id)}
                className={cn('flex items-center gap-1', hasLiked ? 'text-red-500' : 'text-wechat-text-secondary')}
                data-testid="moment-like-button"
              >
                <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => onCommentClick(moment.id)}
                className="flex items-center text-wechat-text-secondary"
                data-testid="moment-comment-button"
              >
                <MessageCircle size={18} />
              </button>
            </div>
          </div>

          {likedNames && (
            <div className="mt-2 text-sm text-wechat-text-primary bg-wechat-bg px-2 py-1 rounded" data-testid="moment-likes">
              <Heart size={14} className="inline text-red-500 mr-1" fill="currentColor" />
              {likedNames}
            </div>
          )}

          {moment.comments.length > 0 && (
            <div className="mt-2 bg-wechat-bg px-2 py-1 rounded" data-testid="moment-comments">
              {moment.comments.map((comment) => {
                const commenter = contacts.find((c) => c.id === comment.contactId);
                const name = comment.contactId === 'me' ? '我' : commenter?.name ?? '';
                return (
                  <div key={comment.id} className="text-sm text-wechat-text-primary">
                    <span className="font-medium">{name}</span>：{comment.content}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 `MomentCoverHeader.tsx`**

```tsx
import { ChevronLeft } from 'lucide-react';
import type { Me } from '../../types';

interface MomentCoverHeaderProps {
  me: Me | null;
  onBack: () => void;
}

// 朋友圈封面区
export function MomentCoverHeader({ me, onBack }: MomentCoverHeaderProps) {
  return (
    <div className="relative h-56 bg-gradient-to-b from-blue-300 to-blue-100" data-testid="moment-cover-header">
      <button
        onClick={onBack}
        className="absolute top-3 left-3 z-10 flex items-center text-white drop-shadow"
        data-testid="moments-back"
      >
        <ChevronLeft size={24} />
        <span className="text-sm">朋友圈</span>
      </button>
      {me && (
        <div className="absolute bottom-0 right-4 translate-y-1/2 flex items-end gap-3">
          <span className="text-white text-base font-medium drop-shadow mb-2">{me.nickname}</span>
          <img
            src={me.avatar}
            alt={me.nickname}
            className="w-16 h-16 rounded-md bg-gray-200 border-2 border-white object-cover"
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 创建 `BottomInputSheet.tsx`**

```tsx
import { useState } from 'react';

interface BottomInputSheetProps {
  visible: boolean;
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

// 底部评论输入弹层
export function BottomInputSheet({ visible, onSubmit, onCancel }: BottomInputSheetProps) {
  const [content, setContent] = useState('');

  if (!visible) return null;

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
  };

  return (
    <div className="fixed inset-0 z-50" data-testid="bottom-input-sheet">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="absolute bottom-0 left-0 right-0 bg-white p-3 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="评论"
          className="flex-1 bg-gray-100 rounded-md px-3 py-2 text-sm outline-none"
          data-testid="bottom-input"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="bg-wechat-green text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
          data-testid="bottom-input-submit"
        >
          发送
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 创建 `MomentsPage.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { MomentCoverHeader } from '../components/moments/MomentCoverHeader';
import { MomentCard } from '../components/moments/MomentCard';
import { BottomInputSheet } from '../components/moments/BottomInputSheet';
import { useAppStore } from '../stores/useAppStore';
import { useContactStore } from '../stores/useContactStore';
import { useMomentStore } from '../stores/useMomentStore';

// 朋友圈列表页
export function MomentsPage() {
  const popPage = useAppStore((state) => state.popPage);
  const me = useContactStore((state) => state.me);
  const moments = useMomentStore((state) => state.moments);
  const loaded = useMomentStore((state) => state.loaded);
  const loadMoments = useMomentStore((state) => state.loadMoments);
  const addComment = useMomentStore((state) => state.addComment);
  const [commentMomentId, setCommentMomentId] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) loadMoments();
  }, [loaded, loadMoments]);

  const handleCommentSubmit = (content: string) => {
    if (commentMomentId) {
      addComment(commentMomentId, content);
    }
    setCommentMomentId(null);
  };

  return (
    <div className="min-h-screen bg-white pb-4" data-testid="moments-page">
      <MomentCoverHeader me={me} onBack={popPage} />
      <div className="mt-10">
        {moments.map((moment) => (
          <MomentCard
            key={moment.id}
            moment={moment}
            onCommentClick={setCommentMomentId}
          />
        ))}
      </div>
      <BottomInputSheet
        visible={commentMomentId !== null}
        onSubmit={handleCommentSubmit}
        onCancel={() => setCommentMomentId(null)}
      />
    </div>
  );
}
```

- [ ] **Step 6: 在 `App.tsx` 引入 `MomentsPage`**

已存在，确认导入路径正确。

- [ ] **Step 7: 运行构建与测试**

Run: `npx tsc -b && npm test`
Expected: 类型通过，现有测试通过

- [ ] **Step 8: 提交**

```bash
git add src/components/moments src/pages/MomentsPage.tsx
git commit -m "feat(moments): 朋友圈列表、封面、点赞、评论"
```

---

### Task 11: 补充页面级测试

**Files:**
- Create: `src/__tests__/pages/ContactsPage.test.tsx`
- Create: `src/__tests__/pages/ContactDetailPage.test.tsx`
- Create: `src/__tests__/pages/DiscoverPage.test.tsx`
- Create: `src/__tests__/pages/MomentsPage.test.tsx`

**Interfaces:**
- Consumes: 页面与 store 的行为
- Produces: 覆盖核心交互的测试用例

- [ ] **Step 1: `ContactsPage.test.tsx`**

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ContactsPage } from '../../pages/ContactsPage';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { useContactStore } from '../../stores/useContactStore';
import { useAppStore } from '../../stores/useAppStore';

describe('ContactsPage', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    await db.delete();
    await db.open();
    useContactStore.setState({ me: null, contacts: [], loaded: false, searchKeyword: '' });
    useAppStore.setState({ currentTab: 'contacts', pageStack: [{ type: 'tabs' }] });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
  });

  it('渲染字母分组', async () => {
    render(<ContactsPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('section-letter').length).toBeGreaterThan(0);
    });
  });

  it('中文搜索过滤联系人', async () => {
    render(<ContactsPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('contact-list-item').length).toBeGreaterThan(1);
    });
    fireEvent.change(screen.getByTestId('contacts-search'), { target: { value: '王' } });
    await waitFor(() => {
      expect(screen.getAllByTestId('contact-list-item')).toHaveLength(1);
      expect(screen.getByText('王阿姨')).toBeInTheDocument();
    });
  });

  it('拼音首字母搜索', async () => {
    render(<ContactsPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('contact-list-item').length).toBeGreaterThan(1);
    });
    fireEvent.change(screen.getByTestId('contacts-search'), { target: { value: 'wa' } });
    await waitFor(() => {
      expect(screen.getByText('王阿姨')).toBeInTheDocument();
    });
  });

  it('点击联系人进入资料页', async () => {
    render(<ContactsPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('contact-list-item')[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('contact-list-item')[0]);
    await waitFor(() => {
      const top = useAppStore.getState().pageStack.at(-1);
      expect(top?.type).toBe('contact-detail');
    });
  });
});
```

- [ ] **Step 2: `ContactDetailPage.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ContactDetailPage } from '../../pages/ContactDetailPage';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { useContactStore } from '../../stores/useContactStore';
import { useChatStore } from '../../stores/useChatStore';
import { useAppStore } from '../../stores/useAppStore';

describe('ContactDetailPage', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useContactStore.setState({ me: null, contacts: [], loaded: false, searchKeyword: '' });
    useChatStore.setState({ conversations: [], messages: {}, loaded: false });
    useAppStore.setState({ currentTab: 'contacts', pageStack: [{ type: 'tabs' }, { type: 'contact-detail', contactId: 'mom' }] });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
  });

  it('展示联系人信息', async () => {
    render(<ContactDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('王阿姨')).toBeInTheDocument();
      expect(screen.getByText('微信号：wxid_wangayi')).toBeInTheDocument();
    });
  });

  it('点击发消息进入聊天详情', async () => {
    render(<ContactDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('contact-send-message')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('contact-send-message'));
    await waitFor(() => {
      const top = useAppStore.getState().pageStack.at(-1);
      expect(top?.type).toBe('chat-detail');
    });
  });
});
```

- [ ] **Step 3: `DiscoverPage.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DiscoverPage } from '../../pages/DiscoverPage';
import { useAppStore } from '../../stores/useAppStore';

describe('DiscoverPage', () => {
  beforeEach(() => {
    useAppStore.setState({ currentTab: 'discover', pageStack: [{ type: 'tabs' }] });
  });

  it('点击朋友圈进入朋友圈页', () => {
    render(<DiscoverPage />);
    fireEvent.click(screen.getByTestId('discover-entry-moments'));
    expect(useAppStore.getState().pageStack.at(-1)?.type).toBe('moments');
  });

  it('点击扫一扫弹出 Toast', async () => {
    render(<DiscoverPage />);
    fireEvent.click(screen.getByTestId('discover-entry-scan'));
    await waitFor(() => {
      expect(screen.getByText('演示模式 · 该功能仅供展示')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 4: `MomentsPage.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MomentsPage } from '../../pages/MomentsPage';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { useContactStore } from '../../stores/useContactStore';
import { useMomentStore } from '../../stores/useMomentStore';
import { useAppStore } from '../../stores/useAppStore';

describe('MomentsPage', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useContactStore.setState({ me: null, contacts: [], loaded: false, searchKeyword: '' });
    useMomentStore.setState({ moments: [], loaded: false });
    useAppStore.setState({ currentTab: 'discover', pageStack: [{ type: 'tabs' }, { type: 'moments' }] });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useMomentStore.getState().loadMoments();
  });

  it('渲染朋友圈动态', async () => {
    render(<MomentsPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('moment-card').length).toBeGreaterThan(0);
    });
  });

  it('点赞后显示红心', async () => {
    render(<MomentsPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('moment-like-button')[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('moment-like-button')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('moment-likes')).toHaveTextContent('我');
    });
  });

  it('评论后显示评论内容', async () => {
    render(<MomentsPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('moment-comment-button')[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('moment-comment-button')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('bottom-input-sheet')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId('bottom-input'), { target: { value: '测试评论' } });
    fireEvent.click(screen.getByTestId('bottom-input-submit'));
    await waitFor(() => {
      expect(screen.getByText('测试评论')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 5: 运行测试**

Run: `npm test`
Expected: 全部通过

- [ ] **Step 6: 提交**

```bash
git add src/__tests__/pages
git commit -m "test(sprint3): 通讯录、资料页、发现页、朋友圈页面测试"
```

---

### Task 12: 全量回归与修复

**Files:**
- 视修复情况而定

- [ ] **Step 1: 运行全量测试**

Run: `npm test`
Expected: 全部通过

- [ ] **Step 2: 运行构建**

Run: `npm run build`
Expected: 无类型错误

- [ ] **Step 3: 运行 lint**

Run: `npm run lint`
Expected: 通过

- [ ] **Step 4: 修复问题并提交**

根据测试/构建/lint 结果修复。修复后提交：

```bash
git add .
git commit -m "fix(sprint3): 回归测试与类型修复"
```

---

### Task 13: 提交 Sprint 3 总结

- [ ] **Step 1: 更新记忆文件**

更新 `C:\Users\Nan\.claude\projects\C--Users-Nan\memory\wechat-solo-sprint3-contacts-discover-2026-07-13.md`（或项目状态记忆），记录 Sprint 3 完成的功能、分支、测试数、下一步。

- [ ] **Step 2: 推送分支**

```bash
git push -u origin feat/sprint3-contacts-discover
```

- [ ] **Step 3: 告知用户完成**

汇报：功能清单、测试覆盖率、分支链接、是否合并到 master。

---

## 自检

### Spec 覆盖检查

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 轻量页面栈 | Task 1 |
| 通讯录 A-Z 分组 | Task 7 |
| 右侧字母索引 | Task 7 |
| 中文/拼音搜索 | Task 4 + Task 7 |
| 顶部占位入口 | Task 7 |
| 好友资料页 | Task 8 |
| 发现页入口矩阵 | Task 9 |
| 朋友圈封面区 | Task 10 |
| 图片网格 | Task 10 |
| 点赞/评论持久化 | Task 5 + Task 10 |
| 测试覆盖 | Task 2 + Task 11 + Task 12 |

### 无占位符检查

- 每个 Task 均包含具体文件、接口、代码与命令，无 TBD/TODO。
- 测试代码完整，无“写相关测试”之类模糊描述。

### 类型一致性检查

- `PageRoute` 在 Task 1 定义，Task 8 使用 `findLast` 读取 `contact-detail`。
- `selectFilteredContacts` 在 Task 4 导出，Task 7 使用。
- `makeId` 在 Task 3 导出，Task 5/6 使用。

---

*Plan 状态：待执行*  
*下一步：用户选择 Subagent-Driven 或 Inline Execution。*
