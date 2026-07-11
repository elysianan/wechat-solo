# WeChat Solo Sprint 0: Project Skeleton & Data Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a working React + TypeScript project with Tailwind styling, IndexedDB persistence via Dexie, Zustand state management, and seed data for the WeChat Solo MVP.

**Architecture:** A Vite-based React SPA using Tailwind CSS for WeChat-style UI, Zustand for client-side state, Dexie.js for IndexedDB persistence, and a seed-data module that initializes a believable offline social graph on first launch.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS 3, Zustand, Dexie.js, lucide-react, Vitest, React Testing Library, jsdom.

## Global Constraints

- Project root: `C:\Users\Nan\wechat-solo`
- Use TypeScript strict mode.
- Mobile-first UI, max-width 430px centered on desktop to mimic a phone screen.
- Primary brand color: WeChat green `#07C160`.
- All UI text in Simplified Chinese; code comments in Chinese.
- No real LLM API calls; Agent replies are rule-driven from seed configuration.
- Data persists in browser IndexedDB via Dexie; no backend.
- P2 features (voice/video/scan/pay actions) show a "演示模式" toast and do nothing else.
- Every task ends with a passing test or verification step and a git commit.

---

## File Structure

```
wechat-solo/
├── docs/superpowers/specs/2026-07-12-wechat-solo-design.md
├── docs/superpowers/plans/2026-07-12-sprint-0-project-skeleton.md
├── public/
├── src/
│   ├── __tests__/
│   │   └── startup.test.tsx
│   ├── agents/
│   │   └── types.ts
│   ├── components/
│   │   └── common/
│   │       └── TabBar.tsx
│   ├── data/
│   │   └── seed.ts
│   ├── db/
│   │   ├── database.ts
│   │   └── init.ts
│   ├── stores/
│   │   ├── useAppStore.ts
│   │   ├── useContactStore.ts
│   │   ├── useChatStore.ts
│   │   └── useMomentStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

---

### Task 1: Initialize Vite project and configure Tailwind

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`
- Create: `tailwind.config.js`, `postcss.config.js`, `src/index.css`
- Modify: none
- Test: `src/__tests__/render.test.tsx`

**Interfaces:**
- Consumes: none
- Produces: A runnable Vite + React + TS project with Tailwind configured.

- [ ] **Step 1: Scaffold Vite project**

Run:
```bash
cd C:\Users\Nan
npm create vite@latest wechat-solo -- --template react-ts
cd wechat-solo
```

Expected: Project created with `src/App.tsx`, `src/main.tsx`, etc.

- [ ] **Step 2: Install Tailwind CSS and PostCSS**

Run:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Expected: `tailwind.config.js` and `postcss.config.js` created.

- [ ] **Step 3: Configure Tailwind with WeChat green**

Create `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wechat: {
          green: '#07C160',
          'green-dark': '#06ad56',
          bg: '#EDEDED',
          'text-primary': '#000000',
          'text-secondary': '#888888',
          divider: '#E5E5E5',
        }
      },
      maxWidth: {
        'phone': '430px',
      }
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Add Tailwind directives to CSS**

Create `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-100;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

#root {
  @apply mx-auto max-w-phone min-h-screen bg-white shadow-xl;
}
```

- [ ] **Step 5: Replace default App with minimal layout**

Create `src/App.tsx`:
```tsx
function App() {
  return (
    <div className="min-h-screen bg-wechat-bg flex items-center justify-center">
      <h1 className="text-wechat-green text-2xl font-bold">WeChat Solo</h1>
    </div>
  );
}

export default App;
```

- [ ] **Step 6: Write failing render test**

Create `src/__tests__/render.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders WeChat Solo title', () => {
    render(<App />);
    expect(screen.getByText('WeChat Solo')).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Install testing dependencies and run test**

Run:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
```

Create `src/__tests__/setup.ts`:
```ts
import '@testing-library/jest-dom';
```

Run:
```bash
npx vitest run src/__tests__/render.test.tsx
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "chore: initialize vite + react + ts + tailwind project"
```

---

### Task 2: Install runtime dependencies

**Files:**
- Modify: `package.json`
- Test: `src/__tests__/deps.test.ts`

**Interfaces:**
- Consumes: Task 1 project scaffold
- Produces: `package.json` with Zustand, Dexie, lucide-react, clsx, tailwind-merge.

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install zustand dexie lucide-react clsx tailwind-merge
```

- [ ] **Step 2: Write test verifying imports**

