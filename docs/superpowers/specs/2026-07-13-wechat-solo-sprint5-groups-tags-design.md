# WeChat Solo Sprint 5 设计规格：群聊与联系人标签（P2 规划）

**版本**：v1.5.0-Sprint5  
**日期**：2026-07-13  
**范围**：群聊会话、群内 Agent 回复、@成员、群资料页、联系人标签管理  
**依赖**：Sprint 0 ~ Sprint 4 + 收官修复已完成（master `b962b40`）

---

## 1. 目标与成功标准

### 1.1 目标

1. 实现群聊：种子 2 个群，聊天列表/详情完整支持群会话，气泡显示发言者昵称。
2. 群内 Agent 回复：@提及的成员必回；未 @ 时随机成员概率回复，保持群聊真实感。
3. 输入框支持 @成员选择，演示路径顺畅。
4. 群资料页：成员头像网格、群名称、从群聊 Header 进入。
5. 联系人标签管理：标签列表、标签详情（成员增删）、新建/重命名/删除标签，全部持久化。

### 1.2 成功标准

| 维度 | 标准 |
|------|------|
| 群聊体验 | 发消息 → @谁谁来答；不 @ 时群内有人随机接话，像真群。 |
| 标签管理 | 标签的增删改与成员调整刷新后保留。 |
| 数据兼容 | 旧 IndexedDB 数据（无群会话）不报错：升级时补种群数据。 |
| 可测试性 | 群回复调度、标签操作均有单测；布局契约测试同步覆盖新页面。 |
| 范围可控 | 不做建群流程、群公告、群昵称、@所有人、标签颜色。 |

---

## 2. 范围边界

### 2.1 做

- `Conversation` 扩展 `name? / avatar? / memberIds?`（群专用，单聊不变）。
- 种子：「幸福一家人」（我 + 王阿姨）、「产品研发群」（我 + 张总 + Lisa + 阿杰）+ 群历史消息。
- 聊天列表展示群名称/群头像；聊天详情群内气泡显示发言者昵称。
- 群内回复调度：`@成员名` 必回；无 @ 时随机一名在线成员 40% 概率回复。
- 输入框 @ 按钮：弹出群成员列表，选中插入「@名字 」。
- 群资料页（路由 `group-info`）：成员网格（点击进好友资料）、群名。
- 通讯录「群聊」入口 → 群聊列表（路由 `group-list`）。
- 标签管理：标签列表（路由 `tag-list`）→ 标签详情（路由 `tag-detail`）：成员增删、重命名、删除标签；支持新建标签。
- 以上全部持久化到 IndexedDB（标签以 `Contact.tags` 为唯一数据源）。

### 2.2 不做

- 发起群聊 / 邀请入群 / 退群流程。
- 群公告、群昵称、群管理（群主/管理员）。
- @所有人、引用消息进群的特殊展示。
- 好友资料页直接编辑标签（统一在标签详情页管理成员）。
- 标签颜色、标签排序拖拽。

---

## 3. 架构设计

### 3.1 数据模型变更

```ts
// types/index.ts — Conversation 扩展（向后兼容：新字段均可选）
export interface Conversation {
  id: string;
  type: ConversationType;        // 'single' | 'group'
  contactId?: string;            // 单聊
  name?: string;                 // 群名称（新增）
  avatar?: string;               // 群头像（新增）
  memberIds?: string[];          // 群成员 contact id，不含 'me'（新增）
  lastMessageId: string;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  updatedAt: number;
}
```

### 3.2 旧数据升级

`initializeDatabase()` 当前逻辑：`contacts.count() > 0` 则整体跳过。增加**幂等补种**：群会话不存在时追加群会话与群消息（不触碰用户已有数据）。

### 3.3 群内 Agent 调度

复用现有 `generateReply` 引擎，调度层新增群分支（`useChatStore.sendMessage` / 接收侧）：

1. 解析消息文本中的 `@名字`，命中成员 → 该成员必回（多个 @ 多人依次回复）。
2. 无 @ → 每名成员按**各自人设**的 `groupReplyChance` 独立判定是否回复（可多人接话，也可无人搭理——真实群感）。
3. `AgentBehavior` 新增 `groupReplyChance`（0~1），种子值按人设设定：
   - 阿杰 0.85（群里最活跃）｜王阿姨 0.7（家庭群话多）｜房东 0.3｜Lisa 0.25（偶尔冒泡）｜张总 0.15（只看不说）
4. 回复消息 `senderId` = 成员 contact id；气泡渲染时按 senderId 查成员昵称与头像（群聊展示昵称，单聊不展示）。

### 3.4 @ 输入交互

