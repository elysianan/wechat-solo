import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';
import { db } from '../db/database';
import { initializeDatabase } from '../db/init';
import { useChatStore } from '../stores/useChatStore';
import { useContactStore } from '../stores/useContactStore';
import { useAppStore } from '../stores/useAppStore';

describe('Chat Core Flow', () => {
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

  it('完整流程：进入详情、发送消息、返回后列表预览更新', async () => {
    render(<App />);

    // 等待聊天列表渲染
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-list-item').length).toBeGreaterThan(0);
    });

    // 点击第一个会话进入详情
    fireEvent.click(screen.getAllByTestId('chat-list-item')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('chat-detail-page')).toBeInTheDocument();
    });

    // 发送新消息
    fireEvent.change(screen.getByTestId('text-input'), { target: { value: '集成测试消息' } });
    fireEvent.click(screen.getByTestId('send-button'));
    await waitFor(() => {
      expect(screen.getAllByTestId('message-content').some((el) => el.textContent === '集成测试消息')).toBe(true);
    });

    // 返回列表
    fireEvent.click(screen.getByTestId('header-back'));
    await waitFor(() => {
      expect(screen.getByTestId('chat-page')).toBeInTheDocument();
    });

    // 列表最后消息预览更新
    await waitFor(() => {
      expect(screen.getByText('集成测试消息')).toBeInTheDocument();
    });
  });
});
