import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../stores/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentTab: 'chats',
      currentPage: 'tabs',
      currentConversationId: null,
    });
  });

  it('默认在聊天 tab 和 tabs 页面', () => {
    expect(useAppStore.getState().currentTab).toBe('chats');
    expect(useAppStore.getState().currentPage).toBe('tabs');
  });

  it('可切换 tab', () => {
    useAppStore.getState().setCurrentTab('contacts');
    expect(useAppStore.getState().currentTab).toBe('contacts');
  });

  it('可进入聊天详情', () => {
    useAppStore.getState().navigateToChatDetail('conv-mom');
    expect(useAppStore.getState().currentPage).toBe('chat-detail');
    expect(useAppStore.getState().currentConversationId).toBe('conv-mom');
  });

  it('可从聊天详情返回 tabs', () => {
    useAppStore.getState().navigateToChatDetail('conv-mom');
    useAppStore.getState().navigateBackToTabs();
    expect(useAppStore.getState().currentPage).toBe('tabs');
    expect(useAppStore.getState().currentConversationId).toBeNull();
  });
});
