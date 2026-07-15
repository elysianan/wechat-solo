# WeChat Solo Sprint 10 Implementation Plan: 消息类型补全（位置 / 名片 / 转账）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 WeChat Solo 添加位置、名片、转账三种消息类型，包含发送入口、iOS 微信风格卡片渲染、转账详情页与状态流、Agent 按消息类型回复，以及完整测试覆盖。

**Architecture:** 扩展 `Message` discriminated union 与 `MessagePayload`；为每种新类型创建独立卡片组件；在 `MessageInput` 工具面板触发底部选择器/输入面板；转账状态通过 Zustand action 更新并同步写回 IndexedDB；Agent 引擎新增 `messageType` 匹配维度，让人设可以按消息类型回复。

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Zustand, Dexie.js, lucide-react, Vitest.

## Global Constraints

- 所有代码注释和 UI 文案使用中文
- 不接入真实地图 API，位置消息使用静态占位图
- 不接入真实支付，转账仅为本地状态模拟
- 不支持群名片，名片只支持联系人名片
- 保持现有 iOS 微信视觉风格（圆角、颜色变量、44px Header、4px 头像圆角）
- 每个任务必须有测试，并先写测试后写实现（TDD）
- 频繁提交：每个任务完成后独立 commit
- 不降低现有测试通过率

---

## File Structure

| 文件 | 职责 |
|-----|------|
| `src/types/index.ts` | 扩展 `MessageType`、`Message`、`MessagePayload`、`AgentBehavior`、`ReplyTrigger` |
| `src/components/chat/LocationMessageCard.tsx` | 位置消息卡片 UI |
| `src/components/chat/ContactCardMessage.tsx` | 名片消息卡片 UI |
| `src/components/chat/TransferMessageCard.tsx` | 转账消息卡片 UI |
| `src/components/chat/ContactPickerSheet.tsx` | 底部联系人选择器 |
| `src/components/chat/TransferPanel.tsx` | 底部转账输入面板 |
| `src/pages/TransferDetailPage.tsx` | 转账详情页 |
| `src/components/chat/MessageBubble.tsx` | 根据消息类型分发渲染卡片 |
| `src/components/chat/MessageInput.tsx` | 工具面板新增入口和面板状态 |
| `src/stores/useChatStore.ts` | 构造新消息、更新转账状态、调度 Agent 回复 |
| `src/stores/useAppStore.ts` | 新增 `navigateToTransferDetail` |
| `src/App.tsx` | 挂载 `TransferDetailPage` |
| `src/agents/types.ts` | 扩展 `GenerateReplyInput` 与 `ReplyRule` 相关类型 |
| `src/agents/engine.ts` | 支持 `messageType` 规则匹配 |
| `src/pages/ChatPage.tsx` | 更新最后消息预览 |
| `src/data/seed.ts` | 预置新类型种子消息 |
| `src/data/personas/*.ts` | 新增 `messageType` 规则 |
| `src/data/personas/index.ts` | 升级 `PERSONA_VERSION` |
| `src/db/database.ts` | 升级 IndexedDB 版本（v4）并迁移旧 `transfer`/`location` 字段 |

---

## Task 1: 扩展类型定义

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: 现有 `MessageType`, `Message`, `MessagePayload`, `AgentBehavior`, `ReplyTrigger`, `ReplyRule`
- Produces: 扩展后的 discriminated union 与 payload 类型，后续组件与 store 直接使用

- [ ] **Step 1: 写类型扩展变更**

在 `src/types/index.ts` 中做以下修改：

```typescript
// 1. MessageType 增加 contact_card
export type MessageType =
  | 'text'
  | 'image'
  | 'voice'
  | 'redpacket'
  | 'transfer'
  | 'location'
  | 'contact_card';

// 2. 转账消息结构改为完整状态流
export interface TransferMessage extends BaseMessage {
  type: 'transfer';
  amount: number;
  note?: string;
  transferStatus: 'pending' | 'received' | 'refunded';
  transferCreatedAt?: number;
  transferCompletedAt?: number;
}

// 3. 位置消息结构增加 name
export interface LocationMessage extends BaseMessage {
  type: 'location';
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

// 4. 新增名片消息类型
export interface ContactCardMessage extends BaseMessage {
  type: 'contact_card';
  contactId: string;
  nickname: string;
  avatar: string;
  region?: string;
  signature?: string;
}

// 5. Message 联合类型扩展
export type Message =
  | TextMessage
  | ImageMessage
  | VoiceMessage
  | RedPacketMessage
  | TransferMessage
  | LocationMessage
  | ContactCardMessage;

// 6. 新增 Payload
export interface LocationPayload {
  type: 'location';
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface ContactCardPayload {
  type: 'contact_card';
  contactId: string;
  nickname: string;
  avatar: string;
  region?: string;
  signature?: string;
}

export interface TransferPayload {
  type: 'transfer';
  amount: number;
  note?: string;
}

export type MessagePayload =
  | TextPayload
  | ImagePayload
  | VoicePayload
  | RedPacketPayload
  | LocationPayload
  | ContactCardPayload
  | TransferPayload;

// 7. AgentBehavior 增加转账决策概率
export interface AgentBehavior {
  replyDelayMin: number;
  replyDelayMax: number;
  typingIndicatorChance: number;
  readButNoReplyChance: number;
  multiMessageChance: number;
  emojiChance: number;
  groupReplyChance: number;
  transferAcceptChance?: number; // 收到转账后收款概率，默认 0.8
  transferRefundChance?: number; // 收到转账后退还概率，默认 0.1
}

// 8. ReplyTrigger 增加 messageType
export interface ReplyTrigger {
  keywords?: string[];
  patterns?: RegExp[];
  context?: string[];
  timeWindow?: TimeWindow[];
  default?: boolean;
  messageType?: 'text' | 'location' | 'contact_card' | 'transfer';
}
```

- [ ] **Step 2: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 可能因其他文件未适配而报错，这是预期中的；Task 1 本身只要求类型文件语法正确。

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "types(sprint10): 扩展 location/contact_card/transfer 消息类型与 Agent 规则"
```

---

## Task 2: 新增消息卡片组件

**Files:**
- Create: `src/components/chat/LocationMessageCard.tsx`
- Create: `src/__tests__/components/chat/LocationMessageCard.test.tsx`
- Create: `src/components/chat/ContactCardMessage.tsx`
- Create: `src/__tests__/components/chat/ContactCardMessage.test.tsx`
- Create: `src/components/chat/TransferMessageCard.tsx`
- Create: `src/__tests__/components/chat/TransferMessageCard.test.tsx`

**Interfaces:**
- Consumes: `LocationMessage`, `ContactCardMessage`, `TransferMessage` from `src/types/index.ts`
- Produces: `LocationMessageCard`, `ContactCardMessage`, `TransferMessageCard` 三个 React 组件

### LocationMessageCard

- [ ] **Step 1: 写失败测试**

```typescript
// src/__tests__/components/chat/LocationMessageCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LocationMessageCard } from '../../../components/chat/LocationMessageCard';
import type { LocationMessage } from '../../../types';

