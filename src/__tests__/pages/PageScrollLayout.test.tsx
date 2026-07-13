import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { useAppStore } from '../../stores/useAppStore';
import { useChatStore } from '../../stores/useChatStore';
import { useContactStore } from '../../stores/useContactStore';
import { useMomentStore } from '../../stores/useMomentStore';
import { ChatPage } from '../../pages/ChatPage';
import { ChatDetailPage } from '../../pages/ChatDetailPage';
import { ContactsPage } from '../../pages/ContactsPage';
import { ContactDetailPage } from '../../pages/ContactDetailPage';
import { DiscoverPage } from '../../pages/DiscoverPage';
import { MePage } from '../../pages/MePage';
import { MomentsPage } from '../../pages/MomentsPage';
import { GroupListPage } from '../../pages/GroupListPage';
import { GroupInfoPage } from '../../pages/GroupInfoPage';
import { TagListPage } from '../../pages/TagListPage';
import { TagDetailPage } from '../../pages/TagDetailPage';

/**
 * 页面滚动布局契约测试
 *
 * 背景 bug：页面根容器使用 min-h-screen 时，内容超过手机壳高度会把页面撑高，
 * 被外壳 overflow-hidden 裁剪，导致长列表无法滚动、新消息与固定输入框叠在一起。
 *
 * 契约：所有页面根容器必须 h-full（高度钉死在手机壳内），
 * 且自身或内部滚动区必须 overflow-y-auto；flex 布局的滚动子项必须有 min-h-0。
 */
describe('页面滚动布局契约', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    await db.delete();
    await db.open();
    await initializeDatabase();
    useAppStore.setState({ currentTab: 'chats', pageStack: [{ type: 'tabs' }] });
    useChatStore.setState({ conversations: [], messages: {}, loaded: false });
    useContactStore.setState({ me: null, contacts: [], loaded: false });
    useMomentStore.setState({ moments: [], loaded: false });
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
    await useMomentStore.getState().loadMoments();
  });

  // 普通页面：根容器自身滚动
  function expectRootScrollable(testId: string) {
    const root = screen.getByTestId(testId);
    expect(root.className).toContain('h-full');
    expect(root.className).not.toContain('min-h-screen');
    expect(root.className).toContain('overflow-y-auto');
  }

  it('聊天列表页根容器可滚动', () => {
    render(<ChatPage />);
    expectRootScrollable('chat-page');
  });

  it('通讯录页根容器可滚动', () => {
    render(<ContactsPage />);
    expectRootScrollable('contacts-page');
  });

  it('发现页根容器可滚动', () => {
    render(<DiscoverPage />);
    expectRootScrollable('discover-page');
  });

  it('「我」页根容器可滚动', () => {
    render(<MePage />);
    expectRootScrollable('me-page');
  });

  it('朋友圈页根容器可滚动', () => {
    render(<MomentsPage />);
    expectRootScrollable('moments-page');
  });

  it('聊天详情页：根容器 h-full，消息区独立滚动且可压缩', () => {
    const conversation = useChatStore.getState().conversations[0];
    useAppStore.setState({
      pageStack: [{ type: 'chat-detail', conversationId: conversation.id }],
    });
    render(<ChatDetailPage />);

    const root = screen.getByTestId('chat-detail-page');
    expect(root.className).toContain('h-full');
    expect(root.className).not.toContain('min-h-screen');

    const list = screen.getByTestId('chat-message-list');
    expect(list.className).toContain('overflow-y-auto');
    expect(list.className).toContain('min-h-0');
  });

  it('好友资料页：根容器 h-full，内容区独立滚动且可压缩', () => {
    const contact = useContactStore.getState().contacts[0];
    useAppStore.setState({
      pageStack: [{ type: 'contact-detail', contactId: contact.id }],
    });
    render(<ContactDetailPage />);

    const root = screen.getByTestId('contact-detail-page');
    expect(root.className).toContain('h-full');
    expect(root.className).not.toContain('min-h-screen');

    const content = screen.getByTestId('contact-detail-scroll');
    expect(content.className).toContain('overflow-y-auto');
    expect(content.className).toContain('min-h-0');
  });

  it('群聊列表页根容器可滚动', () => {
    useAppStore.setState({ pageStack: [{ type: 'tabs' }, { type: 'group-list' }] });
    render(<GroupListPage />);
    expectRootScrollable('group-list-page');
  });

  it('群资料页根容器可滚动', () => {
    const group = useChatStore
      .getState()
      .conversations.find((c) => c.type === 'group')!;
    useAppStore.setState({
      pageStack: [{ type: 'tabs' }, { type: 'group-info', conversationId: group.id }],
    });
    render(<GroupInfoPage />);
    expectRootScrollable('group-info-page');
  });

  it('标签列表页根容器可滚动', () => {
    useAppStore.setState({ pageStack: [{ type: 'tabs' }, { type: 'tag-list' }] });
    render(<TagListPage />);
    expectRootScrollable('tag-list-page');
  });

  it('标签详情页根容器可滚动', () => {
    useAppStore.setState({ pageStack: [{ type: 'tabs' }, { type: 'tag-detail', tag: '同事' }] });
    render(<TagDetailPage />);
    expectRootScrollable('tag-detail-page');
  });
});
