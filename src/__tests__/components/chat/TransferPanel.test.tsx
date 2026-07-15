import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransferPanel } from '../../../components/chat/TransferPanel';

describe('TransferPanel', () => {
  it('输入金额和备注后确认', () => {
    const onConfirm = vi.fn();
    render(<TransferPanel visible onConfirm={onConfirm} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('金额'), { target: { value: '88' } });
    fireEvent.change(screen.getByPlaceholderText('备注（可选）'), { target: { value: '吃饭' } });
    fireEvent.click(screen.getByTestId('transfer-confirm-button'));
    expect(onConfirm).toHaveBeenCalledWith({ type: 'transfer', amount: 88, note: '吃饭' });
  });

  it('金额非法时不触发', () => {
    const onConfirm = vi.fn();
    render(<TransferPanel visible onConfirm={onConfirm} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('transfer-confirm-button'));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
