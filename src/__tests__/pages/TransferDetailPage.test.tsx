import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransferDetailPage } from '../../pages/TransferDetailPage';
import { useAppStore } from '../../stores/useAppStore';
import { useChatStore } from '../../stores/useChatStore';
import { useContactStore } from '../../stores/useContactStore';

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('../../stores/useChatStore', () => ({
  useChatStore: vi.fn(),
}));

vi.mock('../../stores/useContactStore', () => ({
  useContactStore: vi.fn(),
}));

vi.mock('../../utils/time', () => ({
  formatChatTime: vi.fn((timestamp: number) => `格式化时间-${timestamp}`),
}));

// 模拟 Zustand 选择器：mock 函数被调用时把选择器应用到状态对象
function mockAppStore(state: unknown) {
  (useAppStore as unknown as Mock).mockImplementation(
    (selector: (s: unknown) => unknown) => selector(state)
  );
}

function mockChatStore(state: unknown) {
  (useChatStore as unknown as Mock).mockImplementation(
    (selector: (s: unknown) => unknown) => selector(state)
  );
}

function mockContactStore(state: unknown) {
  (useContactStore as unknown as Mock).mockImplementation(
    (selector: (s: unknown) => unknown) => selector(state)
  );
}

describe('TransferDetailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('渲染转账金额和对方信息', () => {
    mockAppStore({
      pageStack: [{ type: 'transfer-detail', messageId: 'm1' }],
      popPage: vi.fn(),
    });
    mockChatStore({
      messages: {
        c1: [{
          id: 'm1',
          conversationId: 'c1',
          senderId: 'u1',
          type: 'transfer',
          amount: 88,
          transferStatus: 'pending',
          note: '吃饭',
          createdAt: Date.now(),
        }],
      },
      conversations: [{ id: 'c1', contactId: 'u1' }],
      updateTransferStatus: vi.fn(),
    });
    mockContactStore({
      contacts: [{ id: 'u1', name: '王小明', avatar: '/avatar.svg' }],
    });

    render(<TransferDetailPage />);
    expect(screen.getByText('¥88.00')).toBeInTheDocument();
    expect(screen.getByText('备注：吃饭')).toBeInTheDocument();
    expect(screen.getByText('收款')).toBeInTheDocument();
  });

  it('点击收款后调用 updateTransferStatus 并返回', async () => {
    const updateTransferStatus = vi.fn();
    const popPage = vi.fn();
    mockAppStore({
      pageStack: [{ type: 'transfer-detail', messageId: 'm1' }],
      popPage,
    });
    mockChatStore({
      messages: {
        c1: [{
          id: 'm1',
          conversationId: 'c1',
          senderId: 'u1',
          type: 'transfer',
          amount: 88,
          transferStatus: 'pending',
          createdAt: Date.now(),
        }],
      },
      conversations: [{ id: 'c1', contactId: 'u1' }],
      updateTransferStatus,
    });
    mockContactStore({
      contacts: [{ id: 'u1', name: '王小明', avatar: '/avatar.svg' }],
    });

    render(<TransferDetailPage />);
    fireEvent.click(screen.getByText('收款'));
    await waitFor(() => {
      expect(updateTransferStatus).toHaveBeenCalledWith('m1', 'received');
    });
    expect(popPage).toHaveBeenCalled();
  });

  it('点击退还后调用 updateTransferStatus 并返回', async () => {
    const updateTransferStatus = vi.fn();
    const popPage = vi.fn();
    mockAppStore({
      pageStack: [{ type: 'transfer-detail', messageId: 'm1' }],
      popPage,
    });
    mockChatStore({
      messages: {
        c1: [{
          id: 'm1',
          conversationId: 'c1',
          senderId: 'u1',
          type: 'transfer',
          amount: 88,
          transferStatus: 'pending',
          note: '吃饭',
          createdAt: Date.now(),
        }],
      },
      conversations: [{ id: 'c1', contactId: 'u1' }],
      updateTransferStatus,
    });
    mockContactStore({
      contacts: [{ id: 'u1', name: '王小明', avatar: '/avatar.svg' }],
    });

    render(<TransferDetailPage />);
    fireEvent.click(screen.getByText('退还'));
    await waitFor(() => {
      expect(updateTransferStatus).toHaveBeenCalledWith('m1', 'refunded');
    });
    expect(popPage).toHaveBeenCalled();
  });

  it('已收款状态显示已收款和完成时间', () => {
    mockAppStore({
      pageStack: [{ type: 'transfer-detail', messageId: 'm1' }],
      popPage: vi.fn(),
    });
    mockChatStore({
      messages: {
        c1: [{
          id: 'm1',
          conversationId: 'c1',
          senderId: 'u1',
          type: 'transfer',
          amount: 88,
          transferStatus: 'received',
          transferCompletedAt: 1234567890000,
          note: '吃饭',
          createdAt: Date.now(),
        }],
      },
      conversations: [{ id: 'c1', contactId: 'u1' }],
      updateTransferStatus: vi.fn(),
    });
    mockContactStore({
      contacts: [{ id: 'u1', name: '王小明', avatar: '/avatar.svg' }],
    });

    render(<TransferDetailPage />);
    expect(screen.getByText('已收款 格式化时间-1234567890000')).toBeInTheDocument();
  });

  it('已退还状态显示已退还和完成时间', () => {
    mockAppStore({
      pageStack: [{ type: 'transfer-detail', messageId: 'm1' }],
      popPage: vi.fn(),
    });
    mockChatStore({
      messages: {
        c1: [{
          id: 'm1',
          conversationId: 'c1',
          senderId: 'u1',
          type: 'transfer',
          amount: 88,
          transferStatus: 'refunded',
          transferCompletedAt: 1234567890000,
          note: '吃饭',
          createdAt: Date.now(),
        }],
      },
      conversations: [{ id: 'c1', contactId: 'u1' }],
      updateTransferStatus: vi.fn(),
    });
    mockContactStore({
      contacts: [{ id: 'u1', name: '王小明', avatar: '/avatar.svg' }],
    });

    render(<TransferDetailPage />);
    expect(screen.getByText('已退还 格式化时间-1234567890000')).toBeInTheDocument();
  });

  it('转账不存在时显示占位提示并展示返回按钮', () => {
    const popPage = vi.fn();
    mockAppStore({
      pageStack: [{ type: 'transfer-detail', messageId: 'missing-id' }],
      popPage,
    });
    mockChatStore({
      messages: {
        c1: [{
          id: 'm1',
          conversationId: 'c1',
          senderId: 'u1',
          type: 'transfer',
          amount: 88,
          transferStatus: 'pending',
          createdAt: Date.now(),
        }],
      },
      conversations: [{ id: 'c1', contactId: 'u1' }],
      updateTransferStatus: vi.fn(),
    });
    mockContactStore({ contacts: [] });

    render(<TransferDetailPage />);
    expect(screen.getByText('转账信息不存在')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('header-back'));
    expect(popPage).toHaveBeenCalled();
  });
});