Create `src/__tests__/deps.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('runtime dependencies', () => {
  it('can import zustand', async () => {
    const zustand = await import('zustand');
    expect(zustand.create).toBeDefined();
  });

  it('can import dexie', async () => {
    const dexie = await import('dexie');
    expect(dexie.Dexie).toBeDefined();
  });

  it('can import lucide-react', async () => {
    const lucide = await import('lucide-react');
    expect(lucide.MessageCircle).toBeDefined();
  });
});
```

- [ ] **Step 3: Run test**

```bash
npx vitest run src/__tests__/deps.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: add zustand, dexie, lucide-react, clsx, tailwind-merge"
```

---

### Task 3: Create directory structure and core TypeScript types

**Files:**
- Create directories: `src/agents`, `src/components/common`, `src/data`, `src/db`, `src/stores`, `src/types`, `src/__tests__`
- Create: `src/types/index.ts`
- Test: `src/__tests__/types.test.ts`

**Interfaces:**
- Consumes: Task 1 project scaffold
- Produces: Core domain types used by seed data, DB, and stores.

- [ ] **Step 1: Create directories**

Run:
```bash
mkdir -p src/agents src/components/common src/data src/db src/stores src/types src/__tests__
```

- [ ] **Step 2: Define core types**

Create `src/types/index.ts`:
```ts
// 当前登录用户
export interface Me {
  id: 'me';
  nickname: string;
  avatar: string;
  wechatId: string;
  region: string;
  signature: string;
}

// 消息类型
export type MessageType = 'text' | 'image' | 'voice' | 'redpacket' | 'transfer' | 'location';

// 消息状态
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// 消息
export interface Message {
  id: string;
  conversationId: string;
  senderId: 'me' | string;
  type: MessageType;
  content: string;
  status: MessageStatus;
  createdAt: number;
  replyTo?: {
    messageId: string;
    senderName: string;
    content: string;
  };
}

// 会话类型
export type ConversationType = 'single' | 'group';

// 会话
export interface Conversation {
  id: string;
  type: ConversationType;
  contactId?: string;
  lastMessageId: string;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  updatedAt: number;
}

// 朋友圈点赞
export interface Like {
  contactId: string;
  createdAt: number;
}

// 朋友圈评论
export interface Comment {
  id: string;
  contactId: string;
  content: string;
  createdAt: number;
}

// 朋友圈动态
export interface Moment {
  id: string;
  authorId: string;
  content: string;
  images: string[];
  createdAt: number;
  likes: Like[];
  comments: Comment[];
}

// 应用设置
export interface AppSettings {
  darkMode: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  version: string;
}

// Agent 回复触发条件
export interface ReplyTrigger {
  keywords?: string[];
  patterns?: RegExp[];
  context?: string[];
  default?: boolean;
}

// Agent 回复规则
export interface ReplyRule {
  id: string;
  triggers: ReplyTrigger;
  responses: string[];
  weight: number;
  maxUsageInSession?: number;
}

// Agent 行为参数
export interface AgentBehavior {
  replyDelayMin: number;
  replyDelayMax: number;
  typingIndicatorChance: number;
  readButNoReplyChance: number;
  multiMessageChance: number;
  emojiChance: number;
}

// Agent 人设
export interface AgentPersona {
  id: string;
  name: string;
  avatar: string;
  wechatId: string;
  region: string;
  signature: string;
  tags: string[];
  behavior: AgentBehavior;
  rules: ReplyRule[];
}

// 联系人
export interface Contact {
  id: string;
  name: string;
  avatar: string;
  wechatId: string;
  region: string;
  signature: string;
  tags: string[];
  persona: AgentPersona;
  isOnline: boolean;
}
```

- [ ] **Step 3: Write type validation test**

Create `src/__tests__/types.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import type { Me, Contact, AgentPersona, Conversation, Message, Moment, AppSettings } from '../types';

describe('core types', () => {
  it('Me type accepts valid object', () => {
    const me: Me = {
      id: 'me',
      nickname: '我',
      avatar: '/avatar-me.png',
      wechatId: 'wxid_me',
      region: '中国',
      signature: '生活明朗，万物可爱',
    };
    expect(me.id).toBe('me');
  });

  it('AgentPersona type accepts valid object', () => {
    const persona: AgentPersona = {
      id: 'mom',
      name: '王阿姨',
      avatar: '/avatar-mom.png',
      wechatId: 'wxid_mom',
      region: '中国',
      signature: '家和万事兴',
      tags: ['家人'],
      behavior: {
        replyDelayMin: 1000,
        replyDelayMax: 3000,
        typingIndicatorChance: 0.7,
        readButNoReplyChance: 0.05,
        multiMessageChance: 0.3,
        emojiChance: 0.6,
      },
      rules: [
        {
          id: 'mom-food',
          triggers: { keywords: ['吃', '饭'] },
          responses: ['吃了吗？'],
          weight: 1,
        },
      ],
    };
    expect(persona.name).toBe('王阿姨');
  });

  it('Message type requires status', () => {
    const message: Message = {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'me',
      type: 'text',
      content: 'hello',
      status: 'sent',
      createdAt: Date.now(),
    };
    expect(message.status).toBe('sent');
  });
});
```

