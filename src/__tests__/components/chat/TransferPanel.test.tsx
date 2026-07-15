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

  it('重新打开时清空金额和备注', () => {
    const { rerender } = render(<TransferPanel visible onConfirm={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('金额'), { target: { value: '88' } });
    fireEvent.change(screen.getByPlaceholderText('备注（可选）'), { target: { value: '吃饭' } });

    rerender(<TransferPanel visible={false} onConfirm={vi.fn()} onClose={vi.fn()} />);
    rerender(<TransferPanel visible onConfirm={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByTestId('transfer-amount-input')).toHaveValue(null);
    expect(screen.getByTestId('transfer-note-input')).toHaveValue('');
  });

  it('点击遮罩关闭，点击内容不关闭', () => {
    const onClose = vi.fn();
    render(<TransferPanel visible onConfirm={vi.fn()} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('transfer-panel'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByText('转账')[0].closest('div')!);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText('金额'), { target: { value: '88' } });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
