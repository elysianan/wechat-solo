import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GroupListPage } from '../../pages/GroupListPage';
import { GroupInfoPage } from '../../pages/GroupInfoPage';
import { ContactTopEntries } from '../../components/contacts/ContactTopEntries';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { useChatStore } from '../../stores/useChatStore';
import { useContactStore } from '../../stores/useContactStore';
import { useAppStore } from '../../stores/useAppStore';

describe('群聊列表与群资料页', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    await db.delete();
    await db.open();
    await initializeDatabase();
    useAppStore.setState({ currentTab: 'contacts', pageStack: [{ type: 'tabs' }] });
    useChatStore.setState({ conversations: [], messages: {}, loaded: false });
    useContactStore.setState({ me: null, contacts: [], loaded: false });
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
  });

  it('群聊列表展示所有群，点击进入群聊', async () => {
    useAppStore.setState({ pageStack: [{ type: 'tabs' }, { type: 'group-list' }] });
    render(<GroupListPage />);

    await waitFor(() => {
      expect(screen.getByText('幸福一家人')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('产品研发群'));
    const top = useAppStore.getState().pageStack.at(-1);
    expect(top?.type).toBe('chat-detail');
  });

  it('通讯录「群聊」入口进入群聊列表', () => {
    render(<ContactTopEntries />);
    fireEvent.click(screen.getByTestId('top-entry-groups'));
    expect(useAppStore.getState().pageStack.at(-1)?.type).toBe('group-list');
  });

  it('群资料页展示成员网格与群名', async () => {
    const work = useChatStore.getState().conversations.find((c) => c.name === '产品研发群')!;
    useAppStore.setState({
      pageStack: [{ type: 'tabs' }, { type: 'group-info', conversationId: work.id }],
    });
    render(<GroupInfoPage />);

    await waitFor(() => {
      expect(screen.getByTestId('group-members-grid')).toBeInTheDocument();
    });
    // 3 名成员 + 我
    expect(screen.getAllByTestId(/^group-member-/).length).toBe(4);
    expect(screen.getByText('产品研发群')).toBeInTheDocument();
  });

  it('点击成员进入好友资料页', async () => {
    const work = useChatStore.getState().conversations.find((c) => c.name === '产品研发群')!;
    useAppStore.setState({
      pageStack: [{ type: 'tabs' }, { type: 'group-info', conversationId: work.id }],
    });
    render(<GroupInfoPage />);

    await waitFor(() => {
      expect(screen.getByTestId('group-member-boss')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('group-member-boss'));
    expect(useAppStore.getState().pageStack.at(-1)).toEqual({
      type: 'contact-detail',
      contactId: 'boss',
    });
  });

  it('点击「我」进入个人信息编辑', async () => {
    const work = useChatStore.getState().conversations.find((c) => c.name === '产品研发群')!;
    useAppStore.setState({
      pageStack: [{ type: 'tabs' }, { type: 'group-info', conversationId: work.id }],
    });
    render(<GroupInfoPage />);

    await waitFor(() => {
      expect(screen.getByTestId('group-member-me')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('group-member-me'));
    expect(useAppStore.getState().pageStack.at(-1)?.type).toBe('profile-edit');
  });

  it('返回按钮回到上一页', async () => {
    const work = useChatStore.getState().conversations.find((c) => c.name === '产品研发群')!;
    useAppStore.setState({
      pageStack: [
        { type: 'tabs' },
        { type: 'chat-detail', conversationId: work.id },
        { type: 'group-info', conversationId: work.id },
      ],
    });
    render(<GroupInfoPage />);

    await waitFor(() => {
      expect(screen.getByTestId('header-back')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('header-back'));
    expect(useAppStore.getState().pageStack.at(-1)?.type).toBe('chat-detail');
  });
});
