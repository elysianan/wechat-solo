import { ChevronRight } from 'lucide-react';
import { Header } from '../components/common/Header';
import { Switch } from '../components/common/Switch';
import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore } from '../stores/useSettingsStore';

interface SettingRowProps {
  label: string;
  children: React.ReactNode;
}

function SettingRow({ label, children }: SettingRowProps) {
  return (
    <div className="flex items-center px-4 h-11">
      <span className="text-base text-wechat-text-primary flex-1">{label}</span>
      {children}
    </div>
  );
}

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-[10px]">
      <div className="px-4 py-1.5 text-xs text-wechat-text-secondary">{title}</div>
      <div className="bg-wechat-card divide-y divide-wechat-divider">{children}</div>
    </div>
  );
}

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

      <SettingGroup title="通用">
        <SettingRow label="深色模式">
          <Switch checked={darkMode} onChange={setDarkMode} testId="settings-darkmode" />
        </SettingRow>
      </SettingGroup>

      <SettingGroup title="新消息通知">
        <SettingRow label="声音">
          <Switch checked={soundEnabled} onChange={setSoundEnabled} testId="settings-sound" />
        </SettingRow>
        <SettingRow label="震动">
          <Switch checked={vibrationEnabled} onChange={setVibrationEnabled} testId="settings-vibration" />
        </SettingRow>
      </SettingGroup>

      <SettingGroup title="关于">
        <button
          onClick={navigateToAbout}
          className="w-full flex items-center px-4 h-11 active:bg-wechat-bg active:scale-[0.98] transition-transform duration-100"
          data-testid="settings-about"
        >
          <span className="text-base text-wechat-text-primary flex-1 text-left">关于 WeChat Solo</span>
          <ChevronRight size={18} className="text-wechat-text-secondary" />
        </button>
      </SettingGroup>
    </div>
  );
}
