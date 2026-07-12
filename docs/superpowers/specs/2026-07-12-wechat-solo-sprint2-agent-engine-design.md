# WeChat Solo Sprint 2 设计规格：Agent 引擎与消息状态流转

**版本**：v1.1.0-Sprint2  
**日期**：2026-07-12  
**范围**：聊天模块的 Agent 回复引擎、消息状态完整流转、"对方正在输入…"提示  
**依赖**：Sprint 0（项目骨架）与 Sprint 1（聊天核心流程）已完成  

---

## 1. 目标与成功标准

### 1.1 目标

1. 让 5 个 Agent 联系人能根据人设规则自动回复用户消息。
2. 让"自己发的消息"呈现完整状态：sending → 单灰勾(sent) → 双灰勾(delivered) → 双绿勾(read)。
3. 在 Agent 回复前按概率显示"对方正在输入…"。
4. Agent 回复时正确更新聊天列表预览、未读红点。

### 1.2 成功标准

| 维度 | 标准 |
|------|------|
| 人设一致性 | 妈妈唠叨、老板简短、阿杰玩梗、Lisa 含蓄、房东直接，3 轮内可感知差异。 |
| 状态正确性 | 自己发的消息按顺序出现单灰 / 双灰 / 双绿勾，失败时显示红色感叹号。 |
| 真实感 | 延迟、正在输入、已读不回组合自然，不出现"秒回机器"。 |
| 可测试性 | Agent 引擎可独立单元测试；集成测试使用 `timeScale: 0` 秒过。 |
| 范围可控 | 不涉及群聊、真 LLM、语音/图片/支付、消息撤回。 |

---

## 2. 范围边界

### 2.1 本 Sprint 内做

- `src/agents/engine.ts` 规则回复引擎。
- 消息状态 `sending → sent → delivered → read` 的自动流转。
- "对方正在输入…" 状态提示。
- Agent 回复后更新会话预览与未读数。
- 相关单元测试与集成测试更新。

### 2.2 本 Sprint 内不做

- 真 LLM / 外部 API 调用。
- 群聊、@引用、消息撤回、长按菜单。
- 图片/语音/红包/转账消息发送。
- 朋友圈、通讯录、发现页改动。
- 深色模式适配。

---

## 3. 架构设计

### 3.1 分层职责

| 层级 | 职责 | 关键文件 |
|------|------|----------|
| **Agent 引擎层** | 纯函数，根据人设规则生成回复计划，不碰 DB / Store。 | `src/agents/engine.ts` |
| **状态调度层** | 按引擎计划驱动消息状态、正在输入、未读数。 | `src/stores/useChatStore.ts` |
| **UI 表现层** | 展示状态图标、正在输入动画、消息气泡。 | `MessageBubble`、`TypingIndicator`、`ChatDetailPage` |

### 3.2 新增/修改文件

```
src/
├── agents/
│   ├── engine.ts                 # 新增：Agent 回复引擎
│   └── types.ts                  # 修改：导出 ReplyPlan 类型
├── components/chat/
│   └── TypingIndicator.tsx       # 新增：对方正在输入提示
├── pages/
│   └── ChatDetailPage.tsx        # 修改：接入 typing 状态
├── stores/
│   └── useChatStore.ts           # 修改：状态流转与 Agent 调度
└── __tests__/
    ├── agents/engine.test.ts     # 新增
    ├── stores/chatStore.test.ts  # 修改/新增用例
    └── chat-flow.test.tsx        # 修改：支持 timeScale=0
```

---

## 4. Agent 回复引擎

### 4.1 输入输出

```typescript
// 输入
interface GenerateReplyInput {
  contact: Contact;              // 含 persona
  userMessage: Message;          // 用户刚发的消息
  recentMessages: Message[];     // 最近 N 条上下文，默认最近 5 条
  options?: {
    timeScale?: number;          // 时间缩放，默认 1；测试传 0
  };
}

// 输出
interface ReplyPlan {
  conversationId: string;
  contactId: string;
  readUserMessageIds: string[];  // 要标为 read 的用户消息 id
  readDelayMs: number;           // 从用户发送到把用户消息标为 read 的延迟
  typingDurationMs: number;      // 0 表示不显示"正在输入"
  replyDelayMs: number;          // 从用户发送到 Agent 回复出现的总延迟
  replyMessages: Array<{
    content: string;
  }>;
}
```

