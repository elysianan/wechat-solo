import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ChatPage } from '../../pages/ChatPage';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { useChatStore } from '../../stores/useChatStore';
import { useContactStore } from '../../stores/useContactStore';
import { useAppStore } from '../../stores/useAppStore';

describe('ChatPage', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useChatStore.setState({ conversations: [], messages: {}, loaded: false });
    useContactStore.setState({ me: null, contacts: [], loaded: false });
    useAppStore.setState({ currentTab: 'chats', pageStack: [{ type: 'tabs' }] });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
  });

  it('渲染聊天列表项', async () => {
    render(<ChatPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-list-item').length).toBeGreaterThan(0);
    });
  });

  it('点击列表项进入聊天详情', async () => {
    render(<ChatPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-list-item')[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('chat-list-item')[0]);
    const topRoute = useAppStore.getState().pageStack.at(-1);
    expect(topRoute?.type).toBe('chat-detail');
    expect(topRoute).toHaveProperty('conversationId');
  });

  it('非文本消息在列表中显示类型占位文案', async () => {
    render(<ChatPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-list-item').length).toBeGreaterThan(0);
    });
    // 种子数据：mom 最后一条是图片，buddy 是位置，lisa 是名片，landlord 是转账
    expect(screen.getByText('[图片]')).toBeInTheDocument();
    expect(screen.getByText('[位置]')).toBeInTheDocument();
    expect(screen.getByText('[名片]')).toBeInTheDocument();
    expect(screen.getByText('[转账]')).toBeInTheDocument();
  });
});
