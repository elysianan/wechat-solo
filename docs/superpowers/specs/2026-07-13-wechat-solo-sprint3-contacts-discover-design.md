# WeChat Solo Sprint 3 设计规格：通讯录与发现页

**版本**：v1.2.0-Sprint3  
**日期**：2026-07-13  
**范围**：通讯录列表/搜索/字母索引、好友资料页、发现页入口、朋友圈列表/点赞/评论  
**依赖**：Sprint 0 ~ Sprint 2 已完成；当前分支 `feat/sprint3-contacts-discover`  

---

## 1. 目标与成功标准

### 1.1 目标

1. 实现高保真通讯录：搜索、字母分组、字母索引、好友资料页。
2. 实现发现页入口矩阵，仅朋友圈为真实功能，其余入口弹 Toast。
3. 实现朋友圈列表、点赞/评论，并持久化到 IndexedDB。
4. 将子页面（聊天详情、好友资料、朋友圈）统一纳入轻量页面栈，统一从右向左滑入动画。

### 1.2 成功标准

| 维度 | 标准 |
|------|------|
| 还原度 | 通讯录、发现页、朋友圈在布局和交互上接近微信原生。 |
| 搜索体验 | 支持中文名字包含匹配与拼音首字母匹配。 |
| 页面转场 | 子页面进入/退出均有从右向左滑入/滑出动画。 |
| 数据持久化 | 点赞、评论刷新后仍在。 |
| 可测试性 | 页面栈、通讯录搜索、朋友圈交互均有单测覆盖。 |
| 范围可控 | 不做群聊、不做标签管理、不做真图片上传。 |

---

## 2. 范围边界

### 2.1 本 Sprint 内做

- 轻量级页面栈改造（`useAppStore` + `App.tsx`）。
- 通讯录列表、搜索、字母分组、字母索引、顶部占位入口。
- 好友资料页（只读展示 + “发消息”跳转）。
- 发现页入口列表，非朋友圈入口 Toast 提示。
- 朋友圈列表、封面区、点赞、评论、图片网格。
- 相关单元测试与集成测试。

### 2.2 本 Sprint 内不做

- 群聊、联系人标签管理（P2 / v2.0）。
- 真实图片上传与图片查看器。
- 朋友圈评论回复某人、@某人。
- 扫一扫/摇一摇/附近的人真实功能。
- 深色模式适配。
- 支付页、设置页、个人信息编辑（Sprint 4）。

---

## 3. 架构设计

### 3.1 分层职责

| 层级 | 职责 | 关键文件 |
|------|------|----------|
| **路由层** | 维护页面栈，支持 push/pop 与统一转场。 | `useAppStore.ts`、`App.tsx` |
| **数据层** | 联系人、朋友圈的读取与更新。 | `useContactStore.ts`、`useMomentStore.ts` |
| **页面层** | 通讯录、资料页、发现页、朋友圈整页。 | `ContactsPage`、`ContactDetailPage`、`DiscoverPage`、`MomentsPage` |
| **组件层** | 可复用 UI 单元。 | `AlphabetIndex`、`ContactListSection`、`MomentCard`、`BottomInputSheet` |

### 3.2 新增/修改文件

```
src/
├── App.tsx                              # 修改：基于 pageStack 渲染栈顶页面
├── stores/
│   ├── useAppStore.ts                   # 修改：pageStack 路由栈
│   ├── useContactStore.ts               # 修改：搜索、筛选
│   └── useMomentStore.ts                # 修改：toggleLike、addComment
├── pages/
│   ├── ContactsPage.tsx                 # 修改：完整通讯录
│   ├── ContactDetailPage.tsx            # 新增
│   ├── DiscoverPage.tsx                 # 修改：入口列表
│   └── MomentsPage.tsx                  # 新增
├── components/
│   ├── contacts/
│   │   ├── AlphabetIndex.tsx            # 新增
│   │   ├── ContactListSection.tsx       # 新增
│   │   └── ContactTopEntries.tsx        # 新增（新的朋友/群聊/标签）
│   └── moments/
│       ├── MomentCard.tsx               # 新增
│       ├── MomentCoverHeader.tsx        # 新增
│       ├── MomentImageGrid.tsx          # 新增
│       └── BottomInputSheet.tsx         # 新增
├── data/seed.ts                         # 修改：增加带图片的朋友圈动态
├── __tests__/
│   ├── AppRouting.test.tsx              # 修改：页面栈行为
│   ├── pages/ContactsPage.test.tsx      # 新增
│   ├── pages/ContactDetailPage.test.tsx # 新增
│   ├── pages/DiscoverPage.test.tsx      # 新增
│   ├── pages/MomentsPage.test.tsx       # 新增
│   └── stores/momentStore.test.ts       # 修改：点赞/评论
└── package.json                         # 修改：新增 pinyin-pro 依赖
```

