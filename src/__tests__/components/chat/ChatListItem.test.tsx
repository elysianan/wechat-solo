import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatListItem } from '../../../components/chat/ChatListItem';

describe('ChatListItem', () => {
  it('渲染头像、昵称、预览、时间', () => {
    render(
      <ChatListItem
        avatar="/avatar.svg"
        name="王阿姨"
        preview="吃了吗？"
        time={Date.now()}
        unreadCount={0}
      />
    );
    expect(screen.getByText('王阿姨')).toBeInTheDocument();
    expect(screen.getByText('吃了吗？')).toBeInTheDocument();
  });

  it('未读数大于 0 时显示角标', () => {
    render(
      <ChatListItem
        avatar="/avatar.svg"
        name="王阿姨"
        preview="吃了吗？"
        time={Date.now()}
        unreadCount={3}
      />
    );
    expect(screen.getByTestId('unread-badge')).toHaveTextContent('3');
  });

  it('点击触发 onClick', () => {
    const onClick = vi.fn();
    render(
      <ChatListItem
        avatar="/avatar.svg"
        name="王阿姨"
        preview="吃了吗？"
        time={Date.now()}
        unreadCount={0}
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByTestId('chat-list-item'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('名片消息预览显示为[名片]', () => {
    render(
      <ChatListItem
        avatar="/avatar.svg"
        name="王阿姨"
        preview="[名片]"
        time={Date.now()}
        unreadCount={0}
      />
    );
    expect(screen.getByText('[名片]')).toBeInTheDocument();
  });
});
