import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../stores/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentTab: 'chats',
      pageStack: [{ type: 'tabs' }],
    });
  });

  it('默认在聊天 tab 和 tabs 页面', () => {
    expect(useAppStore.getState().currentTab).toBe('chats');
    expect(useAppStore.getState().pageStack.at(-1)?.type).toBe('tabs');
  });

  it('可切换 tab', () => {
    useAppStore.getState().setCurrentTab('contacts');
    expect(useAppStore.getState().currentTab).toBe('contacts');
  });

  it('可进入聊天详情', () => {
    useAppStore.getState().navigateToChatDetail('conv-mom');
    const topRoute = useAppStore.getState().pageStack.at(-1);
    expect(topRoute?.type).toBe('chat-detail');
    expect(topRoute).toHaveProperty('conversationId', 'conv-mom');
  });

  it('可从聊天详情返回 tabs', () => {
    useAppStore.getState().navigateToChatDetail('conv-mom');
    useAppStore.getState().navigateBackToTabs();
    expect(useAppStore.getState().pageStack.at(-1)?.type).toBe('tabs');
    expect(useAppStore.getState().pageStack).toHaveLength(1);
  });
});
