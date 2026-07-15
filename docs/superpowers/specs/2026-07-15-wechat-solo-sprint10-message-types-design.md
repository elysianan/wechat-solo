# WeChat Solo Sprint 10 设计文档：消息类型补全（位置 / 名片 / 转账）

## 1. 目标与范围

### 目标
在现有聊天体系里补全三类高辨识度消息类型，让聊天更接近真实微信。

### 范围
- 新增三种消息类型：`location`、`contact_card`、`transfer`
- 每种消息类型有独立渲染卡片，按 iOS 微信风格设计
- 位置消息：静态地图占位 + 地址名称
- 名片消息：从通讯录选择联系人，卡片可跳转资料页
- 转账消息：可发送、进入详情页、收款/退还、状态持久化
- Agent 收到这三类消息时，按人设给出上下文回复
- 更新聊天列表最后消息预览（显示 `[位置]`、`[名片]`、`[转账]`）
- 保持 React + TypeScript + Zustand + Dexie 现有技术栈，不引入新地图库

### 不做的事
- 不接入真实地图 API
- 不接入真实支付
- 不支持群名片
- 不处理真实资金/余额变更

---

## 2. 数据模型与消息类型扩展

### 2.1 消息类型联合

```typescript
type MessageType =
  | 'text'
  | 'image'
  | 'voice'
  | 'redpacket'
  // Sprint 10 新增
  | 'location'
  | 'contact_card'
  | 'transfer';
```

### 2.2 消息内容结构

```typescript
// 位置消息
interface LocationContent {
  name: string;      // 如「腾讯大厦」
  address: string;   // 如「深圳市南山区海天二路33号」
  lat: number;       // 模拟坐标
  lng: number;       // 模拟坐标
}

// 名片消息
interface ContactCardContent {
  contactId: string; // 联系人 ID
  nickname: string;
  avatar: string;
  region?: string;
  signature?: string;
}

// 转账消息
interface TransferContent {
  amount: number;                              // 金额，单位元
  status: 'pending' | 'received' | 'refunded'; // 待收款 / 已收款 / 已退还
  note?: string;                               // 转账备注
  createdAt: number;
  completedAt?: number;                        // 收款/退还时间
}
```

### 2.3 存储层（Dexie）

- `messages` 表结构不变，内容以 JSON 存入现有 `content` 字段
- 转账状态变更时直接更新 `messages` 表中对应记录的 `content.status`

### 2.4 类型安全

- 在 `MessageContent` 联合类型中扩展三种内容
- 渲染组件用类型守卫区分 `message.type`
- 转账状态变更通过 Zustand action 更新，并同步写回 IndexedDB

---

## 3. UI / UX 设计

### 3.1 发送入口

聊天详情页底部工具面板新增三个图标：

| 图标 | 名称 | 行为 |
|-----|------|------|
| `MapPin` | 位置 | 直接发送一条固定位置消息（极简占位，无需选择） |
| `UserCircle` | 名片 | 打开「选择联系人」面板，选择后发送 |
| `Banknote` | 转账 | 打开「转账」面板，输入金额和备注，确认后发送 |

### 3.2 位置消息气泡

消息气泡内展示一个卡片：

```
┌─────────────────────┐
│  [灰色地图占位图]    │
│                     │
│  腾讯大厦            │
│  深圳市南山区...     │
└─────────────────────┘
```

- 地图占位用一张静态图片或 CSS 渐变矩形
- 显示地点名称和地址
- 点击卡片弹出 Toast「暂未接入真实地图」

### 3.3 名片消息气泡

```
┌─────────────────────┐
│  [头像]  王小明      │
│         微信号：wx... │
│         地区：深圳   │
└─────────────────────┘
```

- 左侧显示联系人头像
- 右侧显示昵称、微信号、地区
- 整体可点击，跳转到该联系人资料页

### 3.4 转账消息气泡

区分发送方和接收方：

