import { Header } from '../components/common/Header';
import { Switch } from '../components/common/Switch';
import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore } from '../stores/useSettingsStore';

// 设置页：深色模式 / 声音 / 震动 / 关于
export function SettingsPage() {
  const popPage = useAppStore((state) => state.popPage);
  const navigateToAbout = useAppStore((state) => state.navigateToAbout);

  const darkMode = useSettingsStore((state) => state.darkMode);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const vibrationEnabled = useSettingsStore((state) => state.vibrationEnabled);
  const setDarkMode = useSettingsStore((state) => state.setDarkMode);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const setVibrationEnabled = useSettingsStore((state) => state.setVibrationEnabled);

  return (
    <div className="h-full overflow-y-auto bg-wechat-bg" data-testid="settings-page">
      <Header title="设置" onBack={popPage} />

      {/* 通用 */}
      <div className="mt-2 bg-wechat-card divide-y divide-wechat-divider">
        <div className="flex items-center px-4 py-3">
          <span className="text-base text-wechat-text-primary flex-1">深色模式</span>
          <Switch checked={darkMode} onChange={setDarkMode} testId="settings-darkmode" />
        </div>
      </div>

      {/* 新消息通知 */}
      <div className="mt-2 bg-wechat-card divide-y divide-wechat-divider">
        <div className="flex items-center px-4 py-3">
          <span className="text-base text-wechat-text-primary flex-1">声音</span>
          <Switch checked={soundEnabled} onChange={setSoundEnabled} testId="settings-sound" />
        </div>
        <div className="flex items-center px-4 py-3">
          <span className="text-base text-wechat-text-primary flex-1">震动</span>
          <Switch checked={vibrationEnabled} onChange={setVibrationEnabled} testId="settings-vibration" />
        </div>
      </div>

      {/* 关于 */}
      <div className="mt-2 bg-wechat-card">
        <button
          onClick={navigateToAbout}
          className="w-full flex items-center px-4 py-3 active:bg-wechat-bg"
          data-testid="settings-about"
        >
          <span className="text-base text-wechat-text-primary flex-1 text-left">关于 WeChat Solo</span>
          <span className="text-wechat-text-secondary text-sm">›</span>
        </button>
      </div>
    </div>
  );
}
