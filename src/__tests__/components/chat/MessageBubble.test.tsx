import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  it('长按文本消息显示复制和删除菜单', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <MessageBubble
        message={makeTextMessage('sent')}
        isMe
        contactName="王阿姨"
        contactAvatar="/avatar.svg"
        onDelete={vi.fn()}
      />
    );

    const content = screen.getByTestId('message-content');
    fireEvent.pointerDown(content, { button: 0, clientX: 50, clientY: 50 });
    vi.advanceTimersByTime(650);

    await waitFor(() => {
      expect(screen.getByTestId('message-context-menu')).toBeInTheDocument();
    });
    expect(screen.getByTestId('context-menu-item-copy')).toHaveTextContent('复制');
    expect(screen.getByTestId('context-menu-item-delete')).toHaveTextContent('删除');

    vi.useRealTimers();
  });

  it('点击图片消息打开 Lightbox', () => {
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

    fireEvent.click(screen.getByTestId('image-message'));
    expect(screen.getByTestId('image-lightbox')).toBeInTheDocument();
  });

  it('点击语音消息切换播放状态', () => {
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
    fireEvent.click(screen.getByTestId('voice-play-button'));
    expect(screen.getByTestId('voice-progress')).toBeInTheDocument();
  });

  it('失败消息显示重试按钮', () => {
    const onRetry = vi.fn();
    render(
      <MessageBubble
        message={makeTextMessage('failed')}
        isMe
        contactName="王阿姨"
        contactAvatar="/avatar.svg"
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByTestId('message-retry-button');
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledWith('msg-1');
  });
});
