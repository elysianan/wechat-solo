import { UserPlus, Users, Tag } from 'lucide-react';
import { useState } from 'react';
import { WeChatToast } from '../common/WeChatToast';

interface TopEntry {
  id: string;
  label: string;
  icon: React.ElementType;
}

// 顶部固定入口配置：新的朋友、群聊、标签
const entries: TopEntry[] = [
  { id: 'new-friends', label: '新的朋友', icon: UserPlus },
  { id: 'groups', label: '群聊', icon: Users },
  { id: 'tags', label: '标签', icon: Tag },
];

// 通讯录顶部占位入口：点击提示演示模式
export function ContactTopEntries() {
  const [toastVisible, setToastVisible] = useState(false);

  return (
    <>
      <div className="bg-white divide-y divide-wechat-divider" data-testid="contact-top-entries">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.id}
              onClick={() => setToastVisible(true)}
              className="w-full flex items-center px-4 py-3 active:bg-gray-100"
              data-testid={`top-entry-${entry.id}`}
            >
              <Icon size={22} className="text-wechat-green" />
              <span className="ml-3 text-base text-wechat-text-primary">{entry.label}</span>
            </button>
          );
        })}
      </div>
      <WeChatToast
        message="演示模式 · 该功能仅供展示"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </>
  );
}