- [ ] **Step 4: Run test**

```bash
npx vitest run src/__tests__/types.test.ts
```

Expected: PASS (type errors surface as compile errors, test runtime passes)

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(types): add core domain types"
```

---

### Task 4: Create Agent types re-export

**Files:**
- Create: `src/agents/types.ts`
- Test: `src/__tests__/agents/types.test.ts`

**Interfaces:**
- Consumes: Task 3 core types
- Produces: `src/agents/types.ts` re-exports Agent types for convenient imports by the reply engine.

- [ ] **Step 1: Create re-export file**

Create `src/agents/types.ts`:
```ts
export type {
  AgentPersona,
  AgentBehavior,
  ReplyRule,
  ReplyTrigger,
} from '../types';
```

- [ ] **Step 2: Write re-export test**

Create `src/__tests__/agents/types.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import type { AgentPersona } from '../../agents/types';

describe('agents/types re-export', () => {
  it('can import AgentPersona from agents/types', () => {
    const persona: AgentPersona = {
      id: 'mom',
      name: '王阿姨',
      avatar: '/avatar-mom.png',
      wechatId: 'wxid_mom',
      region: '中国',
      signature: '家和万事兴',
      tags: ['家人'],
      behavior: {
        replyDelayMin: 1000,
        replyDelayMax: 3000,
        typingIndicatorChance: 0.7,
        readButNoReplyChance: 0.05,
        multiMessageChance: 0.3,
        emojiChance: 0.6,
      },
      rules: [
        {
          id: 'mom-food',
          triggers: { keywords: ['吃', '饭'] },
          responses: ['吃了吗？'],
          weight: 1,
        },
      ],
    };
    expect(persona.name).toBe('王阿姨');
  });
});
```
      name: '王阿姨',
      avatar: '/avatar-mom.png',
      wechatId: 'wxid_mom',
      region: '中国',
      signature: '家和万事兴',
      tags: ['家人'],
      behavior: {
        replyDelayMin: 1000,
        replyDelayMax: 3000,
        typingIndicatorChance: 0.7,
        readButNoReplyChance: 0.05,
        multiMessageChance: 0.3,
        emojiChance: 0.6,
      },
      rules: [
        {
          id: 'mom-food',
          triggers: { keywords: ['吃', '饭'] },
          responses: ['吃了吗？'],
          weight: 1,
        },
      ],
    };
    expect(mom.name).toBe('王阿姨');
  });
});
```

- [ ] **Step 3: Run test**

```bash
npx vitest run src/__tests__/agents/types.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(agents): add AgentPersona and ReplyRule types"
```

---

### Task 5: Create seed data module

**Files:**
- Create: `src/data/seed.ts`
- Test: `src/__tests__/data/seed.test.ts`

**Interfaces:**
- Consumes: `Me` from `src/types/index.ts`, `AgentPersona` from `src/agents/types.ts`
- Produces: `seedMe`, `seedContacts`, `seedConversations`, `seedMessages`, `seedMoments` arrays.

- [ ] **Step 1: Create Me seed**

Create `src/data/seed.ts` (initial content):
```ts
import type { Me } from '../types';

export const seedMe: Me = {
  id: 'me',
  nickname: '我',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
  wechatId: 'wxid_me_2026',
  region: '中国 上海',
  signature: '保持热爱，奔赴山海',
};
```

- [ ] **Step 2: Add Agent personas and contacts**

