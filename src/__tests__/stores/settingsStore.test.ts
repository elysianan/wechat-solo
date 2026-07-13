import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('useSettingsStore', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useSettingsStore.setState({
      darkMode: false,
      soundEnabled: true,
      vibrationEnabled: true,
      version: '1.5.0-Sprint5',
      loaded: false,
    });
  });

  it('从数据库加载已有设置', async () => {
    await initializeDatabase();
    await useSettingsStore.getState().loadSettings();

    const state = useSettingsStore.getState();
    expect(state.loaded).toBe(true);
    expect(state.darkMode).toBe(false);
    expect(state.soundEnabled).toBe(true);
    expect(state.version).toBe('1.5.0-Sprint5');
  });

  it('数据库无设置时写入默认值', async () => {
    await useSettingsStore.getState().loadSettings();

    expect(useSettingsStore.getState().loaded).toBe(true);
    const saved = await db.settings.get('app');
    expect(saved?.darkMode).toBe(false);
  });

  it('切换深色模式并持久化', async () => {
    await initializeDatabase();
    await useSettingsStore.getState().loadSettings();

    await useSettingsStore.getState().setDarkMode(true);
    expect(useSettingsStore.getState().darkMode).toBe(true);

    const saved = await db.settings.get('app');
    expect(saved?.darkMode).toBe(true);
  });

  it('深色模式刷新后保留：重置 store 重新加载', async () => {
    await initializeDatabase();
    await useSettingsStore.getState().loadSettings();
    await useSettingsStore.getState().setDarkMode(true);

    useSettingsStore.setState({ darkMode: false, loaded: false });
    await useSettingsStore.getState().loadSettings();

    expect(useSettingsStore.getState().darkMode).toBe(true);
  });

  it('声音与震动开关持久化', async () => {
    await initializeDatabase();
    await useSettingsStore.getState().loadSettings();

    await useSettingsStore.getState().setSoundEnabled(false);
    await useSettingsStore.getState().setVibrationEnabled(false);

    const saved = await db.settings.get('app');
    expect(saved?.soundEnabled).toBe(false);
    expect(saved?.vibrationEnabled).toBe(false);
  });
});
