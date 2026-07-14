import { Header } from '../components/common/Header';
import { useAppStore } from '../stores/useAppStore';
import { useChatStore } from '../stores/useChatStore';
import { useContactStore } from '../stores/useContactStore';
import { assetUrl } from '../utils/asset';

// 群资料页：成员头像网格 + 群名称
export function GroupInfoPage() {
  const pageStack = useAppStore((state) => state.pageStack);
  const popPage = useAppStore((state) => state.popPage);
  const navigateToContactDetail = useAppStore((state) => state.navigateToContactDetail);
  const navigateToProfileEdit = useAppStore((state) => state.navigateToProfileEdit);

  const topRoute = pageStack[pageStack.length - 1];
  const conversationId = topRoute?.type === 'group-info' ? topRoute.conversationId : null;

  const conversation = useChatStore((state) =>
    state.conversations.find((c) => c.id === conversationId)
  );
  const contacts = useContactStore((state) => state.contacts);
  const me = useContactStore((state) => state.me);

  if (!conversation) return null;

  const members = contacts.filter((c) => conversation.memberIds?.includes(c.id));

  return (
    <div className="h-full overflow-y-auto bg-wechat-bg" data-testid="group-info-page">
      <Header title="群聊信息" onBack={popPage} />

      {/* 成员头像网格：我排在最前 */}
      <div className="bg-wechat-card px-4 py-4 grid grid-cols-5 gap-4" data-testid="group-members-grid">
        <button
          onClick={navigateToProfileEdit}
          className="flex flex-col items-center"
          data-testid="group-member-me"
        >
          <img
            src={assetUrl(me?.avatar)}
            alt={me?.nickname}
            className="w-12 h-12 rounded bg-wechat-bg object-cover"
          />
          <span className="text-xs text-wechat-text-secondary mt-1 truncate max-w-full">
            {me?.nickname ?? '我'}
          </span>
        </button>
        {members.map((member) => (
          <button
            key={member.id}
            onClick={() => navigateToContactDetail(member.id)}
            className="flex flex-col items-center"
            data-testid={`group-member-${member.id}`}
          >
            <img
              src={assetUrl(member.avatar)}
              alt={member.name}
              className="w-12 h-12 rounded bg-wechat-bg object-cover"
            />
            <span className="text-xs text-wechat-text-secondary mt-1 truncate max-w-full">
              {member.name}
            </span>
          </button>
        ))}
      </div>

      {/* 群名称 */}
      <div className="mt-2 bg-wechat-card flex items-center px-4 py-3">
        <span className="text-base text-wechat-text-primary flex-1">群聊名称</span>
        <span className="text-sm text-wechat-text-secondary">{conversation.name}</span>
      </div>
    </div>
  );
}