- 群聊详情页输入框左侧「+」旁逻辑不变；@入口：输入框获得焦点时，群聊场景在工具区显示 `@` 按钮。
- 点击 `@` → 底部弹出成员选择面板（复用 BottomInputSheet 的弹出模式或新组件 `MentionPicker`），选中后向输入框插入「@名字 」并聚焦。
- 实现简化：MentionPicker 为独立组件，受控 visible + onSelect(name)。

### 3.5 标签管理数据流

**双源设计（对齐微信，允许空标签存在）**：

- 标签实体：IndexedDB 新增 `tags` 表（Dexie 升级到 version 2），结构 `{ id, name, createdAt }`——允许没有成员的空标签。
- 成员关系：仍记录在 `Contact.tags: string[]`（标签名字符串）。
- 标签列表 = `tags` 表全量 + 从联系人聚合的成员计数。
- 种子预置标签：家人、同事、朋友、房东（与现有联系人 tags 对齐）。

`useContactStore` 新增：

| Action | 实现 |
|--------|------|
| `createTag(name)` | 重名拒绝；写入 tags 表（空标签允许） |
| `setContactTags(contactId, tags)` | 覆盖式更新单联系人标签（写库 + 内存） |
| `renameTag(oldName, newName)` | 改 tags 表 + 批量替换所有联系人 tags 中的旧名 |
| `deleteTag(name)` | 删 tags 表记录 + 所有联系人 tags 移除该值 |
| `loadTags()` / `selectTagCounts()` | 加载标签；selector 聚合成员计数 |

### 3.6 新增/修改模块

| 模块 | 类型 | 说明 |
|------|------|------|
| `src/types/index.ts` | 修改 | Conversation 扩展 3 个可选字段 |
| `src/data/seed.ts` | 修改 | 2 个群会话 + 群消息种子 + 群头像引用 |
| `src/db/init.ts` | 修改 | 幂等补种群数据 |
| `src/stores/useChatStore.ts` | 修改 | 群消息发送、群内 Agent 调度、群未读 |
| `src/stores/useContactStore.ts` | 修改 | 标签三件套 action + selectAllTags |
| `src/components/chat/MentionPicker.tsx` | 新增 | @成员选择面板 |
| `src/components/chat/MessageBubble.tsx` | 修改 | 群聊展示发言者昵称（isGroup + senderName  props） |
| `src/pages/ChatPage.tsx` | 修改 | 群会话名称/头像/预览（「昵称：内容」格式） |
| `src/pages/ChatDetailPage.tsx` | 修改 | 群聊标题、气泡昵称、@按钮入口 |
| `src/pages/GroupInfoPage.tsx` | 新增 | 群资料页 |
| `src/pages/GroupListPage.tsx` | 新增 | 群聊列表（通讯录入口） |
| `src/pages/TagListPage.tsx` | 新增 | 标签列表 |
| `src/pages/TagDetailPage.tsx` | 新增 | 标签详情（成员管理 + 重命名/删除） |
| `src/stores/useAppStore.ts` | 修改 | 4 条新路由 |
| `public/avatar-group-*.svg` | 新增 | 2 张群头像 |

---

## 4. 测试计划

| 测试 | 内容 |
|------|------|
| `chatStore` 群分支 | 群消息发送持久化；@成员必回；无 @ 概率回复（mock random 验证两条路径）；群未读数 |
| `contactStore` 标签 | setContactTags / renameTag / deleteTag 写库与内存一致；重名拒绝 |
| `MentionPicker` | 成员列表渲染、选中回调 |
| `ChatPage` | 群会话展示群名、预览为「昵称：内容」 |
| `ChatDetailPage` 群 | 标题为群名、气泡显示他人昵称、@按钮仅群聊可见 |
| `GroupInfoPage` | 成员网格渲染、点击成员跳资料页 |
| `TagListPage / TagDetailPage` | 标签聚合计数、增删成员、重命名、删除 |
| `PageScrollLayout` | 4 个新页面补入布局契约 |

---

## 5. 风险与应对

| 风险 | 应对 |
|------|------|
| 群回复调度随机性导致测试不稳 | 测试注入随机源（vi.spyOn Math.random），断言两条分支而非具体值 |
| 旧用户数据（无群）升级失败 | 补种逻辑幂等 + 单测覆盖「已有数据启动」场景 |
| @解析误伤（昵称是子串，如「张」匹配「张总」） | 按「@名字+空格/结尾」边界匹配，优先最长昵称 |
| 范围蔓延（建群流程很诱人） | 明确写入 2.2 不做清单 |

---

*文档状态：待确认*
