import { create } from 'zustand';

type Tab = 'chats' | 'contacts' | 'discover' | 'me';

export type PageRoute =
  | { type: 'tabs' }
  | { type: 'chat-detail'; conversationId: string }
  | { type: 'contact-detail'; contactId: string }
  | { type: 'transfer-detail'; messageId: string }
  | { type: 'moments' }
  | { type: 'profile-edit' }
  | { type: 'pay' }
  | { type: 'settings' }
  | { type: 'about' }
  | { type: 'group-info'; conversationId: string }
  | { type: 'group-list' }
  | { type: 'tag-list' }
  | { type: 'tag-detail'; tag: string };

interface AppState {
  currentTab: Tab;
  pageStack: PageRoute[];
  setCurrentTab: (tab: Tab) => void;
  pushPage: (route: PageRoute) => void;
  popPage: () => void;
  navigateToChatDetail: (conversationId: string) => void;
  navigateToContactDetail: (contactId: string) => void;
  navigateToTransferDetail: (messageId: string) => void;
  navigateToMoments: () => void;
  navigateToProfileEdit: () => void;
  navigateToPay: () => void;
  navigateToSettings: () => void;
  navigateToAbout: () => void;
  navigateToGroupInfo: (conversationId: string) => void;
  navigateToGroupList: () => void;
  navigateToTagList: () => void;
  navigateToTagDetail: (tag: string) => void;
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

  navigateToTransferDetail: (messageId) =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'transfer-detail', messageId }],
    })),

  navigateToMoments: () =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'moments' }],
    })),

  navigateToProfileEdit: () =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'profile-edit' }],
    })),

  navigateToPay: () =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'pay' }],
    })),

  navigateToSettings: () =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'settings' }],
    })),

  navigateToAbout: () =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'about' }],
    })),

  navigateToGroupInfo: (conversationId) =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'group-info', conversationId }],
    })),

  navigateToGroupList: () =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'group-list' }],
    })),

  navigateToTagList: () =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'tag-list' }],
    })),

  navigateToTagDetail: (tag) =>
    set((state) => ({
      pageStack: [...state.pageStack, { type: 'tag-detail', tag }],
    })),

  navigateBackToTabs: () => set({ pageStack: [{ type: 'tabs' }] }),
}));