---

## 4. 页面栈与路由

### 4.1 页面栈结构

```typescript
type PageRoute =
  | { type: 'tabs' }
  | { type: 'chat-detail'; conversationId: string }
  | { type: 'contact-detail'; contactId: string }
  | { type: 'moments' };

interface AppState {
  currentTab: Tab;
  pageStack: PageRoute[];
  pushPage: (route: PageRoute) => void;
  popPage: () => void;
  navigateToChatDetail: (conversationId: string) => void;
  navigateToContactDetail: (contactId: string) => void;
  navigateToMoments: () => void;
  navigateBackToTabs: () => void; // 清空栈回到 tabs
}
```

### 4.2 行为规则

- 栈底始终为 `{ type: 'tabs' }`，不可弹出。
- `pushPage` 向栈顶追加页面，`popPage` 弹出栈顶（至少保留 tabs）。
- 从好友资料页点击“发消息”时，先 `popPage()` 再 `pushPage({ type: 'chat-detail', conversationId })`，保证返回直接回到通讯录。
- 渲染时取栈顶元素；非 `tabs` 时隐藏底部 TabBar。
- 转场动画仍使用 `translate-x`，新页面从 `translate-x-full` 滑入，旧页面往左移出。

### 4.3 与现有路由测试的兼容

- 现有测试依赖 `currentPage === 'chat-detail'` 和 `navigateBackToTabs`。
- 改造后 `navigateToChatDetail` 内部 push，`navigateBackToTabs` 清空栈回到 tabs；测试断言改为判断栈顶 route type。

---

## 5. 通讯录

### 5.1 页面结构

```
ContactsPage
├── Header（标题：通讯录）
├── SearchBar（搜索框，固定/吸顶）
├── ContactTopEntries（新的朋友 / 群聊 / 标签）
├── ContactListSection[]（按字母分组）
└── AlphabetIndex（右侧 A-Z 索引）
```

### 5.2 字母分组规则

- 按联系人姓名首字拼音首字母分组。
- 无拼音结果（理论上无）归入 `#` 组。
- 分组按 A-Z 排序，`#` 放最后。
- 每组顶部显示字母标题。

### 5.3 字母索引

- 右侧悬浮 A-Z 竖条。
- 点击字母滚动到对应分组；若该字母无联系人，不响应或给出轻微反馈。
- 滚动列表时高亮当前可见分组对应的字母。

### 5.4 搜索匹配

- 使用 `pinyin-pro` 提取每个联系人姓名的拼音与首字母。
- 匹配规则（输入 keyword，不区分大小写）：
  1. 名字包含 keyword。
  2. 名字拼音首字母串包含 keyword（如 “王阿姨” → “way” → 匹配 “wa”“way”）。
  3. 名字全拼包含 keyword（如 “wangayi” → 匹配 “wang”）。
- 搜索时隐藏字母索引，结果平铺展示。

### 5.5 顶部占位入口

- “新的朋友”“群聊”“标签”三个 cell。
- 点击统一弹出 `WeChatToast`：“演示模式 · 该功能仅供展示”。

### 5.6 好友资料页

- 入口：点击通讯录联系人。
- 展示：大头像、昵称、微信号、地区、个性签名、只读标签列表。
- 底部操作区：“发消息”按钮。
- 点击“发消息”：先 pop 资料页，再 push 对应 chat-detail。

---

## 6. 发现页

### 6.1 页面结构

