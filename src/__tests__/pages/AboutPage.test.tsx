import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AboutPage } from '../../pages/AboutPage';
import { useAppStore } from '../../stores/useAppStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

describe('关于页', () => {
  beforeEach(() => {
    useSettingsStore.setState({ version: '1.4.0-Sprint4' });
    useAppStore.setState({
      currentTab: 'me',
      pageStack: [{ type: 'tabs' }, { type: 'settings' }, { type: 'about' }],
    });
  });

  it('展示版本号', () => {
    render(<AboutPage />);
    expect(screen.getByTestId('about-version')).toHaveTextContent('1.4.0-Sprint4');
  });

  it('展示项目说明', () => {
    render(<AboutPage />);
    expect(screen.getByText(/纯前端、可离线运行/)).toBeInTheDocument();
  });

  it('点击返回回到设置页', () => {
    render(<AboutPage />);
    fireEvent.click(screen.getByTestId('header-back'));
    expect(useAppStore.getState().pageStack.at(-1)?.type).toBe('settings');
  });
});