### 4.2 生成流程

1. **决定已读不回**：若 `Math.random() < readButNoReplyChance`，返回空 `replyMessages`，只标 read。
2. **规则匹配**：遍历 `persona.rules`：
   - `keywords`：用户消息内容包含任一关键词即命中。
   - `patterns`：正则匹配（本 Sprint 先保留字段，不实现复杂正则）。
   - `default: true`：兜底规则。
3. **选择规则**：命中规则按 `weight` 加权随机选一条；无命中则只取 default 规则。
4. **选择回复文本**：从选中规则的 `responses` 中随机选一条。
5. **连续多条**：若 `Math.random() < multiMessageChance` 且规则有多条候选，则再随机选一条追加。
6. **计算延迟**：
   - `baseDelay = random(replyDelayMin, replyDelayMax) × timeScale`
   - `showTyping = Math.random() < typingIndicatorChance`
   - `readDelay = baseDelay × random(0.3, 0.5)`  // 保证 read 在 sent/delivered 之后
   - `typingDuration = showTyping ? (baseDelay - readDelay) × random(0.4, 0.9) : 0`
   - `replyDelay = baseDelay`
7. **返回 `ReplyPlan`**。

### 4.3 时间缩放

- `timeScale` 只在引擎内部用于计算延迟，不影响规则选择、概率判断、随机文案。
- 测试时传 `timeScale: 0`，所有延迟归零，但仍保留异步 tick（用 `setTimeout(..., 0)`），确保状态流转顺序可通过 `waitFor` 断言。

---

## 5. 消息状态流转

### 5.1 状态机

状态流转以 Agent 计划中的 `replyDelayMs` 为总时长，按比例分布，避免与较短回复延迟冲突：

```
sending
  ↓ sentAt = replyDelayMs × 0.15
sent      (单灰勾)
  ↓ deliveredAt = replyDelayMs × 0.30
delivered (双灰勾)
  ↓ readAt = readDelayMs（readDelayMs ≥ deliveredAt）
read      (双绿勾)
  ↓ replyAt = replyDelayMs
Agent 回复
```

### 5.2 触发条件

| 状态 | 触发条件 |
|------|----------|
| `sending` | 用户点击发送，立即写入 DB。 |
| `sent` | 到达 `replyDelayMs × 0.15`，模拟"已发送到服务端"。 |
| `delivered` | 到达 `replyDelayMs × 0.30`，模拟"对方已收到"。 |
| `read` | 到达 `readDelayMs`，Agent 把用户消息标为 read。 |
| `failed` | DB 写入失败或状态更新异常时。 |

### 5.3 状态更新方式

- `useChatStore` 中的 `updateMessageStatus(messageId, status)` 同时更新 IndexedDB 与 Zustand state。
- 状态流转使用 `setTimeout` 链式调度；`sent`/`delivered`/`read` 时刻由 `replyDelayMs` 按比例确定。

---

## 6. "对方正在输入…" 提示

### 6.1 状态存储

- `useChatStore` 新增：`typingConversations: Record<string, boolean>`。
- 当 Agent plan 的 `typingDurationMs > 0` 时，在 `readDelayMs` 时刻设为 `true`。
- 在 Agent 回复插入或 `typingDurationMs` 到期时设为 `false`。

### 6.2 UI 展示

- `ChatDetailPage` 在消息流底部读取 `typingConversations[conversationId]`。
- 为 `true` 时渲染 `TypingIndicator` 组件：左侧对方头像 + "对方正在输入…" 动画。

---

## 7. 未读数与会话预览

### 7.1 会话预览

- Agent 回复插入后，更新 `Conversation.lastMessageId` 与 `updatedAt`。
- `ChatPage` 按 `updatedAt` 倒序，并取 `lastMessageId` 对应内容作为预览。