- 微信风格分组列表 cell。
- 第一组：朋友圈（真实功能，点击进入 `MomentsPage`）。
- 第二组：扫一扫、摇一摇、附近的人（占位，点击 Toast）。
- 第三组：购物、游戏、小程序（占位，点击 Toast）。

### 6.2 交互

- 除朋友圈外，所有入口点击弹出 `WeChatToast`：“演示模式 · 该功能仅供展示”。
- 朋友圈 cell 右侧显示箭头或小红点提示（本 Sprint 不做数字提示）。

---

## 7. 朋友圈

### 7.1 页面结构

```
MomentsPage
├── MomentCoverHeader（封面 + 我的头像/昵称）
└── MomentCard[]
    ├── AuthorHeader（头像、昵称、时间）
    ├── Content（文字）
    ├── MomentImageGrid（图片网格，可选）
    ├── ActionBar（点赞、评论按钮）
    ├── LikesList（点赞人名字列表）
    └── CommentsList（评论列表）

BottomInputSheet（评论输入，从底部弹出）
```

### 7.2 封面区

- 顶部占位的封面图，使用 CSS 渐变（如 `bg-gradient-to-b from-blue-300 to-blue-100`）。
- 右下角显示“我”的头像和昵称。
- 顶部 Header 透明或覆盖在封面上，左侧返回按钮。

### 7.3 图片网格

- 根据 `images.length` 选择布局：
  - 1 张：最大宽度，保持比例。
  - 2 张：一行两列。
  - 3 张：一行三列。
  - 4 张：2×2。
  - 6 张：3×2。
  - 9 张：3×3。
- 其他数量按最接近的微信常见布局处理（如 5 张按 3+2，7 张按 3+4，8 张按 3+3+2）。
- 图片使用纯色/渐变占位图或固定 data URI 占位图，不引入真实图片资源，避免增加素材管理成本。

### 7.4 点赞

- 点击心形图标：
  - 若“我”未点赞，追加 `{ contactId: 'me', createdAt: Date.now() }`。
  - 若已点赞，移除“我”的 like。
- 红心根据是否已点赞切换颜色。
- 点赞名单按时间顺序显示为 “Lisa、阿杰、王阿姨”。

### 7.5 评论

- 点击评论图标，底部弹出 `BottomInputSheet`（带输入框和发送按钮）。
- 输入内容后点击发送，追加评论：
  ```typescript
  { id: makeId('comment'), contactId: 'me', content, createdAt: Date.now() }
  ```
- 评论 ID 使用项目内统一的 ID 生成器（可复用 `data/seed.ts` 中的逻辑并提取到 `utils/id.ts`），保证唯一性。
- 评论仅支持纯文本，不支持回复某人（v2.0 扩展）。

### 7.6 数据持久化

- `useMomentStore` 新增：
  - `toggleLike(momentId: string)`
  - `addComment(momentId: string, content: string)`
- 操作后直接更新 IndexedDB `moments` 表与 Zustand state。
- 首次进入朋友圈时 `loadMoments()` 从 DB 加载。

---

## 8. 数据模型变更

### 8.1 不变的部分

- `Contact`、`Me`、`Moment`、`Conversation`、`Message` 等类型字段不变。
- IndexedDB 表结构不变，`moments` 表已有 `likes` 与 `comments`。

### 8.2 新增/修改的 store 接口

```typescript
// useAppStore
interface AppState {
  currentTab: Tab;
  pageStack: PageRoute[];
  pushPage: (route: PageRoute) => void;
  popPage: () => void;
  setCurrentTab: (tab: Tab) => void;
  navigateToChatDetail: (conversationId: string) => void;
  navigateToContactDetail: (contactId: string) => void;
  navigateToMoments: () => void;
  navigateBackToTabs: () => void;
}

// useContactStore
interface ContactState {
  me: Me | null;
  contacts: Contact[];
  loaded: boolean;
  searchKeyword: string;
  loadContacts: () => Promise<void>;
  setSearchKeyword: (keyword: string) => void;
  filteredContacts: Contact[]; // 派生
}

// useMomentStore
interface MomentState {
  moments: Moment[];
  loaded: boolean;
  loadMoments: () => Promise<void>;
  toggleLike: (momentId: string) => Promise<void>;
  addComment: (momentId: string, content: string) => Promise<void>;
}
```

