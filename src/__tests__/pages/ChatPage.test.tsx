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
    useAppStore.setState({ currentTab: 'chats', currentPage: 'tabs', currentConversationId: null });
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
    expect(useAppStore.getState().currentPage).toBe('chat-detail');
    expect(useAppStore.getState().currentConversationId).not.toBeNull();
  });
});