**我发出的转账：**
- 绿色气泡背景
- 显示金额 ¥88.00
- 下方显示状态：「待对方收款」「已被领取」「已退还」

**我收到的转账：**
- 白色气泡背景
- 显示金额 ¥88.00
- 下方显示状态：「待收款」「已收款」「已退还」

点击后进入转账详情页。

### 3.5 转账详情页

全屏层从右侧滑入，类似微信转账详情：

```
┌─────────────────────────┐
│ ←  转账详情              │
├─────────────────────────┤
│                         │
│     [对方头像]           │
│     王小明 向你转账      │
│                         │
│      ¥ 88.00            │
│                         │
│   备注：吃饭的钱          │
│                         │
│   ┌─────────────────┐   │
│   │    收款          │   │
│   └─────────────────┘   │
│                         │
│   或 点击退还            │
│                         │
└─────────────────────────┘
```

- 待收款状态：显示「收款」主按钮 + 「退还」次要按钮
- 已收款状态：显示「已收款」+ 完成时间
- 已退还状态：显示「已退还」+ 退还时间
- 收款/退还后更新消息卡片状态

### 3.6 联系人选择器

从底部滑出的面板：

- 顶部搜索栏，可按昵称搜索
- 列表展示所有联系人（排除自己）
- 点击联系人即发送名片消息
- 面板关闭

---

## 4. Agent 回复规则扩展

### 4.1 触发方式

当用户发送 `location`、`contact_card`、`transfer` 消息时，Agent 读取关键信息：

- **位置**：读取 `name`（地点名称）
- **名片**：读取 `nickname`（被分享人昵称）
- **转账**：读取 `amount` 和 `status`

### 4.2 回复策略

| 消息类型 | 触发规则示例 | 示例回复 |
|---------|------------|---------|
| 位置 | 收到位置消息 | 「收到，到时候见」「这地方我记得，挺近的」 |
| 名片 | 收到名片，且名片不是发给自己 | 「好，我加一下 TA」「推给我干嘛，你自己聊呗😂」 |
| 转账（待收款） | 收到转账 | 「谢谢老板！」「怎么突然给我转钱」 |
| 转账（已收款后） | 用户点击收款后，给对方发一条提示 | 「已收，谢啦」「收到啦~」 |

### 4.3 转账收款的 Agent 决策

- 收到转账后，Agent 不会自动收款
- 过一段时间后（3-10 秒随机），根据人设 `transferAcceptChance` 决定是否收款
- 收款后更新消息状态为 `received`，并回复一条感谢语
- 如果人设比较「客气」或「谨慎」，可能选择退还

**示例人设配置：**

```typescript
transferAcceptChance: 0.8, // 80% 概率收款
transferRefundChance: 0.1, // 10% 概率退还
```

### 4.4 规则库扩展方式

在现有人设规则里新增字段：

```typescript
interface PersonaRule {
  keywords?: string[];
  messageType?: 'text' | 'location' | 'contact_card' | 'transfer'; // 新增
  replies: string[];
  // ...
}
```

- `messageType` 优先级高于 `keywords`
- 收到新消息时，先按 `messageType` 匹配，再按 `keywords` 匹配

### 4.5 群聊场景

- 群里收到位置/名片/转账，只有被 @ 的 Agent 或按概率接话的 Agent 才会回复
- 转账消息在群里也可以被收款，逻辑与私聊一致

---

## 5. 新增组件与页面

### 5.1 新增组件

| 组件 | 用途 | 位置建议 |
|-----|------|---------|
| `LocationMessageCard` | 渲染位置消息气泡 | `src/components/chat/LocationMessageCard.tsx` |
| `ContactCardMessage` | 渲染名片消息气泡 | `src/components/chat/ContactCardMessage.tsx` |
| `TransferMessageCard` | 渲染转账消息气泡 | `src/components/chat/TransferMessageCard.tsx` |
| `ContactPickerSheet` | 底部滑出联系人选择器 | `src/components/chat/ContactPickerSheet.tsx` |
| `TransferPanel` | 底部滑出转账输入面板 | `src/components/chat/TransferPanel.tsx` |
| `TransferDetailPage` | 转账详情全屏页 | `src/pages/TransferDetailPage.tsx` |

