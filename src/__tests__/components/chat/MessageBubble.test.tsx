import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../../../components/chat/MessageBubble';
import type { Message } from '../../../types';

function makeMessage(status: Message['status'], content = 'hello'): Message {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'me',
    type: 'text',
    content,
    status,
    createdAt: Date.now(),
  };
}

describe('MessageBubble', () => {
  it('渲染自己发送的消息', () => {
    render(<MessageBubble message={makeMessage('sent')} isMe contactName="王阿姨" contactAvatar="/avatar.svg" />);
    expect(screen.getByTestId('message-content')).toHaveTextContent('hello');
    expect(screen.getByTestId('message-status')).toBeInTheDocument();
  });

  it('渲染对方消息并显示昵称', () => {
    render(<MessageBubble message={makeMessage('read')} isMe={false} contactName="王阿姨" contactAvatar="/avatar.svg" />);
    expect(screen.getByText('王阿姨')).toBeInTheDocument();
    expect(screen.queryByTestId('message-status')).not.toBeInTheDocument();
  });

  it('已读状态显示双绿勾', () => {
    render(<MessageBubble message={makeMessage('read')} isMe contactName="王阿姨" contactAvatar="/avatar.svg" />);
    expect(screen.getByTestId('message-status').querySelector('svg')).toHaveClass('text-wechat-green');
  });
});
