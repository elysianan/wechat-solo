import { create } from 'zustand';
import { db } from '../db/database';

interface SettingsState {
  darkMode: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  version: string;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  setDarkMode: (value: boolean) => Promise<void>;
  setSoundEnabled: (value: boolean) => Promise<void>;
  setVibrationEnabled: (value: boolean) => Promise<void>;
}

// 默认设置：与 db/init.ts 中的 seed 保持一致
const DEFAULT_SETTINGS = {
  darkMode: false,
  soundEnabled: true,
  vibrationEnabled: true,
  version: '1.5.0-Sprint5',
};

// 应用设置状态：持久化到 IndexedDB 的 settings 表
export const useSettingsStore = create<SettingsState>((set) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,

  loadSettings: async () => {
    const saved = await db.settings.get('app');
    if (saved) {
      set({
        darkMode: saved.darkMode,
        soundEnabled: saved.soundEnabled,
        vibrationEnabled: saved.vibrationEnabled,
        version: saved.version,
        loaded: true,
      });
    } else {
      await db.settings.put({ id: 'app', ...DEFAULT_SETTINGS });
      set({ loaded: true });
    }
  },

  setDarkMode: async (value) => {
    set({ darkMode: value });
    await db.settings.update('app', { darkMode: value });
  },

  setSoundEnabled: async (value) => {
    set({ soundEnabled: value });
    await db.settings.update('app', { soundEnabled: value });
  },

  setVibrationEnabled: async (value) => {
    set({ vibrationEnabled: value });
    await db.settings.update('app', { vibrationEnabled: value });
  },
}));
