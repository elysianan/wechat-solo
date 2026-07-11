# WeChat Solo 产品设计规格文档

**版本**：v1.0.0-Demo  
**日期**：2026-07-12  
**定位**：高保真微信 Demo + 多 Agent 人设驱动的单机社交模拟器  
**目标用户**：AI 产品助理岗位面试官、AI 产品团队、学习者本人  

---

## 1. 产品愿景与成功标准

### 1.1 一句话定位

WeChat Solo 是一个**高保真还原微信核心体验、并由多 Agent 人设驱动的单机社交模拟器**，用于展示 AI 时代的产品设计、Agent 体验设计与 AI 工具落地能力。

### 1.2 为什么要做这个产品

作为 AI 产品助理，需要一个作品集证明三件事：

1. 理解复杂 C 端产品（微信）的信息架构与交互逻辑。
2. 能把 AI 能力（Agent 人设、异步回复、上下文模拟）产品化。
3. 能用 AI 工具（Claude Code）系统、高效地把想法落地。

WeChat Solo 就是这样一个可交互、可演示、可讲述的载体。

### 1.3 成功标准

| 维度 | 标准 |
|------|------|
| 还原度 | 核心页面在视觉和交互上接近微信原生。 |
| Agent 可信度 | 3-5 个联系人的回复风格稳定、符合人设，用户能感知差异。 |
| 交互完整性 | 聊天、朋友圈、通讯录三大主流程可完整跑通。 |
| 演示稳定性 | 本地运行稳定，不依赖外部 API。 |
| 叙事清晰度 | README 与作品集能清楚讲出产品定位、AI 设计、技术栈、迭代规划。 |

### 1.4 产品边界：真实 vs Mock

| 模块 | 真实实现 | Mock / 模拟 |
|------|----------|-------------|
| 聊天 UI | 消息气泡、状态图标、输入框、工具面板 | — |
| 聊天交互 | 发送文字、接收回复、长按菜单、撤回 | — |
| Agent 回复 | 基于人设规则生成回复 | 不调用真实 LLM API |
| 消息状态 | 单灰勾 → 双灰勾 → 双绿勾 状态流转 | — |
| 朋友圈 | 列表、点赞、评论 UI | 内容由预设剧本生成 |
| 通讯录 | 列表、搜索、字母索引、好友详情 | 好友数据为 Mock |
| 支付 | 入口和页面 UI | 所有支付操作只弹 Toast |
| 语音 / 视频 / 扫一扫 | 按钮入口 | 点击提示“演示模式，暂未支持” |
| 登录 / 网络 | 本地 IndexedDB 存储 | 无真实账号和网络 |

---

## 2. 用户画像与 Agent 人设设计

### 2.1 玩家角色：我

- **昵称**：可自定义，默认“我”
- **角色**：普通都市青年 / 上班族
- **需求**：体验高仿微信，感受不同联系人的“活人感”

### 2.2 AI Agent 联系人

每个联系人都是独立 Agent，有自己的人设、语言风格、回复规则。玩家应在 3 轮对话内感觉到“这个人不一样”。

#### 王阿姨（妈妈）

| 属性 | 内容 |
|------|------|
| 关系 | 母亲 |
| 人设标签 | 关心、唠叨、节俭、爱发养生链接 |
| 语言风格 | 长句、多 emoji、重复叮嘱 |
| 典型话题 | 吃饭、穿衣、天气、找对象 |
| 回复规则 | 80% 关心 + 15% 叮嘱 + 5% 养生转发 |
| 活跃时段 | 早上 7-9 点，晚上 8-10 点 |
| 回复延迟 | 1-3 秒，70% 显示“正在输入” |

#### 张总（老板）

| 属性 | 内容 |
|------|------|
| 关系 | 直属领导 |
| 人设标签 | 严肃、高效、结果导向 |
| 语言风格 | 短句、命令式、常用“收到”“尽快” |
| 典型话题 | 工作进度、会议、汇报 |
| 回复规则 | 60% “收到/好的” + 30% 追问 + 10% 安排任务 |
| 活跃时段 | 工作日 9-18 点 |
| 回复延迟 | 2-5 秒，从不显示“正在输入” |

#### 阿杰（死党 / 大学室友）

| 属性 | 内容 |
|------|------|
| 关系 | 最好的朋友 |
| 人设标签 | 幽默、随性、爱发梗 |
| 语言风格 | 口语化、网络用语、表情包 |
| 典型话题 | 游戏、球赛、吐槽、约饭 |
| 回复规则 | 40% 调侃 + 30% 八卦 + 20% 约饭 + 10% 认真关心 |
| 活跃时段 | 全天，深夜更活跃 |
| 回复延迟 | 0.5-2 秒，30% 连续发多条 |

