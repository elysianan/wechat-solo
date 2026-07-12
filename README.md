# WeChat Solo

一个高保真还原微信核心体验、并由多 Agent 人设驱动的单机社交模拟器。

## 产品定位

WeChat Solo 用于展示 AI 产品助理的核心能力：

- 复杂 C 端产品的信息架构与交互还原
- AI Agent 人设设计与规则驱动回复
- AI 工具（Claude Code）系统落地产品想法

## 技术栈

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Zustand
- Dexie.js (IndexedDB)
- lucide-react

## 本地运行

```bash
npm install
npm run dev
```

## 测试

```bash
npm test
```

## 当前阶段

Sprint 0 已完成：项目骨架与数据地基。

Sprint 1 已完成：聊天核心流程。

- 聊天列表：显示头像、昵称、最后消息预览、时间、未读数。
- 聊天详情：顶部返回、消息气泡、底部输入框。
- 发送文字消息：输入后点击发送或按回车，消息写入 IndexedDB。
- 消息状态图标：单灰勾 / 双灰勾 / 双绿勾 UI。
- 页面转场：聊天详情从右侧滑入，返回时向左滑出。
- 演示模式：工具面板按钮点击弹出 Toast 提示。
