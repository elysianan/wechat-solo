import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageInput } from '../../../components/chat/MessageInput';
import { useContactStore } from '../../../stores/useContactStore';
import type { Contact } from '../../../types';

const textPayload = (content: string) => ({ type: 'text' as const, content });

const mockContact: Contact = {
  id: 'u1',
  name: '王小明',
  avatar: '/avatar.svg',
  wechatId: 'wxid_1',
  region: '中国 深圳',
  signature: 'hello',
  tags: [],
  persona: {} as Contact['persona'],
  isOnline: true,
};

describe('MessageInput', () => {
  beforeEach(() => {
    useContactStore.setState({ contacts: [mockContact] });
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
    expect(onSend).toHaveBeenCalledWith(textPayload('你好'));
    expect(screen.getByTestId('text-input')).toHaveValue('');
  });

  it('回车键触发发送', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    fireEvent.change(screen.getByTestId('text-input'), { target: { value: '回车测试' } });
    fireEvent.keyDown(screen.getByTestId('text-input'), { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith(textPayload('回车测试'));
  });

  it('点击 + 展开工具菜单，再次点击收起', () => {
    render(<MessageInput onSend={vi.fn()} />);
    fireEvent.click(screen.getByTestId('tool-button'));
    expect(screen.getByTestId('tool-image-button')).toBeInTheDocument();
    expect(screen.getByTestId('tool-voice-button')).toBeInTheDocument();
    expect(screen.getByTestId('tool-redpacket-button')).toBeInTheDocument();
    expect(screen.getByTestId('tool-location-button')).toBeInTheDocument();
    expect(screen.getByTestId('tool-contact-card-button')).toBeInTheDocument();
    expect(screen.getByTestId('tool-transfer-button')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tool-button'));
    expect(screen.queryByTestId('tool-image-button')).not.toBeInTheDocument();
  });

  it('选择图片后发送 image payload', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    fireEvent.click(screen.getByTestId('tool-button'));

    const file = new File(['pixels'], 'photo.png', { type: 'image/png' });
    fireEvent.change(screen.getByTestId('image-file-input'), { target: { files: [file] } });

    expect(onSend).toHaveBeenCalledTimes(1);
    const payload = onSend.mock.calls[0][0];
    expect(payload.type).toBe('image');
    expect(payload.url).toMatch(/^blob:/);
  });

  it('按住语音按钮并松开发送 voice payload', () => {
    vi.useFakeTimers();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    fireEvent.click(screen.getByTestId('tool-button'));

    const voiceButton = screen.getByTestId('tool-voice-button');
    fireEvent.mouseDown(voiceButton);
    vi.advanceTimersByTime(2000);
    fireEvent.mouseUp(voiceButton);

    expect(onSend).toHaveBeenCalledTimes(1);
    const payload = onSend.mock.calls[0][0];
    expect(payload.type).toBe('voice');
    expect(payload.duration).toBeGreaterThanOrEqual(1);
    vi.useRealTimers();
  });

  it('打开红包面板并发送 redpacket payload', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    fireEvent.click(screen.getByTestId('tool-button'));
    fireEvent.click(screen.getByTestId('tool-redpacket-button'));

    fireEvent.change(screen.getByTestId('redpacket-amount-input'), { target: { value: '8.88' } });
    fireEvent.change(screen.getByTestId('redpacket-title-input'), { target: { value: '大吉大利' } });
    fireEvent.click(screen.getByTestId('redpacket-send-button'));

    expect(onSend).toHaveBeenCalledWith({ type: 'redpacket', amount: 8.88, title: '大吉大利' });
  });

  it('点击位置按钮发送 location payload', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    fireEvent.click(screen.getByTestId('tool-button'));
    fireEvent.click(screen.getByTestId('tool-location-button'));

    expect(onSend).toHaveBeenCalledWith({
      type: 'location',
      name: '腾讯大厦',
      address: '深圳市南山区海天二路33号',
      lat: 22.5408,
      lng: 113.9345,
    });
  });

  it('点击名片按钮选择联系人后发送 contact_card payload', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    fireEvent.click(screen.getByTestId('tool-button'));
    fireEvent.click(screen.getByTestId('tool-contact-card-button'));

    expect(screen.getByTestId('contact-picker-sheet')).toBeInTheDocument();
    fireEvent.click(screen.getByText('王小明'));

    expect(onSend).toHaveBeenCalledWith({
      type: 'contact_card',
      contactId: 'u1',
      nickname: '王小明',
      avatar: '/avatar.svg',
      region: '中国 深圳',
      signature: 'hello',
    });
  });

  it('点击转账按钮输入金额备注后发送 transfer payload', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    fireEvent.click(screen.getByTestId('tool-button'));
    fireEvent.click(screen.getByTestId('tool-transfer-button'));

    fireEvent.change(screen.getByTestId('transfer-amount-input'), { target: { value: '88' } });
    fireEvent.change(screen.getByTestId('transfer-note-input'), { target: { value: '吃饭' } });
    fireEvent.click(screen.getByTestId('transfer-confirm-button'));

    expect(onSend).toHaveBeenCalledWith({ type: 'transfer', amount: 88, note: '吃饭' });
  });
});
