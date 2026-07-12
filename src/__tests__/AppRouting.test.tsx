import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';
import { db } from '../db/database';
import { initializeDatabase } from '../db/init';
import { useChatStore } from '../stores/useChatStore';
import { useContactStore } from '../stores/useContactStore';
import { useAppStore } from '../stores/useAppStore';

describe('App Routing', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    await db.delete();
    await db.open();
    useChatStore.setState({ conversations: [], messages: {}, loaded: false });
    useContactStore.setState({ me: null, contacts: [], loaded: false });
    useAppStore.setState({ currentTab: 'chats', currentPage: 'tabs', currentConversationId: null });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
  });

  it('默认显示 tab 层', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-layer')).toHaveClass('translate-x-0');
      expect(screen.getByTestId('detail-layer')).toHaveClass('translate-x-full');
    });
  });

  it('从聊天列表进入详情页后 detail-layer 滑入', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-list-item')[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('chat-list-item')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('tab-layer')).toHaveClass('-translate-x-full');
      expect(screen.getByTestId('detail-layer')).toHaveClass('translate-x-0');
    });
  });

  it('从详情页返回 tab 层', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-list-item')[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('chat-list-item')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('header-back')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('header-back'));
    await waitFor(() => {
      expect(screen.getByTestId('tab-layer')).toHaveClass('translate-x-0');
      expect(screen.getByTestId('detail-layer')).toHaveClass('translate-x-full');
    });
  });
});
