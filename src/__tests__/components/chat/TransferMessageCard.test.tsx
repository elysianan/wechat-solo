import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TransferMessageCard } from '../../../components/chat/TransferMessageCard';
import type { TransferMessage } from '../../../types';

const baseMessage: TransferMessage = {
  id: 'm1',
  conversationId: 'c1',
  senderId: 'me',
  type: 'transfer',
  amount: 88,
  transferStatus: 'pending',
  createdAt: Date.now(),
};

describe('TransferMessageCard', () => {
  it('渲染金额', () => {
    render(<TransferMessageCard message={baseMessage} isMe />);
    expect(screen.getByText('¥88.00')).toBeInTheDocument();
  });

  it('自己发出的待收款显示「待对方收款」', () => {
    render(<TransferMessageCard message={baseMessage} isMe />);
    expect(screen.getByText('待对方收款')).toBeInTheDocument();
  });

  it('收到的待收款显示「待收款」', () => {
    render(<TransferMessageCard message={baseMessage} isMe={false} />);
    expect(screen.getByText('待收款')).toBeInTheDocument();
  });

  it('已收款状态显示「已收款」', () => {
    render(<TransferMessageCard message={{ ...baseMessage, transferStatus: 'received' }} isMe={false} />);
    expect(screen.getByText('已收款')).toBeInTheDocument();
  });

  it('已退还状态显示「已退还」', () => {
    render(<TransferMessageCard message={{ ...baseMessage, transferStatus: 'refunded' }} isMe />);
    expect(screen.getByText('已退还')).toBeInTheDocument();
  });
});
