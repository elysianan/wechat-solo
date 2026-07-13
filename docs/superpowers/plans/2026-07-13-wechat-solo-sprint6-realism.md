# WeChat Solo Sprint 6 实施计划：对话真实感冲刺

**日期**：2026-07-13
**设计文档**：`docs/superpowers/specs/2026-07-13-wechat-solo-sprint6-realism-design.md`
**分支**：`feat/sprint6-realism`（从 master 切出）

每个 Task 遵循「先写失败测试 → 实现 → 全量回归 → 提交」的节奏。

---

## 任务拆解

### Task 1：规则库重组 + persona 版本机制 + 旧数据升级

1. `src/data/personas/` 新建目录，按人设拆 5 个文件（mom/buddy/landlord/lisa/boss），**规则内容原样搬运不扩充**（扩容在 Task 6）。
2. `personas/index.ts`：汇总导出 `PERSONAS`、`PERSONA_VERSION = 2`；`AgentPersona` 类型加 `version / initiateChance / initiateTopics`（initiateTopics 先给空数组占位，Task 6 填）。
3. `seed.ts` 移除内联 rules，改为引用 personas。
4. `db/init.ts`：contacts 非空且 persona.version ≠ PERSONA_VERSION（缺失视为 0）→ Dexie 事务内按 id 重写 persona 字段，messages/conversations/tags/moments 不动。
5. 测试：拆分后种子等价性（联系人数量/规则条数基线）；旧版本 persona 升级后刷新、消息行数不变；升级幂等（二次执行无副作用）。

### Task 2：引擎 · context 匹配 + 时段感知

1. `src/utils/timeWindow.ts`：`getTimeWindow(now): TimeWindow`（morning 6-11 / afternoon 11-14 / evening 14-22 / night 22-6）。
2. `types`：`ReplyTrigger` 加 `timeWindow?: TimeWindow[]`；`GenerateReplyInput.options` 加 `now?: number`。
3. `engine.ts`：`matchesRule` 启用 context（recentMessages 最近 5 条文本拼接 includes）；`selectRule` 前按 timeWindow 过滤候选。
4. 测试：context 命中/未命中；timeWindow 过滤（注入 now）；两条件叠加；缺省字段向后兼容。

### Task 3：引擎 · 防重复 + maxUsageInSession + 模板替换

1. `GenerateReplyInput.options` 加 `sessionUsedResponses?: Set<string>` / `sessionRuleUsage?: Map<string, number>`。
2. `engine.ts`：选 response 时跳过已用过的（全部用过则重置该规则的已用集）；`maxUsageInSession` 用尽的规则剔除候选；模板 `{keyword}` / `{nickname}` 替换。
3. `chatStore`：维护 session 级 Set/Map（切换 conversation 不重置，刷新页面清零），调用引擎时注入。
4. 测试：20 轮不重复（规则台词 ≥3 条时）；maxUsageInSession 生效；{keyword} 回引命中关键词；{nickname} 替换。

### Task 4：剧情链机制

1. `types`：`StoryChain` 类型；`Conversation` 加 `storyProgress?: { chainId, step }`。
2. `personas`：3 条剧情链数据（mom-marriage 5 步 / buddy-dinner 4 步 / landlord-rent 3 步）。
3. `engine.ts`：剧情优先分支——进行中剧情按 advanceKeywords 推进/拉回/脱离；无剧情时 triggerKeywords + triggerChance 判定进入；剧情中跳过已读不回（forceReply 语义）。
4. `chatStore`：引擎返回后把 storyProgress 变化持久化到 conversation。
5. 测试：完整走完 3 条剧情；跑题 50% 两分支（钉死 random）；最后一步后清除进度；群聊不触发剧情。

### Task 5：好友主动发起对话调度器

1. `Conversation` 加 `lastInitiatedAt?: number`。
2. `chatStore`：`startInitiateScheduler(timeScale)` / `stopInitiateScheduler()`——每 60s×timeScale 检查：全局冷却 90s、单联系人冷却 5 分钟，按 initiateChance 加权选人，从 initiateTopics 取未用过的话题注入为对方消息（未读 +1），写 lastInitiatedAt。
3. 聊天列表页 mount 启动 / unmount 停止。
4. 测试：fake timers 推进注入；双冷却生效；选人加权（钉死 random）；unmount 后不再注入；刷新后冷却仍有效（lastInitiatedAt 持久化）。

### Task 6：规则库内容扩容

1. 每人设规则扩至 15~25 条，覆盖 spec §4.1 话题池；每规则 3~6 句台词，≥1/3 含 `{keyword}`。
2. 时段规则：每人设至少 2 条 timeWindow 规则（含深夜档）。
3. context 规则：每人设至少 2 条（如妈妈 context「对象」+ keyword「忙」→「再忙也得考虑终身大事」）。
4. `initiateTopics` 每人 5~8 条（spec §4.3 方向）。
5. 测试：基线断言（规则数/台词数下限、模板占比、时段覆盖），不断言具体内容（交接单决策 5）。

### Task 7：全量回归 + 文档 + 推送 + 更新 Demo

1. 全量测试 + tsc + lint + build；dev server 冒烟（20 轮对话、剧情走完、主动发起实测）。
2. README / 作品集文档更新至 v1.6.0（新增「对话真实感」卖点）。
3. 合并 master、双推 Gitee + GitHub、重新部署 gh-pages、打 tag `sprint-6-complete`。
4. 更新交接单记忆。

---

## 验收清单

- [ ] 与阿杰连续聊 20 轮，无重复台词；说「加班」时回复带「加班」
- [ ] 深夜（可改系统时间或注入 now 验证）发「在吗」→ 妈妈「这么晚还不睡？」类回复
- [ ] 说「相亲」→ 妈妈进入催婚剧情，5 步走完自然收尾；中途跑题能脱离
- [ ] 聊天列表停留期间，有好友主动发消息；90s 内不重复
- [ ] 旧版本数据的浏览器打开后规则刷新、历史聊天记录保留
- [ ] 全量测试通过、tsc/lint/build 干净、在线 Demo 更新

---

## 风险备忘

- Task 4 与既有已读不回/群回复逻辑的交叉：剧情仅单聊、剧情中强制回复，降低交叉面
- Task 5 调度器与 React 生命周期：务必 unmount 清理 timer（测试覆盖）
- Task 6 放最后：机制测试全部先行，内容扩容只影响基线断言
