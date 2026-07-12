import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageInput } from '../../../components/chat/MessageInput';

describe('MessageInput', () => {
  it('点击工具按钮显示演示模式 Toast', () => {
    render(<MessageInput onSend={vi.fn()} />);
    fireEvent.click(screen.getByTestId('tool-button'));
    expect(screen.getByTestId('wechat-toast')).toHaveTextContent('演示模式');
  });

  it('输入空消息时发送按钮禁用', () => {
    render(<MessageInput onSend={vi.fn()} />);
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  it('输入消息后点击发送触发 onSend 并清空输入', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    fireEvent.change(screen.getByTestId('text-input'), { target: { value: '你好' } });
    fireEvent.click(screen.getByTestId('send-button'));
    expect(onSend).toHaveBeenCalledWith('你好');
    expect(screen.getByTestId('text-input')).toHaveValue('');
  });

  it('回车键触发发送', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    fireEvent.change(screen.getByTestId('text-input'), { target: { value: '回车测试' } });
    fireEvent.keyDown(screen.getByTestId('text-input'), { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('回车测试');
  });
});
