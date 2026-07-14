import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageInput } from '../../../components/chat/MessageInput';

describe('MessageInput @功能', () => {
  const members = [
    { id: 'mom', name: '王阿姨' },
    { id: 'boss', name: '张总' },
  ];

  it('群聊（传入 members）显示 @ 按钮', () => {
    render(<MessageInput onSend={() => {}} members={members} />);
    expect(screen.getByTestId('mention-button')).toBeInTheDocument();
  });

  it('单聊（不传 members）不显示 @ 按钮', () => {
    render(<MessageInput onSend={() => {}} />);
    expect(screen.queryByTestId('mention-button')).not.toBeInTheDocument();
  });

  it('选择成员后输入框插入「@名字 」', () => {
    render(<MessageInput onSend={() => {}} members={members} />);

    fireEvent.click(screen.getByTestId('mention-button'));
    fireEvent.click(screen.getByTestId('mention-member-mom'));

    expect(screen.getByTestId('text-input')).toHaveValue('@王阿姨 ');
  });

  it('@后发送，消息内容包含提及文本', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} members={members} />);

    fireEvent.click(screen.getByTestId('mention-button'));
    fireEvent.click(screen.getByTestId('mention-member-boss'));
    fireEvent.change(screen.getByTestId('text-input'), { target: { value: '@张总 方案好了' } });
    fireEvent.click(screen.getByTestId('send-button'));

    expect(onSend).toHaveBeenCalledWith({ type: 'text', content: '@张总 方案好了' });
  });
});