Extend `src/data/seed.ts`:
```ts
import type { Me, Contact, Conversation, Message, Moment, AgentPersona } from '../types';

// ... seedMe above

export const seedPersonas: AgentPersona[] = [
  {
    id: 'mom',
    name: '王阿姨',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mom',
    wechatId: 'wxid_wangayi',
    region: '中国 杭州',
    signature: '家和万事兴',
    tags: ['家人'],
    behavior: {
      replyDelayMin: 1000,
      replyDelayMax: 3000,
      typingIndicatorChance: 0.7,
      readButNoReplyChance: 0.05,
      multiMessageChance: 0.3,
      emojiChance: 0.6,
    },
    rules: [
      {
        id: 'mom-food',
        triggers: { keywords: ['吃', '饭', '外卖', '饿'] },
        responses: [
          '吃了吗？别总点外卖，不健康。',
          '今天有没有好好吃饭？妈妈给你寄点腊肉？',
          '外卖油太大，自己做点简单的。',
        ],
        weight: 1,
      },
      {
        id: 'mom-weather',
        triggers: { keywords: ['冷', '热', '下雨', '天气'] },
        responses: [
          '今天降温了，记得多穿点衣服，别感冒了。🧣',
          '出门带伞，别淋雨。',
        ],
        weight: 1,
      },
      {
        id: 'mom-default',
        triggers: { default: true },
        responses: [
          '你最近忙不忙？要注意身体。',
          '什么时候回家看看？',
          '妈妈给你转了一篇养生文章，记得看。',
        ],
        weight: 0.5,
      },
    ],
  },
  {
    id: 'boss',
    name: '张总',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=boss',
    wechatId: 'wxid_bosszhang',
    region: '中国 北京',
    signature: '高效执行',
    tags: ['同事'],
    behavior: {
      replyDelayMin: 2000,
      replyDelayMax: 5000,
      typingIndicatorChance: 0,
      readButNoReplyChance: 0.1,
      multiMessageChance: 0,
      emojiChance: 0,
    },
    rules: [
      {
        id: 'boss-work',
        triggers: { keywords: ['方案', '报告', '进度', '项目'] },
        responses: [
          '方案今晚发我。',
          '这个需求优先级调高，明天对一下。',
          '进度怎么样了？',
        ],
        weight: 1,
      },
      {
        id: 'boss-default',
        triggers: { default: true },
        responses: [
          '收到。',
          '嗯。',
          '尽快处理。',
        ],
        weight: 1,
      },
    ],
  },
  {
    id: 'buddy',
    name: '阿杰',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=buddy',
    wechatId: 'wxid_ajie',
    region: '中国 上海',
    signature: '及时行乐',
    tags: ['朋友'],
    behavior: {
      replyDelayMin: 500,
      replyDelayMax: 2000,
      typingIndicatorChance: 0.4,
      readButNoReplyChance: 0.05,
      multiMessageChance: 0.4,
      emojiChance: 0.7,
    },
    rules: [
      {
        id: 'buddy-game',
        triggers: { keywords: ['游戏', '开黑', '峡谷', '王者'] },
        responses: [
          '兄弟，晚上峡谷见？',
          '等我，马上上线！',
          '今天带你飞。',
        ],
        weight: 1,
      },
      {
        id: 'buddy-food',
        triggers: { keywords: ['吃', '饭', '火锅', '烧烤'] },
        responses: [
          '周末火锅安排一下，我请客（你付钱）',
          '烧烤还是火锅？你选。',
        ],
        weight: 1,
      },
      {
        id: 'buddy-default',
        triggers: { default: true },
        responses: [
          '哈哈哈哈哈哈哈哈',
          '你又加班？资本家看了都流泪',
          '兄弟666',
        ],
        weight: 1,
      },
    ],
  },
  {
    id: 'lisa',
    name: 'Lisa',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
    wechatId: 'wxid_lisa',
    region: '中国 上海',
    signature: '慢慢来',
    tags: ['同事'],
    behavior: {
      replyDelayMin: 3000,
      replyDelayMax: 6000,
      typingIndicatorChance: 0.8,
      readButNoReplyChance: 0.15,
      multiMessageChance: 0.1,
      emojiChance: 0.4,
    },
    rules: [
      {
        id: 'lisa-lunch',
        triggers: { keywords: ['吃', '饭', '午餐', '中午'] },
        responses: [
          '中午要一起吃饭吗？😊',
          '我知道楼下新开了一家店……',
        ],
        weight: 1,
      },
      {
        id: 'lisa-movie',
        triggers: { keywords: ['电影', '周末', '看'] },
        responses: [
          '周末那部电影好像还不错……',
          '你想看什么类型的？',
        ],
        weight: 1,
      },
      {
        id: 'lisa-default',
        triggers: { default: true },
        responses: [
          '嗯……那个方案我再想想',
          '哈哈，没有啦',
          '好呀~',
        ],
        weight: 1,
      },
    ],
  },
  {
    id: 'landlord',
    name: '刘房东',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=landlord',
    wechatId: 'wxid_landlord',
    region: '中国 上海',
    signature: '诚信为本',
    tags: ['房东'],
    behavior: {
      replyDelayMin: 2000,
      replyDelayMax: 4000,
      typingIndicatorChance: 0.2,
      readButNoReplyChance: 0.1,
      multiMessageChance: 0,
      emojiChance: 0.1,
    },
    rules: [
      {
        id: 'landlord-rent',
        triggers: { keywords: ['房租', '钱', '转', '交'] },
        responses: [
          '这个月房租最晚周五转我。',
          '水费单发你了，看一下。',
        ],
        weight: 1,
      },
      {
        id: 'landlord-default',
        triggers: { default: true },
        responses: [
          '热水器修好了，下次注意点。',
          '这次先不催你，下不为例。',
        ],
        weight: 1,
      },
    ],
  },
];

export const seedContacts: Contact[] = seedPersonas.map((persona) => ({
  id: persona.id,
  name: persona.name,
  avatar: persona.avatar,
  wechatId: persona.wechatId,
  region: persona.region,
  signature: persona.signature,
  tags: persona.tags,
  persona,
  isOnline: Math.random() > 0.5,
}));
```

