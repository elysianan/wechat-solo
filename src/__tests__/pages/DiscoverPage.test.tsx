import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DiscoverPage } from '../../pages/DiscoverPage';
import { useAppStore } from '../../stores/useAppStore';

describe('发现页', () => {
  // 每个测试前重置应用状态，定位到发现 tab
  beforeEach(() => {
    useAppStore.setState({ currentTab: 'discover', pageStack: [{ type: 'tabs' }] });
  });

  it('点击朋友圈进入朋友圈页', () => {
    render(<DiscoverPage />);
    fireEvent.click(screen.getByTestId('discover-entry-moments'));
    expect(useAppStore.getState().pageStack.at(-1)?.type).toBe('moments');
  });

  it('点击扫一扫弹出 Toast', async () => {
    render(<DiscoverPage />);
    fireEvent.click(screen.getByTestId('discover-entry-scan'));
    await waitFor(() => {
      expect(screen.getByText('演示模式 · 该功能仅供展示')).toBeInTheDocument();
    });
  });
});
