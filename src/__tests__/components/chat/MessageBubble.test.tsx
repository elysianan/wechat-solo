import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../../../components/chat/MessageBubble';
import type { Message } from '../../../types';

function makeTextMessage(status: Message['status'], content = 'hello'): Message {
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
    render(<MessageBubble message={makeTextMessage('sent')} isMe contactName="王阿姨" contactAvatar="/avatar.svg" />);
    expect(screen.getByTestId('message-content')).toHaveTextContent('hello');
    expect(screen.getByTestId('message-status')).toBeInTheDocument();
  });

  it('渲染对方消息并显示昵称', () => {
    render(<MessageBubble message={makeTextMessage('read')} isMe={false} contactName="王阿姨" contactAvatar="/avatar.svg" />);
    expect(screen.getByText('王阿姨')).toBeInTheDocument();
    expect(screen.queryByTestId('message-status')).not.toBeInTheDocument();
  });

  it('已读状态显示双绿勾', () => {
    render(<MessageBubble message={makeTextMessage('read')} isMe contactName="王阿姨" contactAvatar="/avatar.svg" />);
    expect(screen.getByTestId('message-status').querySelector('svg')).toHaveClass('text-wechat-green');
  });

  it('渲染图片消息', () => {
    const message: Message = {
      id: 'msg-img',
      conversationId: 'conv-1',
      senderId: 'mom',
      type: 'image',
      url: 'data:image/png;base64,xxx',
      status: 'read',
      createdAt: Date.now(),
    };
    render(<MessageBubble message={message} isMe={false} contactName="王阿姨" contactAvatar="/avatar.svg" />);
    expect(screen.getByTestId('image-message')).toBeInTheDocument();
  });

  it('渲染语音消息并显示时长', () => {
    const message: Message = {
      id: 'msg-voice',
      conversationId: 'conv-1',
      senderId: 'buddy',
      type: 'voice',
      url: 'voice://demo',
      duration: 5,
      status: 'read',
      createdAt: Date.now(),
    };
    render(<MessageBubble message={message} isMe={false} contactName="阿杰" contactAvatar="/avatar.svg" />);
    expect(screen.getByTestId('voice-message')).toHaveTextContent('5"');
  });

  it('渲染红包消息', () => {
    const message: Message = {
      id: 'msg-rp',
      conversationId: 'conv-1',
      senderId: 'lisa',
      type: 'redpacket',
      amount: 8.88,
      title: '请你喝奶茶',
      packetStatus: 'pending',
      status: 'read',
      createdAt: Date.now(),
    };
    render(<MessageBubble message={message} isMe={false} contactName="Lisa" contactAvatar="/avatar.svg" />);
    expect(screen.getByTestId('redpacket-message')).toHaveTextContent('请你喝奶茶');
    expect(screen.getByTestId('redpacket-message')).toHaveTextContent('¥8.88');
  });
});