---

## 9. 测试计划

### 9.1 路由测试：`AppRouting.test.tsx`

| 用例 | 断言 |
|------|------|
| 默认显示 Tab 层 | 栈顶为 `tabs`，TabBar 可见。 |
| 进入聊天详情 | `navigateToChatDetail` 后栈顶为 `chat-detail`。 |
| 从资料页发消息 | `contact-detail` → `chat-detail`，返回直接到 `tabs`。 |
| 返回上一页 | `popPage` 后回到上一页。 |
| 返回 Tab 主页 | `navigateBackToTabs` 清空栈。 |

### 9.2 通讯录测试：`ContactsPage.test.tsx`

| 用例 | 断言 |
|------|------|
| 渲染字母分组 | 每个首字母出现组头。 |
| 搜索中文 | 输入“王”只显示王阿姨。 |
| 搜索拼音首字母 | 输入“wa”匹配王阿姨。 |
| 点击联系人 | 进入 `contact-detail`。 |
| 顶部入口 Toast | 点击“新的朋友”弹出 Toast。 |

### 9.3 资料页测试：`ContactDetailPage.test.tsx`

| 用例 | 断言 |
|------|------|
| 展示信息 | 头像、昵称、微信号、地区、签名、标签均可见。 |
| 发消息跳转 | 点击后栈顶变为 `chat-detail`，conversationId 正确。 |

### 9.4 发现页测试：`DiscoverPage.test.tsx`

| 用例 | 断言 |
|------|------|
| 朋友圈入口 | 点击进入 `moments`。 |
| 其他入口 Toast | 点击扫一扫/摇一摇等弹出 Toast。 |

### 9.5 朋友圈测试：`MomentsPage.test.tsx`

| 用例 | 断言 |
|------|------|
| 列表渲染 | 渲染 seed 中的动态。 |
| 点赞切换 | 点心后 likes 包含 me，再点移除。 |
| 评论发布 | 输入评论后，评论列表出现“我”的内容。 |
| 持久化 | 点赞/评论后刷新 store，状态保持。 |
| 图片网格 | 带图片动态正确渲染网格。 |

### 9.6 Store 测试：`momentStore.test.ts`

| 用例 | 断言 |
|------|------|
| toggleLike | 更新 likes 数组并写库。 |
| addComment | 追加 comment 并写库。 |

---

## 10. 验收标准

1. 通讯录按 A-Z 分组，支持中文与拼音首字母搜索。
2. 右侧字母索引可点击跳转，滚动时高亮对应字母。
3. 好友资料页展示完整信息，点击“发消息”进入对应聊天。
4. 发现页入口矩阵中，仅朋友圈可进入，其余弹 Toast。
5. 朋友圈列表支持文字、图片、点赞、评论，刷新后点赞/评论不丢失。
6. 子页面（聊天详情、资料页、朋友圈）均有从右向左滑入/滑出动画。
7. 全部测试通过：`npm test` 0 失败。
8. `npm run build` 无类型错误。

---

## 11. 风险与应对

| 风险 | 应对 |
|------|------|
| 页面栈改造影响现有路由测试 | 先改 `useAppStore` 与 `AppRouting.test.tsx`，再基于新接口开发新页面。 |
| 拼音库增加包体积 | 使用 `pinyin-pro` 的 tree-shake API，仅引入首字母提取函数。 |
| 朋友圈图片网格布局复杂 | 先覆盖 1/2/3/4/6/9 张最常见场景，其他数量降级处理。 |
| 点赞/评论状态与 DB 同步 | store action 内同步更新 Zustand 与 Dexie，避免状态漂移。 |
| Sprint 3 范围过大 | 严格不做评论回复、图片查看器、群聊、标签管理。 |

---

## 12. 后续可扩展点

- 图片查看器：点击图片全屏浏览。
- 评论回复某人：在评论中增加 `replyTo` 字段。
- 朋友圈发布：从封面区相机入口进入发布页。
- 联系人标签管理：从顶部“标签”入口进入。
- 扫一扫/摇一摇真实页面：v2.0 再评估。

---

*文档状态：待审阅*  
*下一步：用户审阅后，调用 `writing-plans` 制定实现计划。*