- [ ] **Step 3: Add conversations, messages, moments seed data**

Extend `src/data/seed.ts`:
```ts
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const seedConversations: Conversation[] = seedContacts.map((contact) => ({
  id: `conv-${contact.id}`,
  type: 'single',
  contactId: contact.id,
  lastMessageId: '',
  unreadCount: contact.id === 'boss' ? 1 : 0,
  isPinned: contact.id === 'mom',
  isMuted: false,
  updatedAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
}));

export const seedMessages: Message[] = seedContacts.flatMap((contact) => {
  const conversationId = `conv-${contact.id}`;
  const now = Date.now();
  const baseMessages: Message[] = [
    {
      id: generateId('msg'),
      conversationId,
      senderId: contact.id,
      type: 'text',
      content: contact.id === 'mom'
        ? '最近天气凉了，记得多穿点。'
        : contact.id === 'boss'
        ? '方案今天下班前发我。'
        : contact.id === 'buddy'
        ? '晚上开黑吗？'
        : contact.id === 'lisa'
        ? '今天 lunch 一起吗？'
        : '这个月房租记得按时转。',
      status: 'read',
      createdAt: now - 1000 * 60 * 60 * 2,
    },
    {
      id: generateId('msg'),
      conversationId,
      senderId: 'me',
      type: 'text',
      content: '好的，知道了。',
      status: 'read',
      createdAt: now - 1000 * 60 * 30,
    },
  ];

  // Update conversation lastMessageId
  const conversation = seedConversations.find((c) => c.id === conversationId)!;
  conversation.lastMessageId = baseMessages[baseMessages.length - 1].id;

  return baseMessages;
});

export const seedMoments: Moment[] = [
  {
    id: generateId('moment'),
    authorId: 'mom',
    content: '今天的阳光真好，适合晒被子。☀️',
    images: [],
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    likes: [{ contactId: 'lisa', createdAt: Date.now() - 1000 * 60 * 30 }],
    comments: [],
  },
  {
    id: generateId('moment'),
    authorId: 'buddy',
    content: '又双叒叕加班了，资本家看了都流泪。',
    images: [],
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    likes: [{ contactId: 'lisa', createdAt: Date.now() - 1000 * 60 * 45 }],
    comments: [
      { id: generateId('comment'), contactId: 'mom', content: '年轻人要注意身体', createdAt: Date.now() - 1000 * 60 * 30 },
    ],
  },
  {
    id: generateId('moment'),
    authorId: 'lisa',
    content: '周末看了部电影，还不错~ 🎬',
    images: [],
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    likes: [{ contactId: 'buddy', createdAt: Date.now() - 1000 * 60 * 60 * 20 }],
    comments: [],
  },
];
```

- [ ] **Step 4: Write seed data test**

Create `src/__tests__/data/seed.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { seedMe, seedContacts, seedConversations, seedMessages, seedMoments } from '../../data/seed';

describe('seed data', () => {
  it('has me user', () => {
    expect(seedMe.nickname).toBe('我');
  });

  it('has 5 contacts with personas', () => {
    expect(seedContacts).toHaveLength(5);
    expect(seedContacts.every((c) => c.persona)).toBe(true);
  });

  it('has conversation for each contact', () => {
    expect(seedConversations).toHaveLength(seedContacts.length);
    expect(seedConversations.every((c) => c.lastMessageId)).toBe(true);
  });

  it('has messages linked to conversations', () => {
    const conversationIds = new Set(seedConversations.map((c) => c.id));
    expect(seedMessages.every((m) => conversationIds.has(m.conversationId))).toBe(true);
  });

  it('has moments with valid authors', () => {
    const contactIds = new Set(seedContacts.map((c) => c.id));
    expect(seedMoments.length).toBeGreaterThan(0);
    expect(seedMoments.every((m) => contactIds.has(m.authorId))).toBe(true);
  });
});
```

