import { MessageCircle, Users, Compass, User } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { cn } from '../../utils/cn';

type Tab = 'chats' | 'contacts' | 'discover' | 'me';

interface TabConfig {
  id: Tab;
  label: string;
  icon: React.ElementType;
}

const tabs: TabConfig[] = [
  { id: 'chats', label: '微信', icon: MessageCircle },
  { id: 'contacts', label: '通讯录', icon: Users },
  { id: 'discover', label: '发现', icon: Compass },
  { id: 'me', label: '我', icon: User },
];

export function TabBar() {
  const { currentTab, setCurrentTab } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-wechat-card border-t border-wechat-divider max-w-phone mx-auto">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className="flex flex-col items-center px-4 py-1"
              data-testid={`tab-${tab.id}`}
            >
              <Icon
                size={24}
                className={cn(
                  'transition-colors',
                  isActive ? 'text-wechat-green' : 'text-wechat-text-secondary'
                )}
              />
              <span
                className={cn(
                  'text-xs mt-1',
                  isActive ? 'text-wechat-green' : 'text-wechat-text-secondary'
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
