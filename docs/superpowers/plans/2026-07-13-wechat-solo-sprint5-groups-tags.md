# WeChat Solo Sprint 5 实施计划：群聊与联系人标签

**日期**：2026-07-13  
**设计文档**：`docs/superpowers/specs/2026-07-13-wechat-solo-sprint5-groups-tags-design.md`  
**分支**：`feat/sprint5-groups-tags`（从 master 切出）

---

## 任务拆解

### Task 1：类型扩展 + 群种子数据 + 幂等补种

1. `types/index.ts`：Conversation 增加 `name? / avatar? / memberIds?`。
2. `public/avatar-group-family.svg` / `avatar-group-work.svg`：九宫格拼贴风格群头像（多色块 + 简化人形）。
3. `data/seed.ts`：`seedGroupConversations`（幸福一家人、产品研发群）+ 群历史消息（含多成员发言）。
4. `db/init.ts`：群会话不存在时幂等补种（不影响已有数据）。
5. 测试：补种幂等性、旧数据升级场景。

### Task 2：chatStore 群消息与群内 Agent 调度

1. `sendMessage` 支持群会话（conversation.type === 'group'）。
2. 群内回复调度：@解析（边界匹配、最长优先）→ 必回；无 @ → 每名成员按各自 groupReplyChance 独立判定。
3. 群未读数、群消息状态流（复用单聊 sending→sent→read 逻辑）。
4. 测试：@必回、多 @ 多人回、无 @ 两分支（mock random）、持久化。

### Task 3：聊天列表与详情适配群

1. `ChatPage`：群会话显示 name/avatar；预览格式「昵称：内容」。
2. `ChatDetailPage`：标题用群名；MessageBubble 增加 `showSenderName`（群聊且非自己的气泡显示昵称）。
3. 测试：群列表项、群详情气泡昵称。

### Task 4：@成员选择器

1. `MentionPicker` 组件：底部弹出成员列表，选中回调插入文本。
2. `MessageInput` 增加 `members?` prop：群聊时显示 @ 按钮，联动 MentionPicker，插入「@名字 」。
3. 测试：渲染成员、选中插入、单聊不显示 @ 按钮。

### Task 5：群资料页 + 群聊列表入口

1. 路由新增 `group-info {conversationId}` / `group-list`。
2. `GroupInfoPage`：成员头像网格（点击 → 好友资料页）、群名；从群聊 Header 点击进入。
3. `GroupListPage`：所有群会话列表；通讯录「群聊」入口接入。
4. 测试：成员网格、跳转、入口路由。

### Task 6：联系人标签管理

1. Dexie 升级 version 2 新增 `tags` 表（`id, name`）；`useContactStore`：`createTag / setContactTags / renameTag / deleteTag` + `loadTags / selectTagCounts`（tags 表 + db.contacts 双写，允许空标签）。
2. 路由新增 `tag-list` / `tag-detail {tag}`。
3. `TagListPage`：标签聚合计数列表；新建标签入口（输入名字 → 选成员）。
4. `TagDetailPage`：成员列表（移除）、添加成员（未打该标签的联系人列表）、重命名、删除标签。
5. 通讯录「标签」入口接入。
6. 测试：标签三件套 store 测试 + 两个页面测试。

### Task 7：契约测试补全 + 全量回归 + 收尾

1. `PageScrollLayout` 补 4 个新页面。
2. 全量测试 + tsc + lint + build；dev server 冒烟（群聊 @、标签增删实测）。
3. README / 作品集文档更新至 v1.5.0。
4. 合并 master、推送 Gitee、打 tag `sprint-5-complete`。

---

## 验收清单

- [ ] 聊天列表出现 2 个群，群名/头像正确
- [ ] 群聊发消息 @王阿姨 → 王阿姨必回；不带 @ 时概率有人接话
- [ ] 群内气泡显示发言者昵称，自己的不显示
- [ ] @ 按钮选成员插入文本，单聊无 @ 按钮
- [ ] 群资料页成员网格可点击进好友资料
- [ ] 通讯录 → 标签：新建/重命名/删除标签、增删成员，刷新后保留
- [ ] 旧数据（Sprint 4 的 IndexedDB）启动后自动补种群数据，不丢已有数据
- [ ] 全量测试通过，4 个新页面进入布局契约

---

*文档状态：待确认*