const message: LocationMessage = {
  id: 'm1',
  conversationId: 'c1',
  senderId: 'me',
  type: 'location',
  name: '腾讯大厦',
  address: '深圳市南山区海天二路33号',
  status: 'sent',
  createdAt: Date.now(),
};

describe('LocationMessageCard', () => {
  it('渲染地点名称和地址', () => {
    render(<LocationMessageCard message={message} />);
    expect(screen.getByText('腾讯大厦')).toBeInTheDocument();
    expect(screen.getByText('深圳市南山区海天二路33号')).toBeInTheDocument();
  });

  it('包含地图占位区域', () => {
    render(<LocationMessageCard message={message} />);
    expect(screen.getByTestId('location-map-placeholder')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- src/__tests__/components/chat/LocationMessageCard.test.tsx`
Expected: FAIL — 组件未定义

- [ ] **Step 3: 实现组件**

```typescript
// src/components/chat/LocationMessageCard.tsx
import type { LocationMessage } from '../../types';

interface LocationMessageCardProps {
  message: LocationMessage;
}

export function LocationMessageCard({ message }: LocationMessageCardProps) {
  return (
    <div className="w-[220px] rounded-lg overflow-hidden bg-wechat-card" data-testid="location-message-card">
      <div
        className="h-[100px] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700"
        data-testid="location-map-placeholder"
      />
      <div className="p-2">
        <div className="text-sm font-medium text-wechat-text-primary truncate">{message.name}</div>
        <div className="text-xs text-wechat-text-secondary truncate mt-0.5">{message.address}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- src/__tests__/components/chat/LocationMessageCard.test.tsx`
Expected: PASS

### ContactCardMessage

- [ ] **Step 5: 写失败测试**

```typescript
// src/__tests__/components/chat/ContactCardMessage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ContactCardMessage } from '../../../components/chat/ContactCardMessage';
import type { ContactCardMessage as ContactCardMessageType } from '../../../types';

const message: ContactCardMessageType = {
  id: 'm1',
  conversationId: 'c1',
  senderId: 'me',
  type: 'contact_card',
  contactId: 'u1',
  nickname: '王小明',
  avatar: '/avatar.svg',
  region: '中国 深圳',
  signature: '保持热爱',
  status: 'sent',
  createdAt: Date.now(),
};

describe('ContactCardMessage', () => {
  it('渲染头像、昵称、地区', () => {
    render(<ContactCardMessage message={message} onClick={() => {}} />);
    expect(screen.getByText('王小明')).toBeInTheDocument();
    expect(screen.getByText('中国 深圳')).toBeInTheDocument();
    expect(screen.getByAltText('王小明')).toHaveAttribute('src', expect.stringContaining('avatar'));
  });

  it('点击触发 onClick', () => {
    const handleClick = vi.fn();
    render(<ContactCardMessage message={message} onClick={handleClick} />);
    fireEvent.click(screen.getByTestId('contact-card-message'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 6: 实现组件**

```typescript
// src/components/chat/ContactCardMessage.tsx
import { assetUrl } from '../../utils/asset';
import type { ContactCardMessage as ContactCardMessageType } from '../../types';

interface ContactCardMessageProps {
  message: ContactCardMessageType;
  onClick?: () => void;
}

export function ContactCardMessage({ message, onClick }: ContactCardMessageProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 w-[220px] p-3 bg-wechat-card rounded-lg cursor-pointer active:opacity-90"
      data-testid="contact-card-message"
    >
      <img
        src={assetUrl(message.avatar)}
        alt={message.nickname}
        className="w-10 h-10 rounded bg-wechat-bg object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-wechat-text-primary truncate">{message.nickname}</div>
        <div className="text-xs text-wechat-text-secondary truncate">{message.region || ''}</div>
      </div>
    </div>
  );
}
```

### TransferMessageCard

- [ ] **Step 7: 写失败测试**

```typescript
// src/__tests__/components/chat/TransferMessageCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TransferMessageCard } from '../../../components/chat/TransferMessageCard';
import type { TransferMessage } from '../../../types';

const baseMessage: TransferMessage = {
  id: 'm1',
  conversationId: 'c1',
  senderId: 'me',
  type: 'transfer',
  amount: 88,
  transferStatus: 'pending',
  createdAt: Date.now(),
};

describe('TransferMessageCard', () => {
  it('渲染金额', () => {
    render(<TransferMessageCard message={baseMessage} isMe />);
    expect(screen.getByText('¥88.00')).toBeInTheDocument();
  });

  it('自己发出的待收款显示「待对方收款」', () => {
    render(<TransferMessageCard message={baseMessage} isMe />);
    expect(screen.getByText('待对方收款')).toBeInTheDocument();
  });

  it('收到的待收款显示「待收款」', () => {
    render(<TransferMessageCard message={baseMessage} isMe={false} />);
    expect(screen.getByText('待收款')).toBeInTheDocument();
  });

  it('已收款状态显示「已收款」', () => {
    render(<TransferMessageCard message={{ ...baseMessage, transferStatus: 'received' }} isMe={false} />);
    expect(screen.getByText('已收款')).toBeInTheDocument();
  });

  it('已退还状态显示「已退还」', () => {
    render(<TransferMessageCard message={{ ...baseMessage, transferStatus: 'refunded' }} isMe />);
    expect(screen.getByText('已退还')).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: 实现组件**

```typescript
// src/components/chat/TransferMessageCard.tsx
import { Banknote } from 'lucide-react';
import type { TransferMessage } from '../../types';

interface TransferMessageCardProps {
  message: TransferMessage;
  isMe: boolean;
}

function statusText(status: TransferMessage['transferStatus'], isMe: boolean): string {
  switch (status) {
    case 'pending':
      return isMe ? '待对方收款' : '待收款';
    case 'received':
      return isMe ? '已被领取' : '已收款';
    case 'refunded':
      return '已退还';
    default:
      return '';
  }
}

export function TransferMessageCard({ message, isMe }: TransferMessageCardProps) {
  return (
    <div
      className="flex items-center gap-3 w-[200px] p-3 rounded-lg"
      data-testid="transfer-message-card"
    >
      <div className="flex-shrink-0">
        <Banknote size={32} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-lg font-medium text-white truncate">¥{message.amount.toFixed(2)}</div>
        <div className="text-xs text-white/80 truncate">{statusText(message.transferStatus, isMe)}</div>
      </div>
    </div>
  );
}
```

注意：`TransferMessageCard` 本身不控制背景色，背景色由外层 `MessageBubble` 根据 `isMe` 传入。

- [ ] **Step 9: Commit**

```bash
git add src/components/chat/LocationMessageCard.tsx src/components/chat/ContactCardMessage.tsx src/components/chat/TransferMessageCard.tsx src/__tests__/components/chat/LocationMessageCard.test.tsx src/__tests__/components/chat/ContactCardMessage.test.tsx src/__tests__/components/chat/TransferMessageCard.test.tsx
git commit -m "feat(sprint10): 新增位置/名片/转账消息卡片组件"
```

---

## Task 3: 更新 MessageBubble 渲染新卡片

**Files:**
- Modify: `src/components/chat/MessageBubble.tsx`
- Modify: `src/__tests__/components/chat/MessageBubble.test.tsx`

**Interfaces:**
- Consumes: `LocationMessageCard`, `ContactCardMessage`, `TransferMessageCard` 组件；`useAppStore.navigateToContactDetail`
- Produces: `MessageBubble` 能正确渲染三种新消息，并处理点击事件

- [ ] **Step 1: 写失败测试**

在 `src/__tests__/components/chat/MessageBubble.test.tsx` 中新增用例：

```typescript
import { TransferMessageCard } from '../../../components/chat/TransferMessageCard';

it('渲染转账消息卡片', () => {
  const message: TransferMessage = {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'me',
    type: 'transfer',
    amount: 66,
    transferStatus: 'pending',
    createdAt: Date.now(),
  };
  render(<MessageBubble message={message} isMe contactName="Lisa" contactAvatar="/avatar.svg" />);
  expect(screen.getByText('¥66.00')).toBeInTheDocument();
});

it('渲染位置消息卡片', () => {
  const message: LocationMessage = {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'me',
    type: 'location',
    name: '腾讯大厦',
    address: '深圳市南山区',
    status: 'sent',
    createdAt: Date.now(),
  };
  render(<MessageBubble message={message} isMe contactName="Lisa" contactAvatar="/avatar.svg" />);
  expect(screen.getByText('腾讯大厦')).toBeInTheDocument();
});

it('渲染名片消息卡片并可点击跳转', () => {
  const message: ContactCardMessage = {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'me',
    type: 'contact_card',
    contactId: 'u1',
    nickname: '王小明',
    avatar: '/avatar.svg',
    region: '中国 深圳',
    status: 'sent',
    createdAt: Date.now(),
  };
  render(<MessageBubble message={message} isMe contactName="Lisa" contactAvatar="/avatar.svg" />);
  expect(screen.getByText('王小明')).toBeInTheDocument();
});
```

- [ ] **Step 2: 修改 MessageBubble 导入与 renderContent**

```typescript
import { MapPin, UserCircle, Check, CheckCheck, Gift, Image as ImageIcon, X } from 'lucide-react';
import type { Message, MessageStatus, RedPacketMessage } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { LocationMessageCard } from './LocationMessageCard';
import { ContactCardMessage } from './ContactCardMessage';
import { TransferMessageCard } from './TransferMessageCard';
```

替换 `renderContent` 中 `transfer` 与 `location` 分支：

```typescript
function renderContent(
  message: Message,
  isMe: boolean,
  onImageClick: () => void,
  voiceProps: {
    isPlaying: boolean;
    playedSeconds: number;
    onClick: () => void;
  },
  onContactCardClick?: () => void,
  onTransferClick?: () => void
) {
  switch (message.type) {
    case 'text':
      return message.content;
    case 'image':
      return <ImageBubble url={message.url} onClick={onImageClick} />;
    case 'voice':
      return (
        <VoiceBubble
          duration={message.duration}
          isMe={isMe}
          isPlaying={voiceProps.isPlaying}
          playedSeconds={voiceProps.playedSeconds}
          onClick={voiceProps.onClick}
        />
      );
    case 'redpacket':
      return <RedPacketBubble message={message} />;
    case 'transfer':
      return (
        <div onClick={onTransferClick} className="cursor-pointer">
          <TransferMessageCard message={message} isMe={isMe} />
        </div>
      );
    case 'location':
      return <LocationMessageCard message={message} />;
    case 'contact_card':
      return <ContactCardMessage message={message} onClick={onContactCardClick} />;
    default:
      return null;
  }
}
```

- [ ] **Step 3: 在 MessageBubble 组件内添加点击处理**

```typescript
export function MessageBubble({
  message,
  isMe,
  contactName,
  contactAvatar,
  onDelete,
  onRetry,
}: MessageBubbleProps) {
  const navigateToContactDetail = useAppStore((state) => state.navigateToContactDetail);
  const navigateToTransferDetail = useAppStore((state) => state.navigateToTransferDetail);
  // ... existing state

  const handleContactCardClick = () => {
    if (message.type === 'contact_card') {
      navigateToContactDetail(message.contactId);
    }
  };

  const handleTransferClick = () => {
    if (message.type === 'transfer') {
      navigateToTransferDetail(message.id);
    }
  };

  // ... 在气泡 div 内调用 renderContent 时传入回调
```

- [ ] **Step 4: 运行测试**

Run: `npm test -- src/__tests__/components/chat/MessageBubble.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/MessageBubble.tsx src/__tests__/components/chat/MessageBubble.test.tsx
git commit -m "feat(sprint10): MessageBubble 支持三种新消息类型渲染与点击"
```

---

## Task 4: 新增输入面板与工具按钮

**Files:**
- Modify: `src/components/chat/MessageInput.tsx`
- Create: `src/components/chat/ContactPickerSheet.tsx`
- Create: `src/__tests__/components/chat/ContactPickerSheet.test.tsx`
- Create: `src/components/chat/TransferPanel.tsx`
- Create: `src/__tests__/components/chat/TransferPanel.test.tsx`
- Modify: `src/__tests__/components/chat/MessageInput.test.tsx`

**Interfaces:**
- Consumes: `MessagePayload` 扩展类型；`Contact` from `src/types/index.ts`
- Produces: `ContactPickerSheet` 选择后回调 `ContactCardPayload`；`TransferPanel` 确认后回调 `TransferPayload`；`MessageInput.onSend` 支持三种新 payload

### ContactPickerSheet

- [ ] **Step 1: 写失败测试**

```typescript
// src/__tests__/components/chat/ContactPickerSheet.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ContactPickerSheet } from '../../../components/chat/ContactPickerSheet';
import type { Contact } from '../../../types';

const contacts: Contact[] = [
  {
    id: 'u1',
    name: '王小明',
    avatar: '/avatar.svg',
    wechatId: 'wxid_1',
    region: '中国 深圳',
    signature: '',
    tags: [],
    persona: {} as Contact['persona'],
    isOnline: true,
  },
];

describe('ContactPickerSheet', () => {
  it('搜索过滤联系人', () => {
    render(<ContactPickerSheet visible contacts={contacts} onSelect={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('搜索联系人'), { target: { value: '小李' } });
    expect(screen.queryByText('王小明')).not.toBeInTheDocument();
  });

  it('选择联系人触发 onSelect', () => {
    const onSelect = vi.fn();
    render(<ContactPickerSheet visible contacts={contacts} onSelect={onSelect} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('王小明'));
    expect(onSelect).toHaveBeenCalledWith(contacts[0]);
  });
});
```

- [ ] **Step 2: 实现 ContactPickerSheet**

```typescript
// src/components/chat/ContactPickerSheet.tsx
import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { assetUrl } from '../../utils/asset';
import type { Contact } from '../../types';

interface ContactPickerSheetProps {
  visible: boolean;
  contacts: Contact[];
  onSelect: (contact: Contact) => void;
  onClose: () => void;
}

export function ContactPickerSheet({ visible, contacts, onSelect, onClose }: ContactPickerSheetProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => contacts.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [contacts, query]
  );

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
      data-testid="contact-picker-sheet"
    >
      <div className="bg-wechat-bg rounded-t-2xl max-h-[70%] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-wechat-divider">
          <span className="text-base font-medium">选择联系人</span>
          <button onClick={onClose} data-testid="contact-picker-close">
            <X size={20} />
          </button>
        </div>
        <div className="p-3">
          <input
            type="text"
            placeholder="搜索联系人"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-wechat-card rounded px-3 py-2 text-sm outline-none"
            data-testid="contact-picker-search"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onSelect(contact)}
              className="w-full flex items-center gap-3 px-4 py-3 active:bg-wechat-bg transition-colors"
              data-testid="contact-picker-item"
            >
              <img
                src={assetUrl(contact.avatar)}
                alt={contact.name}
                className="w-10 h-10 rounded bg-wechat-bg object-cover"
              />
              <span className="text-sm text-wechat-text-primary">{contact.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### TransferPanel

- [ ] **Step 3: 写失败测试**

```typescript
// src/__tests__/components/chat/TransferPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransferPanel } from '../../../components/chat/TransferPanel';

describe('TransferPanel', () => {
  it('输入金额和备注后确认', () => {
    const onConfirm = vi.fn();
    render(<TransferPanel visible onConfirm={onConfirm} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('金额'), { target: { value: '88' } });
    fireEvent.change(screen.getByPlaceholderText('备注（可选）'), { target: { value: '吃饭' } });
    fireEvent.click(screen.getByText('转账'));
    expect(onConfirm).toHaveBeenCalledWith({ type: 'transfer', amount: 88, note: '吃饭' });
  });

  it('金额非法时不触发', () => {
    const onConfirm = vi.fn();
    render(<TransferPanel visible onConfirm={onConfirm} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('转账'));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: 实现 TransferPanel**

```typescript
// src/components/chat/TransferPanel.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import type { TransferPayload } from '../../types';

interface TransferPanelProps {
  visible: boolean;
  onConfirm: (payload: TransferPayload) => void;
  onClose: () => void;
}

export function TransferPanel({ visible, onConfirm, onClose }: TransferPanelProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  if (!visible) return null;

  const handleConfirm = () => {
    const value = parseFloat(amount);
    if (Number.isNaN(value) || value <= 0) return;
    onConfirm({ type: 'transfer', amount: value, note: note.trim() || undefined });
    setAmount('');
    setNote('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
      data-testid="transfer-panel"
    >
      <div className="bg-wechat-bg rounded-t-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-medium">转账</span>
          <button onClick={onClose} data-testid="transfer-panel-close">
            <X size={20} />
          </button>
        </div>
        <input
          type="number"
          inputMode="decimal"
          placeholder="金额"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-wechat-card rounded px-3 py-2 text-sm mb-2 outline-none"
          data-testid="transfer-amount-input"
        />
        <input
          type="text"
          placeholder="备注（可选）"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-wechat-card rounded px-3 py-2 text-sm mb-4 outline-none"
          data-testid="transfer-note-input"
        />
        <button
          onClick={handleConfirm}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full bg-wechat-green text-white text-sm py-2 rounded disabled:opacity-50 active:scale-[0.98] transition-transform"
          data-testid="transfer-confirm-button"
        >
          转账
        </button>
      </div>
    </div>
  );
}
```

### MessageInput 工具按钮

- [ ] **Step 5: 更新 MessageInput 导入与状态**

```typescript
import { Plus, AtSign, Image as ImageIcon, Mic, Gift, MapPin, UserCircle, Banknote, X } from 'lucide-react';
import { ContactPickerSheet } from './ContactPickerSheet';
import { TransferPanel } from './TransferPanel';
import { useContactStore } from '../../stores/useContactStore';
```

增加状态：

```typescript
const [showContactPicker, setShowContactPicker] = useState(false);
const [showTransferPanel, setShowTransferPanel] = useState(false);
const contacts = useContactStore((state) => state.contacts);
```

- [ ] **Step 6: 增加发送处理函数**

```typescript
const handleSendLocation = () => {
  onSend({
    type: 'location',
    name: '腾讯大厦',
    address: '深圳市南山区海天二路33号',
    lat: 22.5408,
    lng: 113.9345,
  });
  setShowTools(false);
};

const handleSelectContact = (contact: Contact) => {
  onSend({
    type: 'contact_card',
    contactId: contact.id,
    nickname: contact.name,
    avatar: contact.avatar,
    region: contact.region,
    signature: contact.signature,
  });
  setShowContactPicker(false);
  setShowTools(false);
};

const handleSendTransfer = (payload: TransferPayload) => {
  onSend(payload);
  setShowTransferPanel(false);
  setShowTools(false);
};
```

- [ ] **Step 7: 渲染新面板和工具按钮**

在工具面板区域新增三个按钮：

```tsx
<button
  type="button"
  onClick={handleSendLocation}
  className="flex flex-col items-center gap-1 text-wechat-text-secondary active:scale-95 transition-transform"
  data-testid="tool-location-button"
>
  <div className="w-12 h-12 rounded-xl bg-wechat-card flex items-center justify-center">
    <MapPin size={24} />
  </div>
  <span className="text-xs">位置</span>
</button>

<button
  type="button"
  onClick={() => setShowContactPicker(true)}
  className="flex flex-col items-center gap-1 text-wechat-text-secondary active:scale-95 transition-transform"
  data-testid="tool-contact-card-button"
>
  <div className="w-12 h-12 rounded-xl bg-wechat-card flex items-center justify-center">
    <UserCircle size={24} />
  </div>
  <span className="text-xs">名片</span>
</button>

<button
  type="button"
  onClick={() => setShowTransferPanel(true)}
  className="flex flex-col items-center gap-1 text-wechat-text-secondary active:scale-95 transition-transform"
  data-testid="tool-transfer-button"
>
  <div className="w-12 h-12 rounded-xl bg-wechat-card flex items-center justify-center">
    <Banknote size={24} />
  </div>
  <span className="text-xs">转账</span>
</button>
```

- [ ] **Step 8: 运行测试**

Run: `npm test -- src/__tests__/components/chat/MessageInput.test.tsx src/__tests__/components/chat/ContactPickerSheet.test.tsx src/__tests__/components/chat/TransferPanel.test.tsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/chat/MessageInput.tsx src/components/chat/ContactPickerSheet.tsx src/components/chat/TransferPanel.tsx src/__tests__/components/chat/MessageInput.test.tsx src/__tests__/components/chat/ContactPickerSheet.test.tsx src/__tests__/components/chat/TransferPanel.test.tsx
git commit -m "feat(sprint10): 工具面板新增位置/名片/转账发送入口与面板"
```

---

## Task 5: 新增转账详情页与路由

**Files:**
- Modify: `src/stores/useAppStore.ts`
- Modify: `src/App.tsx`
- Create: `src/pages/TransferDetailPage.tsx`
- Create: `src/__tests__/pages/TransferDetailPage.test.tsx`

**Interfaces:**
- Consumes: `useChatStore.updateTransferStatus`, `useAppStore.popPage`
- Produces: `navigateToTransferDetail(messageId)` 路由；`TransferDetailPage` 完成收款/退还

- [ ] **Step 1: 扩展 useAppStore**

```typescript
// PageRoute 增加 transfer-detail
type PageRoute =
  | { type: 'tabs' }
  | { type: 'chat-detail'; conversationId: string }
  | { type: 'contact-detail'; contactId: string }
  | { type: 'transfer-detail'; messageId: string }
  // ... existing routes

interface AppState {
  // ... existing
  navigateToTransferDetail: (messageId: string) => void;
}

navigateToTransferDetail: (messageId) =>
  set((state) => ({
    pageStack: [...state.pageStack, { type: 'transfer-detail', messageId }],
  })),
```

- [ ] **Step 2: 在 App.tsx 挂载页面**

```typescript
import { TransferDetailPage } from './pages/TransferDetailPage';

// detail-layer 内新增
{topRoute.type === 'transfer-detail' && <TransferDetailPage />}
```

- [ ] **Step 3: 写失败测试**

```typescript
// src/__tests__/pages/TransferDetailPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransferDetailPage } from '../../pages/TransferDetailPage';
import { useAppStore } from '../../stores/useAppStore';
import { useChatStore } from '../../stores/useChatStore';

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('../../stores/useChatStore', () => ({
  useChatStore: vi.fn(),
}));

describe('TransferDetailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('渲染转账金额和对方信息', () => {
    useAppStore.mockReturnValue({
      pageStack: [{ type: 'transfer-detail', messageId: 'm1' }],
      popPage: vi.fn(),
    });
    useChatStore.mockReturnValue({
      messages: {
        c1: [{
          id: 'm1',
          conversationId: 'c1',
          senderId: 'u1',
          type: 'transfer',
          amount: 88,
          transferStatus: 'pending',
          note: '吃饭',
          createdAt: Date.now(),
        }],
      },
      conversations: [{ id: 'c1', contactId: 'u1' }],
      contacts: [{ id: 'u1', name: '王小明', avatar: '/avatar.svg' }],
      updateTransferStatus: vi.fn(),
    });

    render(<TransferDetailPage />);
    expect(screen.getByText('¥88.00')).toBeInTheDocument();
    expect(screen.getByText('吃饭')).toBeInTheDocument();
    expect(screen.getByText('收款')).toBeInTheDocument();
  });

  it('点击收款后调用 updateTransferStatus', async () => {
    const updateTransferStatus = vi.fn();
    useAppStore.mockReturnValue({
      pageStack: [{ type: 'transfer-detail', messageId: 'm1' }],
      popPage: vi.fn(),
    });
    useChatStore.mockReturnValue({
      messages: {
        c1: [{
          id: 'm1',
          conversationId: 'c1',
          senderId: 'u1',
          type: 'transfer',
          amount: 88,
          transferStatus: 'pending',
          createdAt: Date.now(),
        }],
      },
      conversations: [{ id: 'c1', contactId: 'u1' }],
      contacts: [{ id: 'u1', name: '王小明', avatar: '/avatar.svg' }],
      updateTransferStatus,
    });

    render(<TransferDetailPage />);
    fireEvent.click(screen.getByText('收款'));
    await waitFor(() => {
      expect(updateTransferStatus).toHaveBeenCalledWith('m1', 'received');
    });
  });
});
```

- [ ] **Step 4: 实现 TransferDetailPage**

```typescript
// src/pages/TransferDetailPage.tsx
import { Header } from '../components/common/Header';
import { useAppStore } from '../stores/useAppStore';
import { useChatStore } from '../stores/useChatStore';
import { useContactStore } from '../stores/useContactStore';
import { assetUrl } from '../utils/asset';
import { formatChatTime } from '../utils/time';

export function TransferDetailPage() {
  const pageStack = useAppStore((state) => state.pageStack);
  const popPage = useAppStore((state) => state.popPage);
  const topRoute = pageStack[pageStack.length - 1];
  const messageId = topRoute?.type === 'transfer-detail' ? topRoute.messageId : null;

  const messages = useChatStore((state) => state.messages);
  const updateTransferStatus = useChatStore((state) => state.updateTransferStatus);
  const conversations = useChatStore((state) => state.conversations);
  const contacts = useContactStore((state) => state.contacts);

  const message = Object.values(messages).flat().find((m) => m.id === messageId);
  if (!message || message.type !== 'transfer') return null;

  const conversation = conversations.find((c) => c.id === message.conversationId);
  const contact = contacts.find((c) => c.id === (conversation?.contactId ?? message.senderId));
  const isMeReceived = message.senderId !== 'me';

  const handleReceive = () => updateTransferStatus(message.id, 'received');
  const handleRefund = () => updateTransferStatus(message.id, 'refunded');

  return (
    <div className="h-full bg-wechat-bg flex flex-col" data-testid="transfer-detail-page">
      <Header title="转账详情" onBack={popPage} />
      <div className="flex-1 flex flex-col items-center pt-16 px-6">
        <img
          src={assetUrl(contact?.avatar || '')}
          alt={contact?.name || ''}
          className="w-16 h-16 rounded bg-wechat-bg object-cover"
        />
        <div className="mt-3 text-base text-wechat-text-secondary">
          {contact?.name} {isMeReceived ? '向你转账' : '的转账'}
        </div>
        <div className="mt-6 text-4xl font-medium text-wechat-text-primary">
          ¥{message.amount.toFixed(2)}
        </div>
        {message.note && (
          <div className="mt-2 text-sm text-wechat-text-secondary">备注：{message.note}</div>
        )}

        {message.transferStatus === 'pending' && isMeReceived && (
          <div className="w-full mt-10 space-y-3">
            <button
              onClick={handleReceive}
              className="w-full bg-wechat-green text-white text-base py-3 rounded active:scale-[0.98] transition-transform"
              data-testid="transfer-receive-button"
            >
              收款
            </button>
            <button
              onClick={handleRefund}
              className="w-full text-wechat-text-secondary text-sm py-2"
              data-testid="transfer-refund-button"
            >
              退还
            </button>
          </div>
        )}

        {message.transferStatus === 'received' && (
          <div className="mt-10 text-sm text-wechat-text-secondary">
            已收款 {message.transferCompletedAt ? formatChatTime(message.transferCompletedAt) : ''}
          </div>
        )}

        {message.transferStatus === 'refunded' && (
          <div className="mt-10 text-sm text-wechat-text-secondary">
            已退还 {message.transferCompletedAt ? formatChatTime(message.transferCompletedAt) : ''}
          </div>
        )}

        {!isMeReceived && message.transferStatus === 'pending' && (
          <div className="mt-10 text-sm text-wechat-text-secondary">待对方收款</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 运行测试**

Run: `npm test -- src/__tests__/pages/TransferDetailPage.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/stores/useAppStore.ts src/App.tsx src/pages/TransferDetailPage.tsx src/__tests__/pages/TransferDetailPage.test.tsx
git commit -m "feat(sprint10): 新增转账详情页与路由"
```

---

## Task 6: 扩展 chatStore 支持新 Payload 与转账状态

**Files:**
- Modify: `src/stores/useChatStore.ts`
- Modify: `src/__tests__/stores/chatStore.test.ts`

**Interfaces:**
- Consumes: `LocationPayload`, `ContactCardPayload`, `TransferPayload` 与扩展后的 `MessagePayload`
- Produces: `buildMessageFromPayload` 支持三种新 payload；`updateTransferStatus` action；非文本消息触发 Agent 回复

- [ ] **Step 1: 写失败测试**

在 `src/__tests__/stores/chatStore.test.ts` 中新增：

```typescript
it('发送位置消息', async () => {
  await act(async () => {
    await result.current.sendMessage('conv-mom', {
      type: 'location',
      name: '腾讯大厦',
      address: '深圳市南山区',
    });
  });
  const msgs = result.current.messages['conv-mom'];
  expect(msgs[msgs.length - 1].type).toBe('location');
});

it('发送名片消息', async () => {
  await act(async () => {
    await result.current.sendMessage('conv-mom', {
      type: 'contact_card',
      contactId: 'buddy',
      nickname: '阿杰',
      avatar: '/avatar-buddy.svg',
    });
  });
  const msgs = result.current.messages['conv-mom'];
  expect(msgs[msgs.length - 1].type).toBe('contact_card');
});

it('发送转账消息', async () => {
  await act(async () => {
    await result.current.sendMessage('conv-mom', { type: 'transfer', amount: 88, note: '吃饭' });
  });
  const msgs = result.current.messages['conv-mom'];
  const transfer = msgs[msgs.length - 1];
  expect(transfer.type).toBe('transfer');
  expect(transfer.transferStatus).toBe('pending');
});

it('更新转账状态为已收款', async () => {
  await act(async () => {
    await result.current.sendMessage('conv-mom', { type: 'transfer', amount: 88 });
  });
  const transfer = result.current.messages['conv-mom'].slice(-1)[0];
  await act(async () => {
    await result.current.updateTransferStatus(transfer.id, 'received');
  });
  const updated = result.current.messages['conv-mom'].find((m) => m.id === transfer.id);
  expect(updated.transferStatus).toBe('received');
});
```

- [ ] **Step 2: 扩展 ChatState 接口**

```typescript
interface ChatState {
  // ... existing
  updateTransferStatus: (messageId: string, transferStatus: 'received' | 'refunded') => Promise<void>;
}
```

- [ ] **Step 3: 扩展 buildMessageFromPayload**

在 switch 末尾增加：

```typescript
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
case 'transfer':
  return {
    ...base,
    type: 'transfer' as const,
    amount: payload.amount,
    note: payload.note,
    transferStatus: 'pending' as const,
    transferCreatedAt: now,
  };
```

- [ ] **Step 4: 扩展 messageToPayload**

```typescript
case 'location':
  return { type: 'location', name: message.name, address: message.address, lat: message.lat, lng: message.lng };
case 'contact_card':
  return {
    type: 'contact_card',
    contactId: message.contactId,
    nickname: message.nickname,
    avatar: message.avatar,
    region: message.region,
    signature: message.signature,
  };
case 'transfer':
  return { type: 'transfer', amount: message.amount, note: message.note };
```

- [ ] **Step 5: 实现 updateTransferStatus**

```typescript
updateTransferStatus: async (messageId, transferStatus) => {
  const now = Date.now();
  await db.messages.update(messageId, {
    transferStatus,
    transferCompletedAt: now,
  });

  set((state) => {
    const next: Record<string, Message[]> = {};
    for (const convId of Object.keys(state.messages)) {
      next[convId] = state.messages[convId].map((m) =>
        m.id === messageId && m.type === 'transfer'
          ? { ...m, transferStatus, transferCompletedAt: now }
          : m
      );
    }
    return { messages: next };
  });
},
```

说明：`Message` 的 `status` 字段已被 `BaseMessage` 占用表示发送状态，转账收款状态使用 `transferStatus`。Dexie 的 `update` 因 discriminated union 限制可能需要 `(Partial<TransferMessage> as Partial<Message>)` 类型断言。

- [ ] **Step 6: 非文本消息触发 Agent 回复**

当前 `sendMessage` 中 `payload.type !== 'text'` 只走状态流。需要让 location/contact_card/transfer 也触发 Agent 回复。

修改 `sendMessage` 中非文本分支：

```typescript
if (payload.type !== 'text') {
  if (conversation.type === 'group') {
    scheduleGroupDelivery(message);
  } else {
    // 单聊非文本消息也生成 Agent 回复
    try {
      const [contact, me] = await Promise.all([
        conversation.contactId ? db.contacts.get(conversation.contactId) : Promise.resolve(undefined),
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
      scheduleStatusFlow(message, plan);

      // 如果是转账，Agent 后续自动收款/退还
      if (payload.type === 'transfer') {
        scheduleTransferAgentAction(message, contact);
      }
    } catch (error) {
      console.error('Agent 回复调度失败:', error);
      await useChatStore.getState().updateMessageStatus(message.id, 'failed');
    }
  }
  return;
}
```

- [ ] **Step 7: 在 chatStore 顶部添加 randomBetween 工具函数**

```typescript
// 生成 [min, max] 之间的随机数
function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
```

- [ ] **Step 8: 实现 Agent 转账自动处理**

```typescript
function scheduleTransferAgentAction(transferMessage: Message, contact: Contact) {
  if (transferMessage.type !== 'transfer') return;
  if (transferMessage.senderId !== 'me') return;

  const behavior = contact.persona.behavior;
  const acceptChance = behavior.transferAcceptChance ?? 0.8;
  const refundChance = behavior.transferRefundChance ?? 0.1;
  const delay = randomBetween(3000, 10000);

  setTimeout(() => {
    const random = Math.random();
    if (random < refundChance) {
      useChatStore.getState().updateTransferStatus(transferMessage.id, 'refunded');
      return;
    }
    if (random < acceptChance + refundChance) {
      useChatStore.getState().updateTransferStatus(transferMessage.id, 'received');
      // 可选：Agent 回复感谢语，由 engine 的 transfer 规则处理
    }
  }, delay);
}
```

- [ ] **Step 9: 运行测试**

Run: `npm test -- src/__tests__/stores/chatStore.test.ts`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/stores/useChatStore.ts src/__tests__/stores/chatStore.test.ts
git commit -m "feat(sprint10): chatStore 支持新消息类型与转账状态更新"
```

---

## Task 7: 扩展 Agent 引擎支持 messageType

**Files:**
- Modify: `src/agents/types.ts`
- Modify: `src/agents/engine.ts`
- Modify: `src/__tests__/agents/engine.test.ts`
- Modify: `src/data/personas/*.ts`（5 个人设文件）
- Modify: `src/data/personas/index.ts`

**Interfaces:**
- Consumes: 扩展后的 `ReplyTrigger.messageType`
- Produces: `generateReply` 对非文本消息按 `messageType` 匹配规则

- [ ] **Step 1: 扩展 agents/types.ts**

`GenerateReplyInput` 无需改动。`ReplyPlan` 保持原样。ReplyTrigger 已在 `src/types/index.ts` 中扩展。

- [ ] **Step 2: 修改 engine.ts 支持 messageType 匹配**

修改 `matchKeyword` 函数，让它接收 `messageType`：

```typescript
function matchKeyword(
  rule: ReplyRule,
  content: string,
  recentContents: string[],
  messageType: Message['type']
): string | null {
  // messageType 匹配优先
  if (rule.triggers.messageType) {
    return rule.triggers.messageType === messageType ? '' : null;
  }

  // 原有 keyword/pattern/context/default 逻辑
  if (rule.triggers.context && rule.triggers.context.length > 0) {
    const contextText = recentContents.slice(-5).join(' ');
    if (!rule.triggers.context.some((keyword) => contextText.includes(keyword))) {
      return null;
    }
    if (!rule.triggers.keywords && !rule.triggers.patterns) {
      return '';
    }
  }
  const keyword = rule.triggers.keywords?.find((k) => content.includes(k));
  if (keyword !== undefined) {
    return keyword;
  }
  if (rule.triggers.patterns?.some((pattern) => pattern.test(content))) {
    return '';
  }
  return null;
}
```

修改 `selectRule` 调用处，传入 `userMessage.type`：

```typescript
const match = selectRule(
  contact.persona.rules,
  userMessage.type === 'text' ? userMessage.content : '',
  recentContents,
  now,
  options?.sessionRuleUsage,
  userMessage.type
);
```

修改 `selectRule` 签名：

```typescript
function selectRule(
  rules: ReplyRule[],
  content: string,
  recentContents: string[],
  now: number,
  sessionRuleUsage?: Map<string, number>,
  messageType?: Message['type']
): RuleMatch | undefined {
  // ...
  for (const rule of pool) {
    const keyword = matchKeyword(rule, content, recentContents, messageType ?? 'text');
    if (keyword !== null) {
      matched.push({ rule, keyword });
    }
  }
  // ...
}
```

- [ ] **Step 3: 非文本消息不再直接返回空计划**

删除或修改 engine.ts 中这段：

```typescript
// Sprint7：Agent 引擎当前只处理文本消息，非文本消息直接返回空计划
if (userMessage.type !== 'text') {
  return { ...empty plan };
}
```

改为允许非文本消息进入规则匹配流程。

- [ ] **Step 4: 写失败测试**

```typescript
// src/__tests__/agents/engine.test.ts
it('收到位置消息按 messageType 规则回复', () => {
  const contact = makeContact({
    rules: [
      {
        id: 'location-rule',
        triggers: { messageType: 'location' },
        responses: ['收到，到时候见'],
        weight: 1,
      },
    ],
  });
  const userMessage: LocationMessage = {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'me',
    type: 'location',
    name: '腾讯大厦',
    address: '深圳',
    status: 'sent',
    createdAt: Date.now(),
  };
  const plan = generateReply({
    contact,
    userMessage,
    recentMessages: [userMessage],
  });
  expect(plan.replyMessages).toEqual([{ content: '收到，到时候见' }]);
});
```

- [ ] **Step 5: 为每个人设添加 messageType 规则**

在 `src/data/personas/mom.ts`, `boss.ts`, `buddy.ts`, `lisa.ts`, `landlord.ts` 中各新增 2-3 条规则：

```typescript
{
  id: 'mom-location',
  triggers: { messageType: 'location' },
  responses: ['这是哪儿？远不远？', '好，到时候见。'],
  weight: 1,
},
{
  id: 'mom-transfer',
  triggers: { messageType: 'transfer' },
  responses: ['怎么突然给我转钱？', '谢谢儿子/女儿。'],
  weight: 1,
},
```

- [ ] **Step 6: 升级 PERSONA_VERSION**

```typescript
export const PERSONA_VERSION = 4;
```

- [ ] **Step 7: 运行测试**

Run: `npm test -- src/__tests__/agents/engine.test.ts src/__tests__/data/personas.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/agents/engine.ts src/agents/types.ts src/__tests__/agents/engine.test.ts src/data/personas/*.ts src/data/personas/index.ts
git commit -m "feat(sprint10): Agent 引擎支持按消息类型回复"
```

---

## Task 8: 更新聊天列表最后消息预览

**Files:**
- Modify: `src/pages/ChatPage.tsx`
- Modify: `src/__tests__/components/chat/ChatListItem.test.tsx`（如需）

**Interfaces:**
- Consumes: `ContactCardMessage`
- Produces: `getMessagePreview` 对 `contact_card` 返回 `[名片]`

- [ ] **Step 1: 扩展 getMessagePreview**

```typescript
function getMessagePreview(message: Message | undefined): string {
  if (!message) return '';
  switch (message.type) {
    case 'text':
      return message.content;
    case 'image':
      return '[图片]';
    case 'voice':
      return '[语音]';
    case 'redpacket':
      return '[微信红包]';
    case 'transfer':
      return '[转账]';
    case 'location':
      return '[位置]';
    case 'contact_card':
      return '[名片]';
    default:
      return '';
  }
}
```

- [ ] **Step 2: 运行相关测试**

Run: `npm test -- src/__tests__/components/chat/ChatListItem.test.tsx src/__tests__/pages/ChatPage.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/pages/ChatPage.tsx
git commit -m "feat(sprint10): 聊天列表最后消息预览增加名片"
```

---

## Task 9: 更新种子数据与数据库版本迁移

**Files:**
- Modify: `src/data/seed.ts`
- Modify: `src/db/database.ts`
- Modify: `src/__tests__/data/seed.test.ts`

**Interfaces:**
- Consumes: 扩展后的 `Message` 类型
- Produces: Demo 首次打开即包含新消息类型；旧数据库数据平滑迁移

- [ ] **Step 1: 添加种子消息**

在 `seedMessages` 中，为 `buddy` 增加位置消息，为 `lisa` 增加名片消息，为 `landlord` 增加转账消息：

```typescript
if (contact.id === 'buddy') {
  baseMessages.push({
    id: makeId('msg'),
    conversationId,
    senderId: contact.id,
    type: 'location',
    name: '老地方网咖',
    address: '上海市徐汇区漕溪北路99号',
    status: 'read',
    createdAt: now - 1000 * 60 * 18,
  });
}

if (contact.id === 'lisa') {
  const sharedContact = seedContacts.find((c) => c.id === 'boss');
  baseMessages.push({
    id: makeId('msg'),
    conversationId,
    senderId: contact.id,
    type: 'contact_card',
    contactId: sharedContact!.id,
    nickname: sharedContact!.name,
    avatar: sharedContact!.avatar,
    region: sharedContact!.region,
    signature: sharedContact!.signature,
    status: 'read',
    createdAt: now - 1000 * 60 * 16,
  });
}

if (contact.id === 'landlord') {
  baseMessages.push({
    id: makeId('msg'),
    conversationId,
    senderId: 'me',
    type: 'transfer',
    amount: 2500,
    note: '房租',
    transferStatus: 'pending',
    createdAt: now - 1000 * 60 * 14,
    status: 'read',
  });
}
```

- [ ] **Step 2: 数据库版本升级与迁移**

在 `src/db/database.ts` 中新增 v4：

```typescript
this.version(4).stores({
  me: 'id',
  contacts: 'id',
  conversations: 'id, updatedAt',
  messages: 'id, conversationId, createdAt',
  moments: 'id, createdAt',
  settings: 'id',
  tags: 'id, name',
}).upgrade((tx) => {
  return tx.table('messages').toCollection().modify((msg: Record<string, unknown>) => {
    // Sprint7 旧 transfer/location 结构迁移到 Sprint10 结构
    if (msg.type === 'transfer') {
      if (!msg.transferStatus) msg.transferStatus = 'pending';
      if (!msg.transferCreatedAt) msg.transferCreatedAt = msg.createdAt ?? Date.now();
    }
    if (msg.type === 'location') {
      if (!msg.name) msg.name = msg.address || '未知位置';
    }
  });
});
```

- [ ] **Step 3: 运行种子测试**

Run: `npm test -- src/__tests__/data/seed.test.ts src/__tests__/db/database.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/data/seed.ts src/db/database.ts src/__tests__/data/seed.test.ts
git commit -m "feat(sprint10): 种子数据增加新消息类型，数据库升级 v4"
```

---

## Task 10: 集成测试与回归

**Files:**
- 全部源码与测试文件

**Interfaces:**
- 验证整个 Sprint 10 功能链路

- [ ] **Step 1: 运行全部测试**

Run: `npm test`
Expected: 所有测试通过，无新增失败

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 3: 启动开发服务器手动验证**

Run: `npm run dev`
手动验证：
1. 打开聊天列表，确认 `[位置]`、`[名片]`、`[转账]` 预览文案正确
2. 进入单聊，点击工具面板「位置」发送位置消息
3. 点击「名片」选择联系人发送名片消息，点击名片跳转资料页
4. 点击「转账」输入金额发送转账，点击转账卡片进入详情页
5. 在详情页点击「收款」/「退还」，状态更新并返回聊天详情
6. 验证 Agent 收到新类型消息后会回复

- [ ] **Step 4: 更新 README 版本号**

在 `README.md` 中更新：

```markdown
## 当前阶段

Sprint 10 已完成：消息类型补全（位置 / 名片 / 转账）（v1.10.0）。
```

- [ ] **Step 5: Commit 与打 Tag**

```bash
git add README.md
git commit -m "docs(sprint10): README 更新至 v1.10.0"
git tag -a sprint-10-complete -m "Sprint 10: 消息类型补全"
```

---

## Self-Review Checklist

- [ ] Spec coverage: 每个设计文档章节都有对应 task
- [ ] No placeholders: 无 TBD/TODO/"实现 later"
- [ ] Type consistency: `transferStatus` 字段名在全计划一致
- [ ] File paths: 所有路径与实际项目结构一致
- [ ] Test first: 每个 task 先写测试后实现
- [ ] Frequent commits: 每个 task 独立 commit

## Notes

1. **转账状态字段名**: 由于 `BaseMessage` 已占用 `status` 表示消息发送状态，转账收款状态继续使用 `transferStatus`，避免大规模重构。
2. **非文本消息 Agent 回复**: Task 6 需要让 `sendMessage` 中的非文本分支调用 `generateReply`。
3. **Agent 自动收款**: Task 6 中 `scheduleTransferAgentAction` 使用人设概率决策，延迟 3-10 秒。
4. **Dexie update 回调**: Task 6 的 `updateTransferStatus` 使用 `{ transferStatus, transferCompletedAt }` 直接更新字段，而不是嵌套 `content`。
5. **Visual companion**: 如果需要比对 UI，可在 Task 2/5 完成后使用视觉辅助工具。