#### Lisa（暧昧同事）

| 属性 | 内容 |
|------|------|
| 关系 | 同部门同事，关系微妙 |
| 人设标签 | 温柔、含蓄、偶尔撒娇 |
| 语言风格 | 语气词多、犹豫、善用省略号 |
| 典型话题 | 工作协作、午餐、电影、周末 |
| 回复规则 | 50% 工作 + 30% 生活分享 + 20% 试探 |
| 活跃时段 | 工作时间 + 晚上 20-23 点 |
| 回复延迟 | 3-6 秒，80% 显示“正在输入” |

#### 刘房东

| 属性 | 内容 |
|------|------|
| 关系 | 房东 |
| 人设标签 | 直接、略带强势、偶尔通融 |
| 语言风格 | 命令式、带时间压力、少 emoji |
| 典型话题 | 房租、水电、维修 |
| 回复规则 | 70% 催缴/事务 + 20% 通知 + 10% 人情 |
| 活跃时段 | 月初、月底 |
| 回复延迟 | 2-4 秒 |

### 2.3 人设设计的 PM 价值

| Agent | 关系类型 | 展示的 PM 能力 |
|-------|----------|----------------|
| 王阿姨 | 家庭 / 关心型 | 情感化设计、提醒机制 |
| 张总 | 职场 / 任务型 | 效率工具、异步沟通 |
| 阿杰 | 朋友 / 娱乐型 | 休闲社交、UGC 氛围 |
| Lisa | 暧昧 / 张力型 | 微妙状态、不确定性设计 |
| 刘房东 | 事务 / 冲突型 | 通知、截止、压力场景 |

---

## 3. 功能框架与优先级

### 3.1 总体功能地图

```
WeChat Solo
├── 全局层
│   ├── 底部 Tab 导航
│   ├── 本地数据存储（IndexedDB）
│   ├── Agent 回复引擎（规则驱动）
│   └── 页面转场动画
├── Tab 1: 微信（聊天）
│   ├── 聊天列表
│   ├── 单聊详情
│   ├── 消息气泡与状态
│   ├── 输入框与工具面板
│   └── 长按消息菜单
├── Tab 2: 通讯录
│   ├── 联系人列表
│   ├── 字母快速索引
│   ├── 搜索联系人
│   └── 好友资料页
├── Tab 3: 发现
│   ├── 朋友圈列表
│   ├── 点赞 / 评论
│   └── 其他入口（仅保留按钮）
└── Tab 4: 我
    ├── 个人信息页
    ├── 支付入口（Mock）
    └── 设置（深色模式 / 关于）
```

### 3.2 优先级表

#### P0：必须做

| 功能 | 验收标准 |
|------|----------|
| 底部 Tab 导航 | 4 个 Tab 可切换，当前 Tab 高亮 |
| 聊天列表 | 按最后消息时间倒序，显示头像/昵称/预览/时间 |
| 聊天详情页 | 顶部显示对方信息，底部可输入，消息流可滚动 |
| 发送文字消息 | 输入后发送，消息出现在气泡中 |
| Agent 规则回复 | 不同联系人按人设回复，风格稳定 |
| 消息状态图标 | 单灰勾 → 双灰勾 → 双绿勾 |
| 联系人列表 | 显示 5 个 Agent，支持点击进详情 |
| 本地数据持久化 | 刷新不丢数据 |
| “我”页面基础 | 显示用户信息、菜单列表 |

#### P1：重要但可简化

| 功能 | 简化策略 |
|------|----------|
| 聊天列表侧滑 | 只做“删除”和“标为未读” |
| 长按消息菜单 | 只做复制 / 删除 / 撤回 |
| 表情面板 | emoji 选择器，不做自定义表情包 |
| 朋友圈 | 只做列表 + 点赞 + 评论 UI |
| 好友资料页 | 展示头像、昵称、标签、发消息按钮 |
| 设置页 | 深色模式开关 + 关于页面 |

#### P2：本版本不做

| 功能 | 处理方式 |
|------|----------|
| 群聊 | 写入 v2.0 规划 |
| 联系人标签管理 | 写入 v2.0 规划 |
| 支付详情 | 只保留入口，点击弹 Toast |
| 语音 / 视频通话 | 按钮保留，点击提示演示模式 |
| 扫一扫 / 摇一摇 | 按钮保留，点击提示演示模式 |
| 图片 / 文件发送 | 按钮保留，点击提示演示模式 |

### 3.3 模块间数据流

