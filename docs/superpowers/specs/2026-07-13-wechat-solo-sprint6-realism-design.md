# WeChat Solo Sprint 6 设计规格：对话真实感冲刺

**版本**：v1.6.0-Sprint6
**日期**：2026-07-13
**范围**：规则库扩容、上下文感知、回复防重复、时间感知、多轮剧情链、好友主动发起对话
**依赖**：Sprint 0 ~ Sprint 5 + 在线 Demo 部署已完成（master `bfb9602`）

---

## 1. 目标与成功标准

### 1.1 目标

把单聊体验从「聊 3 句就露馅」提升到「聊 20 句不露馅」。
现状诊断：机械感的根源不是规则引擎架构不行，而是**内容量级不足**（5 人设共 13 条规则、每规则 2~3 句台词）+ **引擎预留的上下文能力未启用**（`context` / `maxUsageInSession` 字段已定义但未读取）。本 Sprint 不接 LLM，纯靠内容工程 + 引擎机制补齐真实感。

### 1.2 成功标准

| 维度 | 标准 |
|------|------|
| 防重复 | 同一聊天窗口连续 20 轮对话，不出现完全相同的 Agent 台词 |
| 上下文 | 用户消息命中话题关键词时，Agent 回复能回引该关键词（如用户说「加班」→ 回复含「加班」） |
| 剧情 | 3 条多轮剧情链可完整走完（妈妈催婚 / 阿杰约饭 / 房东催租），中途跑题时自然脱离不卡死 |
| 时间感 | 早 / 中 / 晚 / 深夜四个时段，同一句「在吗」得到符合时段的回复（如深夜妈妈「这么晚还不睡？」） |
| 主动性 | App 前台停留期间，好友按人设概率主动发起对话；有全局冷却，不刷屏 |
| 数据兼容 | 旧 IndexedDB 数据升级后：规则库刷新为新版本，历史聊天记录完整保留 |
| 可测试性 | 引擎新机制全部单测覆盖；概率类测试沿用 `db.contacts.modify` 钉死概率的手法 |
| 范围可控 | 不做 LLM 接入、不做新消息类型（图片/语音/红包留给 Sprint 7）、不做剧情 UI 编辑器 |

---

## 2. 范围边界

### 2.1 做

- **规则库重组**：从 `seed.ts` 拆分到 `src/data/personas/`（每人设一个文件），每人设扩充至 15~25 条规则
- **引擎 · 上下文匹配**：启用 `ReplyTrigger.context`——最近 5 条消息含指定关键词才命中该规则
- **引擎 · 防重复**：启用 `maxUsageInSession`；session 内已用过的 response 不重复选取
- **引擎 · 模板变量**：responses 支持 `{keyword}`（回引命中的用户关键词）与 `{nickname}`（用户昵称）
- **引擎 · 时间感知**：规则新增 `timeWindow` 触发条件（morning / afternoon / evening / night）
- **剧情链**：conversation 级状态机，进度持久化到 IndexedDB；3 条剧本
- **主动发起对话**：App 前台调度器，按人设概率 + 冷却时间注入好友消息，话题池每人 5~8 条
- **旧数据升级**：`personaVersion` 检测，版本不一致时重写 contact.persona，消息与会话数据不动

### 2.2 不做

- 真实 LLM 接入（用户已拍板暂缓）
- 图片 / 语音 / 红包等新消息类型（Sprint 7 范围）
- 群聊剧情链（剧情仅做单聊；群聊享受规则库扩容红利即可）
- 剧情可视化编辑器、主动发起的设置开关 UI（用常量控制）
- 好友主动发起语音 / 视频通话

---

## 3. 架构设计

### 3.1 数据模型变更

```ts
// 时段枚举
type TimeWindow = 'morning' | 'afternoon' | 'evening' | 'night';
// 划分:morning 6-11, afternoon 11-14, evening 14-22, night 22-6(深夜单独成档,台词最有辨识度)

// ReplyTrigger 扩展(已有 keywords/patterns/context/default,启用 context,新增 timeWindow)
interface ReplyTrigger {
  keywords?: string[];
  patterns?: RegExp[];
  context?: string[];        // 本次启用:最近 5 条消息文本含任一关键词才命中
  timeWindow?: TimeWindow[]; // 新增:仅指定时段命中;缺省表示全时段
  default?: boolean;
}

// AgentPersona 增加版本号(旧数据无此字段视为 0)
interface AgentPersona {
  ...
  version: number;
  initiateChance: number;     // 主动发起对话的权重(相对概率,见 3.4)
  initiateTopics: string[];   // 主动发起话题池
}

// 剧情链(种子数据,不存表;进度存 conversation)
interface StoryChain {
  id: string;
  contactId: string;
  triggerKeywords: string[];   // 用户消息命中后可能进入剧情
  triggerChance: number;       // 命中时进入剧情的概率(避免每次都进)
  steps: Array<{
    replies: string[];         // 该步 Agent 台词,随机取一
    advanceKeywords?: string[];// 用户回复含这些词才推进到下一步;缺省=任意回复都推进
  }>;
}

// Conversation 扩展
interface Conversation {
  ...
  storyProgress?: { chainId: string; step: number }; // 进行中剧情;缺省=无
  lastInitiatedAt?: number;                          // 该联系人上次主动发起的时间戳
}
```

