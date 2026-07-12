import { useState } from 'react';
import { Header } from '../components/common/Header';
import { WeChatToast } from '../components/common/WeChatToast';
import { useAppStore } from '../stores/useAppStore';
import { Camera, Scan, CircleDot, MapPin, ShoppingBag, Gamepad2 } from 'lucide-react';

interface DiscoverEntry {
  id: string;
  label: string;
  icon: React.ElementType;
  action: 'moments' | 'toast';
}

const entries: DiscoverEntry[] = [
  { id: 'moments', label: '朋友圈', icon: Camera, action: 'moments' },
  { id: 'scan', label: '扫一扫', icon: Scan, action: 'toast' },
  { id: 'shake', label: '摇一摇', icon: CircleDot, action: 'toast' },
  { id: 'nearby', label: '附近的人', icon: MapPin, action: 'toast' },
  { id: 'shopping', label: '购物', icon: ShoppingBag, action: 'toast' },
  { id: 'games', label: '游戏', icon: Gamepad2, action: 'toast' },
];

// 发现页：朋友圈可进入，其余入口演示模式 Toast
export function DiscoverPage() {
  const navigateToMoments = useAppStore((state) => state.navigateToMoments);
  const [toastVisible, setToastVisible] = useState(false);

  const handleClick = (entry: DiscoverEntry) => {
    if (entry.action === 'moments') {
      navigateToMoments();
    } else {
      setToastVisible(true);
    }
  };

  return (
    <div className="min-h-screen bg-wechat-bg pb-16" data-testid="discover-page">
      <Header title="发现" />
      <div className="mt-2 bg-white divide-y divide-wechat-divider">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.id}
              onClick={() => handleClick(entry)}
              className="w-full flex items-center px-4 py-3 active:bg-gray-100"
              data-testid={`discover-entry-${entry.id}`}
            >
              <Icon size={22} className="text-wechat-green" />
              <span className="ml-3 text-base text-wechat-text-primary flex-1 text-left">{entry.label}</span>
              <span className="text-wechat-text-secondary text-sm">›</span>
            </button>
          );
        })}
      </div>
      <WeChatToast
        message="演示模式 · 该功能仅供展示"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}