```
用户输入消息
    ↓
聊天 Store 更新消息列表 + 保存到 IndexedDB
    ↓
触发 Agent 回复引擎
    ↓
根据当前联系人的人设规则选择回复
    ↓
模拟延迟 + 可能显示“对方正在输入…”
    ↓
插入回复消息到聊天 Store
    ↓
更新聊天列表最后消息预览
```

---

## 4. Agent 回复引擎设计

### 4.1 设计原则

1. 风格稳定优先于内容多样。
2. 延迟和“正在输入”是体验的一部分。
3. 上下文浅但有效（最近 1-2 轮）。
4. 允许“已读不回”增加真实感。

### 4.2 引擎架构

```
输入
├── 当前 Agent 的人设配置
├── 用户刚发送的消息
├── 最近 2 轮对话上下文
└── 当前时间 / 场景

处理流程
├── Step 1: 关键词匹配 → 筛选候选回复模板
├── Step 2: 人设规则过滤 → 按概率加权
├── Step 3: 模板变量填充
├── Step 4: 随机化包装
└── Step 5: 输出延迟 + 是否显示“正在输入”

输出
├── 回复文本（可能多条）
├── 回复延迟
└── 是否先显示“对方正在输入”
```

### 4.3 配置结构

```typescript
interface AgentPersona {
  id: string;
  name: string;
  avatar: string;
  behavior: {
    replyDelayMin: number;
    replyDelayMax: number;
    typingIndicatorChance: number;
    readButNoReplyChance: number;
    multiMessageChance: number;
    emojiChance: number;
  };
  rules: ReplyRule[];
}

interface ReplyRule {
  id: string;
  triggers: {
    keywords?: string[];
    patterns?: RegExp[];
    context?: string[];
    default?: boolean;
  };
  responses: string[];
  weight: number;
  maxUsageInSession?: number;
}
```

### 4.4 真实感机制

| 机制 | 说明 |
|------|------|
| 随机延迟 | 根据 Agent 参数在 min-max 间随机 |
| 正在输入 | 按概率决定是否先显示“对方正在输入…” |
| 已读不回 | 低概率（5-10%）不回复 |
| 连续多条 | 死党等高活跃 Agent 可能拆分长回复 |

### 4.5 评估标准

| 维度 | 标准 |
|------|------|
| 人设一致性 | 老板不会突然发 emoji 长文 |
| 回复相关性 | 用户说“吃了吗”，Agent 不回复“晚安” |
| 不重复感 | 同一问题 3 次内不重复同一模板 |
| 真实感 | 延迟、打字中、已读不回组合像真人 |
| 可控性 | 演示时不会说出奇怪的话 |

---

## 5. 数据模型与状态管理

### 5.1 推荐技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React + TypeScript |
| 样式 | Tailwind CSS |
| 状态管理 | Zustand |
| 本地存储 | IndexedDB（Dexie.js 封装） |
| 路由 | 轻量路由 / react-router |
| 构建 | Vite |

### 5.2 核心数据实体

```typescript
interface Me {
  id: 'me';
  nickname: string;
  avatar: string;
  wechatId: string;
  region: string;
  signature: string;
}

interface Contact {
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

interface Conversation {
  id: string;
  type: 'single' | 'group';
  contactId?: string;
  lastMessageId: string;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  updatedAt: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: 'me' | string;
  type: 'text' | 'image' | 'voice' | 'redpacket' | 'transfer' | 'location';
  content: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: number;
  replyTo?: { messageId: string; senderName: string; content: string };
}

interface Moment {
  id: string;
  authorId: string;
  content: string;
  images: string[];
  createdAt: number;
  likes: Like[];
  comments: Comment[];
}

interface AppSettings {
  darkMode: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  version: string;
}
```

### 5.3 状态管理分层

- `useAppStore`：当前 Tab、应用设置
- `useContactStore`：联系人、当前用户信息
- `useChatStore`：会话、消息、发送/删除/已读
- `useMomentStore`：朋友圈、点赞、评论

### 5.4 本地持久化

使用 Dexie.js 封装 IndexedDB，版本 1 的表结构：

```typescript
class WeChatSoloDB extends Dexie {
  contacts!: Table<Contact>;
  conversations!: Table<Conversation>;
  messages!: Table<Message>;
  moments!: Table<Moment>;
  settings!: Table<AppSettings>;

  constructor() {
    super('WeChatSoloDB');
    this.version(1).stores({
      contacts: 'id',
      conversations: 'id, updatedAt',
      messages: 'id, conversationId, createdAt',
      moments: 'id, createdAt',
      settings: 'id'
    });
  }
}
```

### 5.5 初始数据策略

应用首次启动时从 `seedData.ts` 初始化：

