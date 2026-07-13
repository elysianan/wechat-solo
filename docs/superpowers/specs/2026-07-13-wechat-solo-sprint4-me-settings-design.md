# WeChat Solo Sprint 4 设计规格：个人中心与最终打磨

**版本**：v1.3.0-Sprint4  
**日期**：2026-07-13  
**范围**：「我」页面、个人信息编辑、支付页 Mock、设置页（深色模式/关于）、底部水印、README 与作品集包装  
**依赖**：Sprint 0 ~ Sprint 3 已完成（tag `sprint-3-complete`）

---

## 1. 目标与成功标准

### 1.1 目标

1. 实现高保真「我」页面：个人信息卡 + 菜单分组。
2. 实现个人信息编辑（昵称、微信号、地区、签名），持久化到 IndexedDB。
3. 实现支付页 Mock：余额卡片 + 功能入口。
4. 实现设置页：深色模式开关（全局生效并持久化）、声音/震动开关、关于页。
5. 手机壳底部加水印，完成 UI 细节走查。
6. 完善 README 与作品集文档，为简历展示收尾。

### 1.2 成功标准

| 维度 | 标准 |
|------|------|
| 还原度 | 「我」页、支付页、设置页布局接近微信原生。 |
| 数据持久化 | 个人信息编辑、深色模式开关刷新后仍保留。 |
| 深色模式 | 切换后全应用（含聊天、通讯录、朋友圈）立即换肤，无页面级改动。 |
| 可测试性 | 新 store 与页面均有单测覆盖。 |
| 范围可控 | 收藏/相册/卡包/表情等仅展示，点击 Toast 提示「演示功能」。 |

---

## 2. 范围边界

### 2.1 本 Sprint 内做

- 「我」页面正式版（替换占位符）。
- 个人信息编辑页（路由 `profile-edit`）。
- 支付页 Mock（路由 `pay`）。
- 设置页（路由 `settings`）+ 关于页（路由 `about`）。
- 深色模式基础设施：CSS 变量主题 + `useSettingsStore`。
- 底部水印组件。
- 新功能单测、README 与作品集文档更新。

### 2.2 本 Sprint 内不做

- 收藏/相册/卡包/表情的真实功能（Toast 占位）。
- 真实支付逻辑、收付款二维码。
- 头像上传/裁剪（头像保持 SVG 占位）。
- 账号切换、退出登录。
- 深色模式下的图片/头像适配（头像 SVG 不随主题变色）。

---

## 3. 架构设计

### 3.1 深色模式方案

采用 **CSS 变量主题**，页面代码零改动：

1. `tailwind.config.js` 中 wechat 色板改为变量引用：

   ```js
   colors: {
     wechat: {
       green: '#07C160',
       'green-dark': '#06ad56',
       bg: 'var(--wechat-bg)',
       'text-primary': 'var(--wechat-text-primary)',
       'text-secondary': 'var(--wechat-text-secondary)',
       divider: 'var(--wechat-divider)',
       card: 'var(--wechat-card)',
     }
   }
   ```

2. `index.css` 定义浅色默认值与深色覆盖：

   ```css
   :root {
     --wechat-bg: #EDEDED;
     --wechat-card: #FFFFFF;
     --wechat-text-primary: #000000;
     --wechat-text-secondary: #888888;
     --wechat-divider: #E5E5E5;
   }
   [data-theme="dark"] {
     --wechat-bg: #111111;
     --wechat-card: #1C1C1E;
     --wechat-text-primary: #EDEDED;
     --wechat-text-secondary: #8A8A8A;
     --wechat-divider: #2C2C2E;
   }
   ```

3. 现有页面中 `bg-white` / `bg-gray-*` 等硬编码颜色，在本 Sprint 顺手替换为 `bg-wechat-card` / `bg-wechat-bg`（仅触碰会露出违和的容器级元素，不做逐像素改造）。

4. `useSettingsStore` 负责：加载 `db.settings`、切换 `darkMode` 时写回 DB，并在手机壳容器（`App.tsx` 根 div）上设置 `data-theme` 属性。

### 3.2 新增/修改模块

| 模块 | 类型 | 说明 |
|------|------|------|
| `src/stores/useSettingsStore.ts` | 新增 | 设置状态：加载、切换深色模式/声音/震动，持久化到 `db.settings`。 |
| `src/pages/MePage.tsx` | 重写 | 个人信息卡 + 菜单分组。 |
| `src/pages/ProfileEditPage.tsx` | 新增 | 个人信息编辑表单。 |
| `src/pages/PayPage.tsx` | 新增 | 支付页 Mock。 |
| `src/pages/SettingsPage.tsx` | 新增 | 设置项列表。 |
| `src/pages/AboutPage.tsx` | 新增 | 版本号与项目说明。 |
| `src/components/common/Watermark.tsx` | 新增 | 底部水印。 |
| `src/components/me/MenuListItem.tsx` | 新增 | 「我」页/设置页通用菜单行。 |
| `src/stores/useAppStore.ts` | 修改 | 路由新增 `profile-edit` / `pay` / `settings` / `about`。 |
| `src/stores/useContactStore.ts` | 修改 | 新增 `updateMe(patch)`：写 `db.me` 并刷新内存态。 |
| `src/App.tsx` | 修改 | 挂载新页面、`data-theme` 绑定、水印。 |

### 3.3 个人信息卡交互

- 点击信息卡 → push `profile-edit`。
- 「支付」→ push `pay`；「设置」→ push `settings`；「关于」在设置页内 → push `about`。
- 收藏/相册/卡包/表情 → `WeChatToast` 提示「演示功能，暂未开放」。

### 3.4 支付页 Mock 内容

- 顶部绿色余额卡：「零钱」¥1,888.00（Mock 静态值）。
- 功能网格：收付款、零钱、银行卡、账单、理财通、手机充值 —— 全部 Toast 占位。

---

## 4. 测试计划

| 测试 | 内容 |
|------|------|
| `useSettingsStore.test.ts` | 加载默认值、切换 darkMode 持久化、DOM `data-theme` 同步。 |
| `useContactStore.test.ts`（补充） | `updateMe` 写库并刷新内存态。 |
| `MePage.test.tsx` | 渲染昵称/微信号、菜单项、点击支付/设置路由跳转、占位项 Toast。 |
| `ProfileEditPage.test.tsx` | 编辑并保存后 store 与 DB 更新。 |
| `PayPage.test.tsx` | 余额展示、入口 Toast。 |
| `SettingsPage.test.tsx` | 开关切换、关于页跳转。 |
| `AboutPage.test.tsx` | 版本号展示。 |
| `Watermark.test.tsx` | 水印文案渲染。 |

---

## 5. 文档收尾

- 更新 README：功能清单补 Sprint 4 内容、深色模式截图说明（文字描述即可）。
- 更新 `docs/portfolio/README.md`：补 Sprint 4 亮点（CSS 变量主题架构、设置持久化）。

---

## 6. 风险与应对

| 风险 | 应对 |
|------|------|
| 深色模式下局部硬编码颜色漏改 | 走查时以手机壳内主容器为主，逐页目检；不追求像素级完美。 |
| 测试环境 IndexedDB 状态污染 | 沿用现有 fake-indexeddb + beforeEach 清理模式。 |
| 范围蔓延（收藏/卡包想做真的） | 严格 Toast 占位，写进范围边界。 |

---

*文档状态：已确认*
