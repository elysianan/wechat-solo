import { Header } from '../components/common/Header';
import { ChatListItem } from '../components/chat/ChatListItem';
import { useAppStore } from '../stores/useAppStore';
import { useChatStore } from '../stores/useChatStore';

// 群聊列表页：从通讯录「群聊」入口进入
export function GroupListPage() {
  const popPage = useAppStore((state) => state.popPage);
  const navigateToChatDetail = useAppStore((state) => state.navigateToChatDetail);
  // 先取原始数组再过滤：selector 直接 filter 会每次返回新引用导致无限重渲染
  const conversations = useChatStore((state) => state.conversations);
  const groups = conversations.filter((c) => c.type === 'group');

  return (
    <div className="h-full overflow-y-auto bg-wechat-bg" data-testid="group-list-page">
      <Header title="群聊" onBack={popPage} />
      <div className="divide-y divide-wechat-divider">
        {groups.map((group) => (
          <ChatListItem
            key={group.id}
            avatar={group.avatar ?? ''}
            name={group.name ?? '群聊'}
            preview=""
            time={group.updatedAt}
            unreadCount={0}
            onClick={() => navigateToChatDetail(group.id)}
          />
        ))}
      </div>
    </div>
  );
}
