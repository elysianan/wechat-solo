import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ContactPickerSheet } from '../../../components/chat/ContactPickerSheet';
import type { Contact } from '../../../types';

const contacts: Contact[] = [
  {
    id: 'u1',
    name: '王小明',
    avatar: '/avatar.svg',
    wechatId: 'wxid_1',
    region: '中国 深圳',
    signature: '',
    tags: [],
    persona: {} as Contact['persona'],
    isOnline: true,
  },
];

describe('ContactPickerSheet', () => {
  it('搜索过滤联系人', () => {
    render(<ContactPickerSheet visible contacts={contacts} onSelect={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('搜索联系人'), { target: { value: '小李' } });
    expect(screen.queryByText('王小明')).not.toBeInTheDocument();
  });

  it('选择联系人触发 onSelect', () => {
    const onSelect = vi.fn();
    render(<ContactPickerSheet visible contacts={contacts} onSelect={onSelect} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('王小明'));
    expect(onSelect).toHaveBeenCalledWith(contacts[0]);
  });

  it('重新打开时清空搜索内容', () => {
    const { rerender } = render(
      <ContactPickerSheet visible contacts={contacts} onSelect={vi.fn()} onClose={vi.fn()} />
    );
    const searchInput = screen.getByPlaceholderText('搜索联系人');
    fireEvent.change(searchInput, { target: { value: '小王' } });
    expect(searchInput).toHaveValue('小王');

    rerender(<ContactPickerSheet visible={false} contacts={contacts} onSelect={vi.fn()} onClose={vi.fn()} />);
    rerender(<ContactPickerSheet visible contacts={contacts} onSelect={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByPlaceholderText('搜索联系人')).toHaveValue('');
  });

  it('点击遮罩关闭，点击内容不关闭', () => {
    const onClose = vi.fn();
    render(<ContactPickerSheet visible contacts={contacts} onSelect={vi.fn()} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('contact-picker-sheet'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('选择联系人'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByPlaceholderText('搜索联系人'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