### 7.2 未读数规则

- Agent 回复写入时，读取 `useAppStore.getState().currentConversationId`。
- 若用户**不在**该聊天页，`conversation.unreadCount += 1`。
- 若用户**正在**该聊天页，不增加未读数；`markConversationRead` 会在进入页面时清零。

---

## 8. 错误处理

| 场景 | 处理 |
|------|------|
| 发送消息 DB 写入失败 | 将该消息状态改为 `failed`，UI 显示红色感叹号。 |
| 状态流转 timeout 异常 | 捕获并打印 console，不阻断后续流程。 |
| Agent 引擎无匹配规则 | 使用 default 规则兜底。 |
| Agent 引擎生成异常 | 返回空 plan，不回复、不崩溃。 |
| 联系人或人设缺失 | `generateReply` 返回空 plan。 |

---

## 9. 测试计划

### 9.1 单元测试：`src/__tests__/agents/engine.test.ts`

| 用例 | 断言 |
|------|------|
| 关键词命中 | 用户说"吃了吗"，妈妈回复含"吃"/"饭"相关文本。 |
| 默认规则兜底 | 用户说无关内容，老板回复"收到"/"尽快"。 |
| 已读不回 | `readButNoReplyChance=1` 时，`replyMessages` 为空但 `readUserMessageIds` 非空。 |
| 连续多条 | `multiMessageChance=1` 且规则有多条时，返回 2 条消息。 |
| 时间缩放 | `timeScale=0` 时，`replyDelayMs` 与 `typingDurationMs` 均为 0。 |
| 人设差异 | 老板回复不含 emoji，妈妈回复可能含 emoji。 |

### 9.2 Store 测试：`src/__tests__/stores/chatStore.test.ts`

| 用例 | 断言 |
|------|------|
| 发送后状态 | 新消息初始 `status='sending'`。 |
| 状态流转 | `timeScale=0` 下，最终所有自己消息变为 `read`。 |
| Agent 回复 | 发送消息后，对应会话出现 Agent 回复消息。 |
| 正在输入 | 发送消息后 `typingConversations[conversationId]` 先 true 后 false。 |
| 未读数 | 用户不在该会话时，Agent 回复后 `unreadCount` 增加。 |

### 9.3 集成测试：`src/__tests__/chat-flow.test.tsx`

- 更新现有测试，发送消息后断言：
  1. 自己消息出现在消息流。
  2. 最终出现 Agent 回复（使用 `timeScale=0`）。
  3. 返回列表后，最后消息预览更新为 Agent 回复或用户消息。

---

## 10. 验收标准

1. 发送文字消息后，状态图标依次为单灰 → 双灰 → 双绿。
2. 5 个 Agent 的回复风格与人设明显不同，关键词能触发对应话题。
3. Agent 回复前按概率出现"对方正在输入…"。
4. 用户不在聊天页时，Agent 回复增加未读红点。
5. 全部测试通过：`npm test` 0 失败。
6. `npm run build` 无类型错误。

---

## 11. 风险与应对

| 风险 | 应对 |
|------|------|
| Agent 回复风格不稳定 | 先按规则模板实现，Sprint 4 再调优；本次规则权重已覆盖基本差异。 |
| 状态流转测试 flaky | 使用 `timeScale: 0` 并配合 `waitFor`，避免真实等待。 |
| 未读数与当前会话判断耦合 | 在 store 中读取 app store 当前会话 id，封装成私有函数，方便后续改为事件驱动。 |
| 多消息快速发送导致状态混乱 | 每条消息独立调度，状态更新按 messageId 精确匹配。 |

---

## 12. 后续可扩展点

- 接入真 LLM：替换 `generateReply` 内部实现，保持 `ReplyPlan` 接口不变。
- 更丰富的上下文：把最近消息作为规则匹配的 context 输入。
- 活跃时段/在线状态：根据 `contact.isOnline` 决定是否 delivery/read。
- 消息引用/撤回：Sprint 3+ 再评估。

---

*文档状态：待审阅*  
*下一步：用户审阅后，调用 `writing-plans` 制定实现计划。*
