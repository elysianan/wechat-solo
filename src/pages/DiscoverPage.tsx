import type { ElementType } from 'react';
import { useState } from 'react';
import { Header } from '../components/common/Header';
import { WeChatToast } from '../components/common/WeChatToast';
import { useAppStore } from '../stores/useAppStore';
import { Camera, Scan, CircleDot, MapPin, ShoppingBag, Gamepad2, Blocks } from 'lucide-react';

interface DiscoverEntry {
  id: string;
  label: string;
  icon: ElementType;
  action: 'moments' | 'toast';
}

// 第一组：朋友圈
const momentsGroup: DiscoverEntry[] = [
  { id: 'moments', label: '朋友圈', icon: Camera, action: 'moments' },
];

// 第二组：扫一扫、摇一摇、附近的人
const socialGroup: DiscoverEntry[] = [
  { id: 'scan', label: '扫一扫', icon: Scan, action: 'toast' },
  { id: 'shake', label: '摇一摇', icon: CircleDot, action: 'toast' },
  { id: 'nearby', label: '附近的人', icon: MapPin, action: 'toast' },
];

// 第三组：购物、游戏、小程序
const entertainmentGroup: DiscoverEntry[] = [
  { id: 'shopping', label: '购物', icon: ShoppingBag, action: 'toast' },
  { id: 'games', label: '游戏', icon: Gamepad2, action: 'toast' },
  { id: 'mini-programs', label: '小程序', icon: Blocks, action: 'toast' },
];

const groups = [momentsGroup, socialGroup, entertainmentGroup];

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
    <div className="h-full overflow-y-auto bg-wechat-bg pb-16" data-testid="discover-page">
      <Header title="发现" />
      {groups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className={`${groupIndex > 0 ? 'mt-2' : ''} bg-wechat-card divide-y divide-wechat-divider`}
          data-testid={`discover-group-${groupIndex}`}
        >
          {group.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.id}
                onClick={() => handleClick(entry)}
                className="w-full flex items-center px-4 py-3 active:bg-wechat-bg"
                data-testid={`discover-entry-${entry.id}`}
              >
                <Icon size={22} className="text-wechat-green" />
                <span className="ml-3 text-base text-wechat-text-primary flex-1 text-left">{entry.label}</span>
                <span className="text-wechat-text-secondary text-sm">›</span>
              </button>
            );
          })}
        </div>
      ))}
      <WeChatToast
        message="演示模式 · 该功能仅供展示"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}
