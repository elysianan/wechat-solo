import { create } from 'zustand';

// 底部导航 tab 类型
type Tab = 'chats' | 'contacts' | 'discover' | 'me';

interface AppState {
  currentTab: Tab;
  setCurrentTab: (tab: Tab) => void;
}

// 应用全局状态：当前底部 tab
export const useAppStore = create<AppState>((set) => ({
  currentTab: 'chats',
  setCurrentTab: (tab) => set({ currentTab: tab }),
}));
