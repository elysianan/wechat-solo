import { create } from 'zustand';

// 底部导航 tab 类型
type Tab = 'chats' | 'contacts' | 'discover' | 'me';

// 当前页面类型：tab 页 或 聊天详情页
type Page = 'tabs' | 'chat-detail';

interface AppState {
  currentTab: Tab;
  currentPage: Page;
  currentConversationId: string | null;
  setCurrentTab: (tab: Tab) => void;
  navigateToChatDetail: (conversationId: string) => void;
  navigateBackToTabs: () => void;
}

// 应用全局状态：底部 tab + 页面路由
export const useAppStore = create<AppState>((set) => ({
  currentTab: 'chats',
  currentPage: 'tabs',
  currentConversationId: null,
  setCurrentTab: (tab) => set({ currentTab: tab }),
  navigateToChatDetail: (conversationId) =>
    set({ currentPage: 'chat-detail', currentConversationId: conversationId }),
  navigateBackToTabs: () =>
    set({ currentPage: 'tabs', currentConversationId: null }),
}));
