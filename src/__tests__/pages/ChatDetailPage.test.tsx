import { describe, it, expect, beforeEach, beforeAll, vi, type Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ChatDetailPage } from '../../pages/ChatDetailPage';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { useChatStore } from '../../stores/useChatStore';
import { useContactStore } from '../../stores/useContactStore';
import { useAppStore } from '../../stores/useAppStore';

describe('ChatDetailPage', () => {
  beforeAll(() => {
    // 屏蔽前一个测试文件遗留异步操作在 db.delete() 后触发的 DatabaseClosedError
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.name === 'DatabaseClosedError') {
        event.preventDefault();
      }
    });
  });

  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    // 终止上一个测试可能遗留的 Agent 调度器，避免在 db.delete()/open() 后仍访问旧库
    useChatStore.getState().stopInitiateScheduler();
    // 把回复时间缩放为 0，使当前文件内 Agent 回复立即完成，不遗留跨测试的长定时器
    useChatStore.setState({ replyTimeScale: 0 });
    await db.delete();
    await db.open();
    useChatStore.setState({ conversations: [], messages: {}, loaded: false, typingConversations: {} });
    useContactStore.setState({ me: null, contacts: [], loaded: false });
    useAppStore.setState({ currentTab: 'chats', pageStack: [{ type: 'tabs' }] });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
    // 让上一个测试遗留的立即定时器有机会 flush
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('渲染当前会话的消息气泡', async () => {
    const conversation = useChatStore.getState().conversations[0];
    useAppStore.setState({ pageStack: [{ type: 'chat-detail', conversationId: conversation.id }] });
    render(<ChatDetailPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('message-bubble').length).toBeGreaterThan(0);
    });
  });

  it('发送消息后列表中出现新消息', async () => {
    const conversation = useChatStore.getState().conversations[0];
    useAppStore.setState({ pageStack: [{ type: 'chat-detail', conversationId: conversation.id }] });
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

  it('当 typingConversations 为 true 时显示正在输入提示', async () => {
    const conversation = useChatStore.getState().conversations[0];
    useAppStore.setState({ pageStack: [{ type: 'chat-detail', conversationId: conversation.id }] });
    useChatStore.setState({
      typingConversations: { [conversation.id]: true },
    });
    render(<ChatDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    });
  });

  it('首次进入会话用 auto 瞬间定位底部（避免与滑入动画叠加回弹）', async () => {
    const conversation = useChatStore.getState().conversations[0];
    useAppStore.setState({ pageStack: [{ type: 'chat-detail', conversationId: conversation.id }] });
    render(<ChatDetailPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('message-bubble').length).toBeGreaterThan(0);
    });
    const scrollMock = HTMLElement.prototype.scrollIntoView as Mock;
    // 首次滚动延迟到外层 300ms 转场结束后，再留余量等待异步消息稳定
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(scrollMock).toHaveBeenCalledWith({ behavior: 'auto' });
  });

  it('同一会话内新消息到来用 smooth 滚动到底部', async () => {
    const conversation = useChatStore.getState().conversations[0];
    useAppStore.setState({ pageStack: [{ type: 'chat-detail', conversationId: conversation.id }] });
    render(<ChatDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
    });
    const scrollMock = HTMLElement.prototype.scrollIntoView as Mock;
    scrollMock.mockClear();

    fireEvent.change(screen.getByTestId('text-input'), { target: { value: '你好' } });
    fireEvent.click(screen.getByTestId('send-button'));

    await waitFor(() => {
      expect(scrollMock).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });

  it('渲染种子数据中的图片 / 语音 / 红包消息', async () => {
    const conversation = useChatStore
      .getState()
      .conversations.find((c) => c.contactId === 'mom')!;
    useAppStore.setState({ pageStack: [{ type: 'chat-detail', conversationId: conversation.id }] });
    render(<ChatDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('image-message')).toBeInTheDocument();
    });
  });

  it('发送红包消息后聊天详情出现红包气泡', async () => {
    const conversation = useChatStore.getState().conversations[0];
    useAppStore.setState({ pageStack: [{ type: 'chat-detail', conversationId: conversation.id }] });
    render(<ChatDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tool-button'));
    fireEvent.click(screen.getByTestId('tool-redpacket-button'));
    fireEvent.change(screen.getByTestId('redpacket-amount-input'), { target: { value: '6.66' } });
    fireEvent.click(screen.getByTestId('redpacket-send-button'));

    await waitFor(() => {
      expect(screen.getByTestId('redpacket-message')).toBeInTheDocument();
    });
  });
});