- [ ] **Step 5: Run test**

```bash
npx vitest run src/__tests__/data/seed.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(data): add seed data for me, contacts, conversations, messages, moments"
```

---

### Task 6: Setup Dexie database and startup seeding

**Files:**
- Create: `src/db/database.ts`, `src/db/init.ts`
- Modify: `src/main.tsx`
- Test: `src/__tests__/db/database.test.ts`

**Interfaces:**
- Consumes: `seedMe`, `seedContacts`, `seedConversations`, `seedMessages`, `seedMoments`, `AppSettings` from seed and types
- Produces: `db` singleton and `initializeDatabase()` async function that seeds on first launch.

- [ ] **Step 1: Create Dexie database class**

Create `src/db/database.ts`:
```ts
import Dexie, { Table } from 'dexie';
import type { Contact, Conversation, Message, Moment, AppSettings, Me } from '../types';

export class WeChatSoloDB extends Dexie {
  me!: Table<Me>;
  contacts!: Table<Contact>;
  conversations!: Table<Conversation>;
  messages!: Table<Message>;
  moments!: Table<Moment>;
  settings!: Table<AppSettings>;

  constructor() {
    super('WeChatSoloDB');
    this.version(1).stores({
      me: 'id',
      contacts: 'id',
      conversations: 'id, updatedAt',
      messages: 'id, conversationId, createdAt',
      moments: 'id, createdAt',
      settings: 'id',
    });
  }
}

export const db = new WeChatSoloDB();
```

- [ ] **Step 2: Create database initialization logic**

Create `src/db/init.ts`:
```ts
import { db } from './database';
import {
  seedMe,
  seedContacts,
  seedConversations,
  seedMessages,
  seedMoments,
} from '../data/seed';

export async function initializeDatabase(): Promise<void> {
  const contactCount = await db.contacts.count();

  if (contactCount > 0) {
    // 已经有数据，跳过初始化
    return;
  }

  await db.transaction(
    'rw',
    [db.me, db.contacts, db.conversations, db.messages, db.moments, db.settings],
    async () => {
      await db.me.add(seedMe);
      await db.contacts.bulkAdd(seedContacts);
      await db.conversations.bulkAdd(seedConversations);
      await db.messages.bulkAdd(seedMessages);
      await db.moments.bulkAdd(seedMoments);
      await db.settings.add({
        id: 'app',
        darkMode: false,
        soundEnabled: true,
        vibrationEnabled: true,
        version: '1.0.0-Demo',
      });
    }
  );
}
```

- [ ] **Step 3: Wire initialization into app startup**

Modify `src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeDatabase } from './db/init';

initializeDatabase().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
```

- [ ] **Step 4: Write database test**

Create `src/__tests__/db/database.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('WeChatSoloDB', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('initializes with seed data on first launch', async () => {
    await initializeDatabase();
    const contacts = await db.contacts.toArray();
    const messages = await db.messages.toArray();
    const moments = await db.moments.toArray();

    expect(contacts).toHaveLength(5);
    expect(messages.length).toBeGreaterThan(0);
    expect(moments.length).toBeGreaterThan(0);
  });

  it('does not duplicate seed data on subsequent launches', async () => {
    await initializeDatabase();
    await initializeDatabase();
    const contacts = await db.contacts.toArray();

    expect(contacts).toHaveLength(5);
  });
});
```

- [ ] **Step 5: Run test**

```bash
npx vitest run src/__tests__/db/database.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(db): add IndexedDB schema and startup seeding"
```

---

### Task 7: Create Zustand stores

**Files:**
- Create: `src/stores/useAppStore.ts`, `src/stores/useContactStore.ts`, `src/stores/useChatStore.ts`, `src/stores/useMomentStore.ts`
- Test: `src/__tests__/stores/*.test.ts`

**Interfaces:**
- Consumes: `db` singleton, core domain types
- Produces: Four Zustand stores that components will use.

- [ ] **Step 1: Create useAppStore**

Create `src/stores/useAppStore.ts`:
```ts
import { create } from 'zustand';

type Tab = 'chats' | 'contacts' | 'discover' | 'me';

interface AppState {
  currentTab: Tab;
  setCurrentTab: (tab: Tab) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTab: 'chats',
  setCurrentTab: (tab) => set({ currentTab: tab }),
}));
```

- [ ] **Step 2: Create useContactStore**

