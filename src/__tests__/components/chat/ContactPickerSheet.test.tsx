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
});