### 3.2 引擎改造（`src/agents/engine.ts`）

`generateReply` 保持纯函数签名不变，内部流程调整为：

1. **剧情优先**：`conversation.storyProgress` 存在 → 走剧情推进（见 3.3），不再走普通规则
2. **时段过滤**：当前时段不在 `rule.timeWindow` 内的规则从候选池剔除
3. **context 匹配**：`matchesRule` 增加 context 判定——`recentMessages` 最近 5 条文本拼接后 `includes` 任一 context 关键词才算命中
4. **剧情触发**：无进行中剧情时，用户消息命中某 chain 的 `triggerKeywords` 且 `triggerChance` 掷骰通过 → 返回剧情 step 0 台词，并（由调用方）写入 `storyProgress`
5. **普通规则**：命中规则 → 加权随机 → 选 response 时跳过 session 已用过的（`maxUsageInSession` 用完的规则直接剔除候选）
6. **模板替换**：response 中 `{keyword}` 替换为本次命中的用户关键词（多个命中取第一个），`{nickname}` 替换为用户昵称

引擎需要新增的可注入状态（保持纯函数）：

```ts
interface GenerateReplyInput {
  ...
  options?: {
    timeScale?: number;
    forceReply?: boolean;
    now?: number;                    // 当前时间戳(测试注入,默认 Date.now())
    sessionUsedResponses?: Set<string>;     // 本会话已用台词(调用方维护)
    sessionRuleUsage?: Map<string, number>; // 本会话规则使用计数
  };
  conversation?: Conversation;       // 读取 storyProgress(单聊才传)
}
```

### 3.3 剧情推进逻辑

- `storyProgress` 存在且用户消息含当前步 `advanceKeywords`（缺省则任意回复）→ 推进到下一步，返回该步台词；已是最后一步 → 清除 `storyProgress`，本次回归普通规则（剧情感收尾后自然切换话题）
- 用户消息**不含**推进关键词 → 50% 概率「拉回来」（重读当前步台词池取一条），50% 概率脱离剧情（清除进度，走普通规则）——模拟真人对跑题的反应
- 剧情在群聊会话不生效（调用方单聊才传 conversation）

### 3.4 主动发起对话调度器

- 位置：`src/stores/` 新增 `initiateScheduler`（或并入 chat store），聊天列表页 mount 时启动、unmount 时停止
- 节奏：每 60s（× timeScale）检查一次；全局冷却 90s 内不重复注入
- 选人：按 `persona.initiateChance` 加权随机（妈 6 / 阿杰 5 / 房东 2 / Lisa 1.5 / 张总 1），同一联系人距上次主动发起 < 5 分钟（× timeScale）跳过
- 内容：从该联系人 `initiateTopics` 随机取一条（session 防重复复用引擎同款机制），注入为对方消息，未读数 +1
- 持久化：`conversation.lastInitiatedAt` 写表，刷新页面后冷却仍然有效
- 测试：fake timers + `replyTimeScale: 0`，钉死 `initiateChance` 验证选人逻辑

### 3.5 旧数据升级（`initializeDatabase` 幂等逻辑扩展）

- `PERSONA_VERSION` 常量定义在 `src/data/personas/index.ts`
- 升级判定：contacts 表非空 且 任一 contact.persona.version ≠ PERSONA_VERSION（缺失视为 0）→ 按 id 匹配重写每个 contact 的 persona 字段
- **严格只改 persona**：messages / conversations / tags / moments 一律不动
- `storyProgress` / `lastInitiatedAt` 为可选字段，旧数据缺失即视为无状态，无需迁移
- 升级过程包在 Dexie 事务里，失败回滚

### 3.6 文件结构