Create `src/stores/useContactStore.ts`:
```ts
import { create } from 'zustand';
import type { Contact, Me } from '../types';
import { db } from '../db/database';

interface ContactState {
  me: Me | null;
  contacts: Contact[];
  loaded: boolean;
  loadContacts: () => Promise<void>;
}

export const useContactStore = create<ContactState>((set) => ({
  me: null,
  contacts: [],
  loaded: false,
  loadContacts: async () => {
    const me = await db.me.get('me');
    const contacts = await db.contacts.toArray();
    set({ me: me ?? null, contacts, loaded: true });
  },
}));
```

- [ ] **Step 3: Create useChatStore**

Create `src/stores/useChatStore.ts`:
```ts
import { create } from 'zustand';
import type { Conversation, Message } from '../types';
import { db } from '../db/database';

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  loaded: boolean;
  loadChats: () => Promise<void>;
}

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
}));
```

- [ ] **Step 4: Create useMomentStore**

Create `src/stores/useMomentStore.ts`:
```ts
import { create } from 'zustand';
import type { Moment } from '../types';
import { db } from '../db/database';

interface MomentState {
  moments: Moment[];
  loaded: boolean;
  loadMoments: () => Promise<void>;
}

export const useMomentStore = create<MomentState>((set) => ({
  moments: [],
  loaded: false,
  loadMoments: async () => {
    const moments = await db.moments.toArray();
    set({ moments, loaded: true });
  },
}));
```

- [ ] **Step 5: Write store tests**

Create `src/__tests__/stores/appStore.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { useAppStore } from '../../stores/useAppStore';

describe('useAppStore', () => {
  it('defaults to chats tab', () => {
    expect(useAppStore.getState().currentTab).toBe('chats');
  });

  it('can switch tabs', () => {
    useAppStore.getState().setCurrentTab('contacts');
    expect(useAppStore.getState().currentTab).toBe('contacts');
  });
});
```

Create `src/__tests__/stores/contactStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useContactStore } from '../../stores/useContactStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('useContactStore', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useContactStore.setState({ me: null, contacts: [], loaded: false });
  });

  it('loads contacts from database', async () => {
    await initializeDatabase();
    await useContactStore.getState().loadContacts();

    expect(useContactStore.getState().contacts).toHaveLength(5);
    expect(useContactStore.getState().loaded).toBe(true);
  });
});
```

Create similar tests for `chatStore` and `momentStore`.

- [ ] **Step 6: Run tests**

```bash
npx vitest run src/__tests__/stores
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(stores): add zustand stores for app, contacts, chats, moments"
```

---

### Task 8: Create TabBar and App layout shell

**Files:**
- Create: `src/components/common/TabBar.tsx`, `src/pages/ChatPage.tsx`, `src/pages/ContactsPage.tsx`, `src/pages/DiscoverPage.tsx`, `src/pages/MePage.tsx`
- Modify: `src/App.tsx`
- Test: `src/__tests__/components/TabBar.test.tsx`

**Interfaces:**
- Consumes: `useAppStore`, page components
- Produces: A working 4-tab shell with placeholders.

- [ ] **Step 1: Create page placeholders**

Create `src/pages/ChatPage.tsx`:
```tsx
export function ChatPage() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">微信</h2>
      <p className="text-wechat-text-secondary mt-2">聊天列表将在这里显示</p>
    </div>
  );
}
```

Create `src/pages/ContactsPage.tsx`, `src/pages/DiscoverPage.tsx`, `src/pages/MePage.tsx` similarly with distinct titles.

- [ ] **Step 2: Create TabBar component**

Create `src/components/common/TabBar.tsx`:
```tsx
import { MessageCircle, Users, Compass, User } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { cn } from '../../utils/cn';

type Tab = 'chats' | 'contacts' | 'discover' | 'me';

interface TabConfig {
  id: Tab;
  label: string;
  icon: React.ElementType;
}

const tabs: TabConfig[] = [
  { id: 'chats', label: '微信', icon: MessageCircle },
  { id: 'contacts', label: '通讯录', icon: Users },
  { id: 'discover', label: '发现', icon: Compass },
  { id: 'me', label: '我', icon: User },
];

export function TabBar() {
  const { currentTab, setCurrentTab } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-wechat-divider max-w-phone mx-auto">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className="flex flex-col items-center px-4 py-1"
              data-testid={`tab-${tab.id}`}
            >
              <Icon
                size={24}
                className={cn(
                  'transition-colors',
                  isActive ? 'text-wechat-green' : 'text-wechat-text-secondary'
                )}
              />
              <span
                className={cn(
                  'text-xs mt-1',
                  isActive ? 'text-wechat-green' : 'text-wechat-text-secondary'
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Create cn utility**

Create `src/utils/cn.ts`:
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Update App.tsx**

Modify `src/App.tsx`:
```tsx
import { TabBar } from './components/common/TabBar';
import { ChatPage } from './pages/ChatPage';
import { ContactsPage } from './pages/ContactsPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { MePage } from './pages/MePage';
import { useAppStore } from './stores/useAppStore';

