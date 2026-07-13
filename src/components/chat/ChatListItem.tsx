import { formatChatTime } from '../../utils/time';
import { assetUrl } from '../../utils/asset';

interface ChatListItemProps {
  avatar: string;
  name: string;
  preview: string;
  time: number;
  unreadCount: number;
  isPinned?: boolean;
  onClick?: () => void;
}

// 微信聊天列表单行：头像、昵称、最后消息预览、时间、未读红点
export function ChatListItem({
  avatar,
  name,
  preview,
  time,
  unreadCount,
  isPinned,
  onClick,
}: ChatListItemProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center px-4 py-3 bg-wechat-card active:bg-wechat-bg cursor-pointer"
      data-testid="chat-list-item"
    >
      <div className="relative">
        <img src={assetUrl(avatar)} alt={name} className="w-12 h-12 rounded-md bg-gray-200 object-cover" />
        {isPinned && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" data-testid="pinned-dot" />
        )}
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-wechat-text-primary truncate">{name}</span>
          <span className="text-xs text-wechat-text-secondary">{formatChatTime(time)}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm text-wechat-text-secondary truncate">{preview}</span>
          {unreadCount > 0 && (
            <span
              className="bg-red-500 text-white text-xs min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center"
              data-testid="unread-badge"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
