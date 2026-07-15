import { assetUrl } from '../../utils/asset';
import type { ContactCardMessage as ContactCardMessageType } from '../../types';

interface ContactCardMessageProps {
  message: ContactCardMessageType;
  onClick?: () => void;
}

export function ContactCardMessage({ message, onClick }: ContactCardMessageProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 w-[220px] p-3 bg-wechat-card rounded-lg cursor-pointer active:opacity-90"
      data-testid="contact-card-message"
    >
      <img
        src={assetUrl(message.avatar)}
        alt={message.nickname}
        className="w-10 h-10 rounded bg-wechat-bg object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-wechat-text-primary truncate">{message.nickname}</div>
        <div className="text-xs text-wechat-text-secondary truncate">{message.region || ''}</div>
      </div>
    </div>
  );
}