1. 生成 `Me` 默认用户。
2. 生成 5 个 Contact + Persona。
3. 为每个 Contact 生成一个 Conversation。
4. 为每个 Conversation 生成最近 3-7 条历史消息。
5. 生成 5-8 条朋友圈动态。

---

## 6. UX 流程与页面结构

### 6.1 启动流程

```
打开应用
  ↓
初始化 IndexedDB（首次加载 seed 数据）
  ↓
进入 Tab 1：微信（聊天列表）
```

### 6.2 聊天主流程

```
聊天列表
  ↓ 点击会话
聊天详情页（从右向左滑入）
  ↓ 输入文字，点击发送
消息气泡出现（右侧，单勾 → 双勾 → 双绿勾）
  ↓ 延迟后
Agent 回复出现（左侧，可能带“对方正在输入…”）
  ↓ 点击返回
回到聊天列表（聊天详情页向左滑出）
```

### 6.3 通讯录流程

```
通讯录 Tab
  ↓
字母索引列表
  ↓ 点击联系人
好友资料页
  ↓ 点击“发消息”
进入对应聊天详情页
```

### 6.4 发现 / 朋友圈流程

```
发现 Tab
  ↓ 点击朋友圈
朋友圈列表
  ↓ 点击点赞
点赞图标变红
  ↓ 点击评论
底部弹出评论输入框
```

### 6.5 全局交互规范

| 场景 | 动画 |
|------|------|
| Tab 切换 | 无动画，直接替换 |
| 聊天详情进入 | 从右向左滑入 |
| 聊天详情返回 | 向左滑出 |
| 子页面进入 | 从右向左滑入 |
| 底部弹窗 | 从底部向上滑入 + 背景遮罩 |

### 6.6 演示模式提示

对于 P2 功能（支付、语音、视频、扫一扫、图片发送等），统一 UX：

```
点击按钮 → 弹出 Toast / Alert
内容：“演示模式 · 该功能仅供展示”
```

### 6.7 组件目录结构

```
src/
├── pages/
│   ├── ChatPage.tsx
│   ├── ChatDetailPage.tsx
│   ├── ContactsPage.tsx
│   ├── ContactDetailPage.tsx
│   ├── DiscoverPage.tsx
│   ├── MomentsPage.tsx
│   ├── MePage.tsx
│   ├── ProfilePage.tsx
│   ├── PaymentPage.tsx
│   └── SettingsPage.tsx
├── components/
│   ├── common/
│   ├── chat/
│   ├── contacts/
│   └── moments/
├── stores/
├── db/
├── agents/
├── types/
├── data/
└── utils/
```

---

## 7. 实现路线图

### Sprint 0：项目骨架与数据地基（第 1 周）

- 初始化 Vite + React + TS + Tailwind
- 安装 Zustand、Dexie.js、图标库
- 建立目录结构
- 定义核心 TypeScript 类型
- 创建 seed 数据
- 实现 IndexedDB 初始化

### Sprint 1：聊天核心流程（第 2 周）

- 底部 Tab 导航
- 聊天列表页
- 聊天详情页
- 消息气泡
- 输入框发送文字
- 页面转场动画
- 数据持久化

### Sprint 2：Agent 引擎与消息状态（第 3 周）

- Agent 回复引擎
- 5 个 Agent 人设配置
- 消息状态图标
- “对方正在输入…”状态
- 回复延迟模拟
- 已读状态自动触发

### Sprint 3：通讯录与发现页（第 4 周）

- 通讯录列表与字母索引
- 搜索联系人
- 好友资料页
- 朋友圈列表
- 点赞 / 评论

### Sprint 4：个人中心与最终打磨（第 5 周）

- “我”页面
- 个人信息编辑
- 支付页 Mock
- 设置页（深色模式、关于）
- UI 细节打磨
- 底部水印
- README 与作品集包装

---

## 8. 风险与应对

| 风险 | 应对 |
|------|------|
| Agent 回复风格不稳定 | Sprint 2 预留时间调优规则库和权重 |
| UI 还原度不够 | 每 Sprint 结束时做视觉走查 |
| 范围蔓延 | 严格按 P0/P1/P2 执行，P2 不进入当前版本 |
| 学习节奏慢 | 每个 Sprint 拆成更小的每日任务 |

---

## 9. 待决策 / 下一步

1. 是否需要在设计阶段就输出 PRD 级别的用户故事？
2. 是否需要为面试准备一份“产品决策说明”文档？
3. 是否需要先写技术实现计划再进入编码？

---

*文档状态：待审阅*  
*下一步：用户审阅后，进入实现计划（writing-plans）阶段。*
