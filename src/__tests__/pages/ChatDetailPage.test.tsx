import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ChatDetailPage } from '../../pages/ChatDetailPage';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { useChatStore } from '../../stores/useChatStore';
import { useContactStore } from '../../stores/useContactStore';
import { useAppStore } from '../../stores/useAppStore';

describe('ChatDetailPage', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    await db.delete();
    await db.open();
    useChatStore.setState({ conversations: [], messages: {}, loaded: false });
    useContactStore.setState({ me: null, contacts: [], loaded: false });
    useAppStore.setState({ currentTab: 'chats', currentPage: 'chat-detail', currentConversationId: null });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
  });

  it('渲染当前会话的消息气泡', async () => {
    const conversation = useChatStore.getState().conversations[0];
    useAppStore.setState({ currentConversationId: conversation.id });
    render(<ChatDetailPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('message-bubble').length).toBeGreaterThan(0);
    });
  });

  it('发送消息后列表中出现新消息', async () => {
    const conversation = useChatStore.getState().conversations[0];
    useAppStore.setState({ currentConversationId: conversation.id });
    render(<ChatDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('text-input'), { target: { value: '新消息' } });
    fireEvent.click(screen.getByTestId('send-button'));

    await waitFor(() => {
      expect(screen.getAllByTestId('message-content').some((el) => el.textContent === '新消息')).toBe(true);
    });
  });
});
