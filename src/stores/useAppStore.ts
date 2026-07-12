import { create } from 'zustand';

type Tab = 'chats' | 'contacts' | 'discover' | 'me';

export type PageRoute =
  | { type: 'tabs' }
  | { type: 'chat-detail'; conversationId: string }
  | { type: 'contact-detail'; contactId: string }
  | { type: 'moments' };

interface AppState {
  currentTab: Tab;
  pageStack: PageRoute[];
  setCurrentTab: (tab: Tab) => void;
  pushPage: (route: PageRoute) => void;
  popPage: () => void;
  navigateToChatDetail: (conversationId: string) => void;
  navigateToContactDetail: (contactId: string) => void;
  navigateToMoments: () => void;
  navigateBackToTabs: () => void;
}

// 应用全局状态：底部 tab + 页面路由栈
export const useAppStore = create<AppState>((set) => ({
  currentTab: 'chats',
  pageStack: [{ type: 'tabs' }],

  setCurrentTab: (tab) => set({ currentTab: tab }),

  pushPage: (route) =>
    set((state) => ({
      pageStack: [...state.pageStack, route],
    })),

  popPage: () =>
    set((state) => ({
      pageStack: state.pageStack.length > 1 ? state.pageStack.slice(0, -1) : state.pageStack,
    })),

  navigateToChatDetail: (conversationId) =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'chat-detail', conversationId }],
    })),

  navigateToContactDetail: (contactId) =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'contact-detail', contactId }],
    })),

  navigateToMoments: () =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'moments' }],
    })),

  navigateBackToTabs: () => set({ pageStack: [{ type: 'tabs' }] }),
}));
