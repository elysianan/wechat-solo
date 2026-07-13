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
    useAppStore.setState({ currentTab: 'chats', pageStack: [{ type: 'tabs' }] });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
  });

  it('默认显示 tab 层，detail 层在屏幕外', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-layer')).toBeInTheDocument();
      expect(screen.getByTestId('detail-layer')).toHaveClass('left-full');
    });
  });

  it('从聊天列表进入详情页后 detail 层滑入', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-list-item')[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('chat-list-item')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('detail-layer')).toHaveClass('left-0');
    });
  });

  it('从详情页返回 tab 层后 detail 层滑出', async () => {
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
      expect(screen.getByTestId('detail-layer')).toHaveClass('left-full');
    });
  });
});
