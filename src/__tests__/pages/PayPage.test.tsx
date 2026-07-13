import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PayPage } from '../../pages/PayPage';
import { useAppStore } from '../../stores/useAppStore';

describe('支付页', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentTab: 'me',
      pageStack: [{ type: 'tabs' }, { type: 'pay' }],
    });
  });

  it('展示余额卡片', () => {
    render(<PayPage />);
    expect(screen.getByTestId('pay-balance-card')).toBeInTheDocument();
    expect(screen.getByText('1,888.00')).toBeInTheDocument();
  });

  it('点击收付款弹出演示 Toast', async () => {
    render(<PayPage />);
    fireEvent.click(screen.getByTestId('pay-entry-qr'));
    await waitFor(() => {
      expect(screen.getByText('演示模式 · 该功能仅供展示')).toBeInTheDocument();
    });
  });

  it('点击返回回到 tab 层', () => {
    render(<PayPage />);
    fireEvent.click(screen.getByTestId('header-back'));
    expect(useAppStore.getState().pageStack.at(-1)?.type).toBe('tabs');
  });
});
