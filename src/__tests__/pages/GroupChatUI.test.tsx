import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatPage } from '../../pages/ChatPage';
import { ChatDetailPage } from '../../pages/ChatDetailPage';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { useChatStore } from '../../stores/useChatStore';
import { useContactStore } from '../../stores/useContactStore';
import { useAppStore } from '../../stores/useAppStore';

describe('群聊 UI 适配', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    await db.delete();
    await db.open();
    useChatStore.setState({ conversations: [], messages: {}, loaded: false });
    useContactStore.setState({ me: null, contacts: [], loaded: false });
    useAppStore.setState({ currentTab: 'chats', pageStack: [{ type: 'tabs' }] });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
  });

  it('聊天列表展示群名称', async () => {
    render(<ChatPage />);
    await waitFor(() => {
      expect(screen.getByText('幸福一家人')).toBeInTheDocument();
      expect(screen.getByText('产品研发群')).toBeInTheDocument();
    });
  });

  it('群会话预览显示「昵称：内容」', async () => {
    render(<ChatPage />);
    await waitFor(() => {
      // 产品研发群最后一条是张总的消息
      expect(screen.getByText(/张总：下班前对完/)).toBeInTheDocument();
    });
  });

  it('群聊详情页标题为群名', async () => {
    const family = useChatStore.getState().conversations.find((c) => c.name === '幸福一家人')!;
    useAppStore.setState({
      pageStack: [{ type: 'chat-detail', conversationId: family.id }],
    });
    render(<ChatDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '幸福一家人' })).toBeInTheDocument();
    });
  });

  it('群内他人气泡显示各自昵称，自己不显示', async () => {
    const family = useChatStore.getState().conversations.find((c) => c.name === '幸福一家人')!;
    useAppStore.setState({
      pageStack: [{ type: 'chat-detail', conversationId: family.id }],
    });
    render(<ChatDetailPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('message-bubble').length).toBeGreaterThan(0);
    });

    // 妈妈的气泡上方显示「王阿姨」
    const senderNames = screen.getAllByTestId('message-sender-name');
    expect(senderNames.some((el) => el.textContent === '王阿姨')).toBe(true);
  });

  it('群聊 Header 右侧按钮进入群资料页', async () => {
    const family = useChatStore.getState().conversations.find((c) => c.name === '幸福一家人')!;
    useAppStore.setState({
      pageStack: [{ type: 'chat-detail', conversationId: family.id }],
    });
    render(<ChatDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('group-info-button')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('group-info-button'));
    expect(useAppStore.getState().pageStack.at(-1)).toEqual({
      type: 'group-info',
      conversationId: family.id,
    });
  });
});