### 5.2 改动的现有组件

| 组件 | 改动 |
|-----|------|
| `MessageItem` / `MessageBubble` | 增加 `location`、`contact_card`、`transfer` 的分支渲染 |
| `ChatToolPanel` | 新增三个发送入口图标 |
| `ChatListItem` | 最后消息预览增加 `[位置]`、`[名片]`、`[转账]` |
| `useChatStore` / `chatStore` | 新增发送三类消息、更新转账状态的 action |
| `db.ts` | 确认 `MessageContent` 类型扩展 |
| 各 persona 规则文件 | 新增 `messageType` 规则 |

### 5.3 页面/层管理

- 从聊天详情点击转账卡片 → 右侧滑入 `TransferDetailPage`
- 页面顶部返回按钮回到聊天详情
- 转账详情页里完成收款/退还后，自动返回聊天详情

---

## 6. 持久化与状态流

### 6.1 发送流程

用户点击发送 → Zustand action 执行：

1. 构造消息对象：
   ```typescript
   {
     id: generateId(),
     type: 'location', // 或 'contact_card' / 'transfer'
     senderId: currentUserId,
     conversationId,
     content: { ... },
     status: 'sent',
     createdAt: Date.now(),
   }
   ```
2. 写入 IndexedDB（`db.messages.add`）
3. 更新当前聊天消息列表
4. 更新会话列表最后消息和时间
5. 触发 Agent 回复调度

### 6.2 转账状态变更流程

用户在转账详情页点击「收款」→ Zustand action 执行：

1. 更新内存中消息 `content.status = 'received'`
2. 更新 `content.completedAt = Date.now()`
3. 写回 IndexedDB（`db.messages.update(messageId, { content: newContent })`）
4. 返回聊天详情，转账卡片显示「已收款」
5. 可选：触发对方 Agent 发送「已收到，谢谢」提示消息

退还流程相同，只是状态变为 `'refunded'`。

### 6.3 数据迁移

新消息类型加入，现有 IndexedDB 里只有旧类型消息，不需要数据迁移。新安装用户或继续聊天的用户会自然产生新类型消息。

### 6.4 初始种子数据

为了让 Demo 一打开就有真实感，种子数据里预置几条新消息：

- 某个好友给你发了一个位置「晚上吃饭见」
- 某个群聊里有人分享了一张名片
- 某人给你发了一个待收款转账

---

## 7. 测试策略

### 7.1 单元测试

| 测试文件 | 覆盖内容 |
|---------|---------|
| `LocationMessageCard.test.tsx` | 渲染位置名称、地址、占位图 |
| `ContactCardMessage.test.tsx` | 渲染头像/昵称/地区，点击跳转 |
| `TransferMessageCard.test.tsx` | 渲染金额，根据 status 显示不同文案 |
| `TransferDetailPage.test.tsx` | 收款/退还按钮点击后状态更新 |
| `ContactPickerSheet.test.tsx` | 搜索过滤、选择联系人后调用回调 |
| `TransferPanel.test.tsx` | 输入金额、备注，确认后发送 |
| `chatStore.test.ts`（扩展） | 发送三类消息、更新转账状态 |
| `engine.test.ts`（扩展） | 收到 location/contact_card/transfer 后按规则回复 |

### 7.2 目标

- 新增测试 15-20 个
- 保持项目整体测试全部通过
- 不降低现有测试覆盖率

---

## 8. 后续 Sprint 规划

Sprint 10 完成后，建议继续：

- **Sprint 11：聊天能力增强** — 消息搜索 / 转发 / 群公告 / @所有人
- **Sprint 12：朋友圈升级** — 视频 / 多图 / 评论回复 / 发布入口
- **Sprint 13：视频通话** — 拨号/接听状态机、模拟通话时长
