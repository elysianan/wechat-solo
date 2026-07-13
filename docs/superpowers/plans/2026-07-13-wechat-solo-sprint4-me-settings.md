# WeChat Solo Sprint 4 实施计划：个人中心与最终打磨

**日期**：2026-07-13  
**设计文档**：`docs/superpowers/specs/2026-07-13-wechat-solo-sprint4-me-settings-design.md`  
**分支**：`feat/sprint4-me-settings`（从 master 切出）

---

## 任务拆解

### Task 1：设计文档与计划 ✅

产出本目录下 spec 与 plan 文档。

### Task 2：深色模式基础设施

1. 修改 `tailwind.config.js`：wechat 色板改 CSS 变量，新增 `card` 色。
2. 修改 `src/index.css`：定义 `:root` 浅色变量与 `[data-theme="dark"]` 深色变量。
3. 新增 `src/stores/useSettingsStore.ts`：
   - `loadSettings()`：读 `db.settings.get('app')`，不存在则用默认值。
   - `setDarkMode(v)` / `setSoundEnabled(v)` / `setVibrationEnabled(v)`：更新内存态并写回 DB。
   - `applyTheme(darkMode)`：在手机壳容器设置 `data-theme`（由 App.tsx 订阅后赋给根 div，避免直接操作 DOM）。
4. `App.tsx` 订阅 `darkMode`，根容器加 `data-theme={darkMode ? 'dark' : 'light'}`；启动时 `loadSettings()`。
5. 测试：`src/__tests__/stores/settingsStore.test.ts`。

### Task 3：「我」页面正式版

1. 新增 `src/components/me/MenuListItem.tsx`：图标 + 标题 + 右箭头，支持 `onClick`。
2. 重写 `src/pages/MePage.tsx`：
   - 信息卡：`contactStore.me` 的头像/昵称/微信号，点击 → `navigateToProfileEdit()`。
   - 分组一：支付（→ pay）。
   - 分组二：收藏、相册、卡包、表情（Toast 占位）。
   - 分组三：设置（→ settings）。
3. 容器背景用 `bg-wechat-bg`，卡片用 `bg-wechat-card`。
4. 测试：`src/__tests__/pages/MePage.test.tsx`。

### Task 4：个人信息编辑页

1. `useAppStore` 路由新增 `profile-edit` + `navigateToProfileEdit()`。
2. `useContactStore` 新增 `updateMe(patch: Partial<Me>)`：`db.me.update('me', patch)` 后刷新内存态。
3. 新增 `src/pages/ProfileEditPage.tsx`：
   - 微信风格列表：头像（只读）、昵称、微信号、地区、签名。
   - 点击某项进入行内编辑态（输入框 + 键盘），顶部 Header 右侧「保存」。
   - 简化：每项点击进入独立编辑模式，失焦/保存即写回。
   - 实现上采用：点击行 → 该行变输入框，Header 显示「完成」按钮提交。
4. 测试：`src/__tests__/pages/ProfileEditPage.test.tsx`、补充 contactStore 测试。

### Task 5：支付页 Mock

1. `useAppStore` 路由新增 `pay` + `navigateToPay()`。
2. 新增 `src/pages/PayPage.tsx`：绿色余额卡 + 6 宫格功能入口（全部 Toast）。
3. 测试：`src/__tests__/pages/PayPage.test.tsx`。

### Task 6：设置页 + 关于页

1. `useAppStore` 路由新增 `settings` / `about` + 对应 navigate 方法。
2. 新增 `src/pages/SettingsPage.tsx`：
   - 深色模式开关（联动 settingsStore）。
   - 声音/震动开关（持久化，无实际行为）。
   - 「关于 WeChat Solo」→ about。
3. 新增 `src/pages/AboutPage.tsx`：Logo、版本号（读 settings.version）、项目说明文案。
4. 测试：两个页面测试文件。

### Task 7：底部水印 + UI 打磨

1. 新增 `src/components/common/Watermark.tsx`：固定于手机壳底部居中，浅灰小字「WeChat Solo Demo · 仅供演示」，`pointer-events-none`。
2. `App.tsx` 挂载水印。
3. 走查硬编码颜色：`bg-white` → `bg-wechat-card` 等（仅容器级）。
4. 测试：`src/__tests__/components/Watermark.test.tsx`。

### Task 8：测试 + 文档收尾 + 推送

1. 跑全量单测 + E2E，修复回归。
2. 更新 README、`docs/portfolio/README.md`。
3. 提交、合并 master、推送 Gitee、打 tag `sprint-4-complete`。

---

## 验收清单

- [ ] 「我」页信息卡展示真实昵称/微信号，点击进入编辑。
- [ ] 编辑保存后刷新页面仍保留。
- [ ] 深色模式切换全应用生效，刷新后保留。
- [ ] 支付页/设置页/关于页可正常进出，转场动画一致。
- [ ] 水印在所有页面可见且不挡交互。
- [ ] 全量测试通过，E2E 无回归。
- [ ] Gitee 已推送，tag `sprint-4-complete` 已打。

---

*文档状态：已确认*