```
src/data/personas/
  index.ts          # 汇总导出 PERSONAS + PERSONA_VERSION + STORY_CHAINS
  mom.ts            # 王阿姨:规则 15~25 条 + 催婚剧情 + 主动话题池
  buddy.ts          # 阿杰:规则 + 约饭剧情 + 话题池
  landlord.ts       # 刘房东:规则 + 催租剧情 + 话题池
  lisa.ts           # Lisa:规则 + 话题池
  boss.ts           # 张总:规则 + 话题池
src/data/seed.ts    # 移除内联 rules,改为引用 personas(体积从 488 行回落)
```

---

## 4. 内容设计方向

### 4.1 规则库话题覆盖（每人设 15~25 条）

通用话题池（按人设差异化语气）：工作/加班、吃饭、天气、节日、健康、吐槽、早晚安、借钱/经济、周末安排、游戏（阿杰重）、催婚（妈妈重）、房租（房东重）、理财/职场（Lisa 重）、项目/汇报（张总重）。

每条规则 3~6 句台词，至少 1/3 的台词含 `{keyword}` 回引模板。

### 4.2 三条剧情链

| 剧情 | 触发词 | 步数 | 剧情线 |
|------|--------|------|--------|
| 妈妈 · 催婚 | 对象 / 相亲 / 结婚 / 单身 | 5 | 近况寒暄 → 旁敲侧击 → 直接催 → 举邻居例子 → 「你自己上心」收尾 |
| 阿杰 · 约饭 | 吃 / 饭 / 聚 / 火锅 / 烧烤 | 4 | 提议 → 定时间 → 改期波折 → 成行 |
| 房东 · 催租 | 房租 / 租金 / 宽限 | 3 | 提醒 → 宽限商量 → 到账确认 |

### 4.3 主动话题池（每人 5~8 条示例）

- 妈妈：「吃饭了吗」「天冷了多穿点」「看到个养生文章发你」
- 阿杰：「晚上开黑？」「周末出来嗨」「笑死，给你看个视频」
- 房东：「下个月房租记得按时交」「最近房子没什么问题吧」
- Lisa：「在忙吗」「最近有没有看新的理财」
- 张总：「方案改完发我」「明天早上过一下进度」

---

## 5. 测试策略

- **引擎纯函数**：context / timeWindow / 防重复 / maxUsageInSession / 模板替换 / 剧情推进与脱离，全部注入 `now` 与 session 状态测试，沿用 `replyTimeScale: 0`
- **概率类**：`db.contacts.modify` 钉死 `initiateChance` / `triggerChance` 后断言（交接单既有手法）
- **升级测试**：构造 `version: 0`（缺失）的旧 persona 数据 → `initializeDatabase` → 断言 persona 刷新为新版本且 messages 行数不变
- **主动发起**：fake timers 推进调度器，断言消息注入、冷却生效、unmount 后停止
- **布局契约**：本 Sprint 无新页面，无需新增契约测试

---

## 6. 任务拆分（plan 阶段细化）

| # | 任务 | 要点 |
|---|------|------|
| T1 | 规则库重组 + 版本机制 + 升级逻辑 | 拆文件、PERSONA_VERSION、initializeDatabase 升级分支（地基，先动） |
| T2 | 引擎：context + timeWindow 匹配 | 启用预留字段，时段工具函数 |
| T3 | 引擎：防重复 + maxUsageInSession + 模板替换 | session 状态注入，{keyword}/{nickname} |
| T4 | 剧情链机制 | 状态机 + conversation 持久化 + 3 条剧本数据 |
| T5 | 主动发起对话调度器 | store 调度 + 冷却 + 持久化 + 页面挂载生命周期 |
| T6 | 规则库内容扩容 | 每人设 15~25 条 + 话题池 + 剧情台词（内容工作量最大） |
| T7 | 全量回归 + 文档 + 推送 + 更新在线 Demo | 含 gh-pages 重新部署 |

## 7. 风险与对策

| 风险 | 对策 |
|------|------|
| 剧情链与已读不回 / 群回复等既有逻辑交叉出 bug | 剧情仅单聊生效；剧情优先级高于已读不回（进入剧情=用户正在认真聊，必回） |
| 主动发起在演示时刷屏 | 全局冷却 90s + 单联系人冷却 5 分钟（均 × timeScale） |
| 规则库扩容后测试基线漂移（种子内容假设） | 交接单决策 5：测试用基线断言，不假设具体内容；T6 放在最后做，机制测试先行 |
| session 防重复状态与 React 渲染时序冲突 | 状态放 Zustand store（非组件 state），引擎只读注入 |

---

## 8. 与 Sprint 7/8 的衔接

- Sprint 7（图片/语音/红包消息）：本 Sprint 的引擎改造不影响消息类型扩展；剧情链台词后续可支持发送图片消息
- Sprint 8（视觉走查）：独立进行，无依赖
