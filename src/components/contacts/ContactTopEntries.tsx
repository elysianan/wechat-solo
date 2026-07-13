import { UserPlus, Users, Tag } from 'lucide-react';
import type { ElementType } from 'react';
import { useState } from 'react';
import { WeChatToast } from '../common/WeChatToast';
import { useAppStore } from '../../stores/useAppStore';

interface TopEntry {
  id: string;
  label: string;
  icon: ElementType;
  action: 'toast' | 'group-list' | 'tag-list';
}

// 顶部固定入口配置：新的朋友（占位）、群聊、标签
const entries: TopEntry[] = [
  { id: 'new-friends', label: '新的朋友', icon: UserPlus, action: 'toast' },
  { id: 'groups', label: '群聊', icon: Users, action: 'group-list' },
  { id: 'tags', label: '标签', icon: Tag, action: 'tag-list' },
];

// 通讯录顶部入口：群聊/标签接入真实页面，新的朋友仍为演示占位
export function ContactTopEntries() {
  const [toastVisible, setToastVisible] = useState(false);
  const navigateToGroupList = useAppStore((state) => state.navigateToGroupList);
  const navigateToTagList = useAppStore((state) => state.navigateToTagList);

  const handleClick = (entry: TopEntry) => {
    if (entry.action === 'group-list') {
      navigateToGroupList();
    } else if (entry.action === 'tag-list') {
      navigateToTagList();
    } else {
      setToastVisible(true);
    }
  };

  return (
    <>
      <div className="bg-wechat-card divide-y divide-wechat-divider" data-testid="contact-top-entries">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.id}
              onClick={() => handleClick(entry)}
              className="w-full flex items-center px-4 py-3 active:bg-wechat-bg"
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