const pages = {
  chats: ChatPage,
  contacts: ContactsPage,
  discover: DiscoverPage,
  me: MePage,
};

function App() {
  const currentTab = useAppStore((state) => state.currentTab);
  const Page = pages[currentTab];

  return (
    <div className="min-h-screen bg-wechat-bg pb-16">
      <Page />
      <TabBar />
    </div>
  );
}

export default App;
```

- [ ] **Step 5: Write TabBar test**

Create `src/__tests__/components/TabBar.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabBar } from '../../components/common/TabBar';
import { useAppStore } from '../../stores/useAppStore';

describe('TabBar', () => {
  it('renders four tabs', () => {
    render(<TabBar />);
    expect(screen.getByTestId('tab-chats')).toBeInTheDocument();
    expect(screen.getByTestId('tab-contacts')).toBeInTheDocument();
    expect(screen.getByTestId('tab-discover')).toBeInTheDocument();
    expect(screen.getByTestId('tab-me')).toBeInTheDocument();
  });

  it('switches active tab on click', () => {
    render(<TabBar />);
    fireEvent.click(screen.getByTestId('tab-contacts'));
    expect(useAppStore.getState().currentTab).toBe('contacts');
  });
});
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run src/__tests__/components/TabBar.test.tsx
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(ui): add TabBar and 4-tab layout shell"
```

---

### Task 9: Write startup integration test

**Files:**
- Create: `src/__tests__/startup.test.tsx`
- Test: itself

**Interfaces:**
- Consumes: All previous tasks
- Produces: An integration test proving the app boots, loads data, and renders the tab bar.

- [ ] **Step 1: Write integration test**

Create `src/__tests__/startup.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { db } from '../db/database';

describe('App startup', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('boots and shows tab bar', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-chats')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test**

```bash
npx vitest run src/__tests__/startup.test.tsx
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "test: add app startup integration test"
```

---

### Task 10: Write README and initial project commit

**Files:**
- Create: `README.md`
- Modify: none
- Test: none (manual review)

**Interfaces:**
- Consumes: All previous tasks
- Produces: A README with setup instructions, tech stack, and project overview.

- [ ] **Step 1: Write README**

Create `README.md`:
```markdown
# WeChat Solo

一个高保真还原微信核心体验、并由多 Agent 人设驱动的单机社交模拟器。

## 产品定位

WeChat Solo 用于展示 AI 产品助理的核心能力：

- 复杂 C 端产品的信息架构与交互还原
- AI Agent 人设设计与规则驱动回复
- AI 工具（Claude Code）系统落地产品想法

## 技术栈

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand
- Dexie.js (IndexedDB)
- lucide-react

## 本地运行

```bash
npm install
npm run dev
```

## 测试

```bash
npm test
```

## 当前阶段

Sprint 0 已完成：项目骨架与数据地基。
```

- [ ] **Step 2: Verify dev server still runs**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit and tag sprint**

```bash
git add .
git commit -m "docs: add README and complete sprint 0"
git tag sprint-0-complete
```

---

## Self-Review

**1. Spec coverage:**

| Spec Section | Implementing Task(s) |
|---|---|
| Tech stack (React + TS + Tailwind + Zustand + Dexie) | Task 1, 2 |
| Core domain types | Task 3 |
| Agent persona schema | Task 4 |
| Seed data for Me, contacts, conversations, messages, moments | Task 5 |
| IndexedDB persistence and first-launch seeding | Task 6 |
| Zustand stores | Task 7 |
| 4-tab navigation shell | Task 8 |
| Testing setup | Tasks 1, 5, 6, 7, 8, 9 |
| README / documentation | Task 10 |

No gaps identified.

**2. Placeholder scan:**

- No TBD/TODO in plan steps.
- No vague "add error handling" steps.
- All code blocks contain actual code.
- File paths are exact.

**3. Type consistency:**

- `Me`, `Contact`, `Conversation`, `Message`, `Moment`, `AppSettings`, `AgentPersona`, `ReplyRule` all defined in `src/types/index.ts`.
- Stores use these exact type names.
- Database tables typed with these exact names.
- Seed data exports match expected shapes.

Plan passes self-review.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-12-sprint-0-project-skeleton.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

Which approach do you prefer?
