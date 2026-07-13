import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPage } from '../../pages/SettingsPage';
import { useAppStore } from '../../stores/useAppStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('设置页', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await initializeDatabase();
    await useSettingsStore.getState().loadSettings();
    useAppStore.setState({
      currentTab: 'me',
      pageStack: [{ type: 'tabs' }, { type: 'settings' }],
    });
  });

  it('渲染三个开关与关于入口', () => {
    render(<SettingsPage />);
    expect(screen.getByText('深色模式')).toBeInTheDocument();
    expect(screen.getByText('声音')).toBeInTheDocument();
    expect(screen.getByText('震动')).toBeInTheDocument();
    expect(screen.getByText('关于 WeChat Solo')).toBeInTheDocument();
  });

  it('切换深色模式并持久化', async () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByTestId('settings-darkmode'));

    await waitFor(() => {
      expect(useSettingsStore.getState().darkMode).toBe(true);
    });
    const saved = await db.settings.get('app');
    expect(saved?.darkMode).toBe(true);
  });

  it('关闭声音开关并持久化', async () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByTestId('settings-sound'));

    await waitFor(() => {
      expect(useSettingsStore.getState().soundEnabled).toBe(false);
    });
  });

  it('点击关于进入关于页', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByTestId('settings-about'));
    expect(useAppStore.getState().pageStack.at(-1)?.type).toBe('about');
  });
});
