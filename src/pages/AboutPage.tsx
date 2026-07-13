import { MessageCircle } from 'lucide-react';
import { Header } from '../components/common/Header';
import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore } from '../stores/useSettingsStore';

// 关于页：版本号与项目说明
export function AboutPage() {
  const popPage = useAppStore((state) => state.popPage);
  const version = useSettingsStore((state) => state.version);

  return (
    <div className="min-h-screen bg-wechat-bg" data-testid="about-page">
      <Header title="关于 WeChat Solo" onBack={popPage} />

      <div className="flex flex-col items-center pt-16">
        <div className="w-20 h-20 rounded-2xl bg-wechat-green flex items-center justify-center">
          <MessageCircle size={44} className="text-white" />
        </div>
        <div className="text-lg font-medium text-wechat-text-primary mt-4">WeChat Solo</div>
        <div className="text-sm text-wechat-text-secondary mt-1" data-testid="about-version">
          Version {version}
        </div>
      </div>

      <div className="mx-6 mt-10 text-sm text-wechat-text-secondary leading-6 text-center">
        一个纯前端、可离线运行的微信风格 Demo。
        <br />
        所有好友均由本地 Agent 引擎扮演，数据仅存于浏览器 IndexedDB。
        <br />
        本项目仅用于学习与作品集展示，与微信官方无关。
      </div>
    </div>
  );
}
