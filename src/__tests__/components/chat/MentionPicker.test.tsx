import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MentionPicker } from '../../../components/chat/MentionPicker';

describe('MentionPicker @成员选择器', () => {
  const members = [
    { id: 'mom', name: '王阿姨' },
    { id: 'boss', name: '张总' },
  ];

  it('渲染成员列表', () => {
    render(<MentionPicker visible members={members} onSelect={() => {}} onClose={() => {}} />);
    expect(screen.getByText('王阿姨')).toBeInTheDocument();
    expect(screen.getByText('张总')).toBeInTheDocument();
  });

  it('点击成员触发 onSelect', () => {
    const onSelect = vi.fn();
    render(<MentionPicker visible members={members} onSelect={onSelect} onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('mention-member-mom'));
    expect(onSelect).toHaveBeenCalledWith('王阿姨');
  });

  it('点击遮罩触发 onClose', () => {
    const onClose = vi.fn();
    render(<MentionPicker visible members={members} onSelect={() => {}} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('mention-picker-mask'));
    expect(onClose).toHaveBeenCalled();
  });

  it('visible 为 false 时不渲染', () => {
    render(<MentionPicker visible={false} members={members} onSelect={() => {}} onClose={() => {}} />);
    expect(screen.queryByTestId('mention-picker')).not.toBeInTheDocument();
  });
});
