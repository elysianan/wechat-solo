import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MePage } from '../../pages/MePage';
import { useAppStore } from '../../stores/useAppStore';
import { useContactStore } from '../../stores/useContactStore';

describe('「我」页面', () => {
  beforeEach(() => {
    useAppStore.setState({ currentTab: 'me', pageStack: [{ type: 'tabs' }] });
    useContactStore.setState({
      me: {
        id: 'me',
        nickname: '测试昵称',
        avatar: '/avatar-me.svg',
        wechatId: 'wxid_test',
        region: '中国 上海',
        signature: '测试签名',
      },
    });
  });

  it('信息卡展示昵称与微信号', () => {
    render(<MePage />);
    expect(screen.getByText('测试昵称')).toBeInTheDocument();
    expect(screen.getByText('微信号：wxid_test')).toBeInTheDocument();
  });

  it('点击信息卡进入个人信息编辑页', () => {
    render(<MePage />);
    fireEvent.click(screen.getByTestId('me-profile-card'));
    expect(useAppStore.getState().pageStack.at(-1)?.type).toBe('profile-edit');
  });

  it('点击支付进入支付页', () => {
    render(<MePage />);
    fireEvent.click(screen.getByTestId('me-entry-pay'));
    expect(useAppStore.getState().pageStack.at(-1)?.type).toBe('pay');
  });

  it('点击设置进入设置页', () => {
    render(<MePage />);
    fireEvent.click(screen.getByTestId('me-entry-settings'));
    expect(useAppStore.getState().pageStack.at(-1)?.type).toBe('settings');
  });

  it('点击收藏弹出演示 Toast', async () => {
    render(<MePage />);
    fireEvent.click(screen.getByTestId('me-entry-favorites'));
    await waitFor(() => {
      expect(screen.getByText('演示模式 · 该功能仅供展示')).toBeInTheDocument();
    });
  });
});
