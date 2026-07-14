import { Check, CheckCheck, Gift, Image as ImageIcon, Mic } from 'lucide-react';
import type { Message, MessageStatus, RedPacketMessage } from '../../types';
import { assetUrl } from '../../utils/asset';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  contactName: string;
  contactAvatar: string;
}

// 根据消息状态返回对应图标：单灰勾 / 双灰勾 / 双绿勾 / 失败
function StatusIcon({ status }: { status: MessageStatus }) {
  if (status === 'sending') {
    return <span className="text-wechat-text-secondary text-xs">·</span>;
  }
  if (status === 'sent') {
    return <Check size={12} className="text-wechat-text-secondary" />;
  }
  if (status === 'delivered') {
    return <CheckCheck size={12} className="text-wechat-text-secondary" />;
  }
  if (status === 'read') {
    return <CheckCheck size={12} className="text-wechat-green" />;
  }
  return <span className="text-red-500 text-xs font-bold">!</span>;
}

function ImageBubble({ url }: { url: string }) {
  const src = url.startsWith('blob:') || url.startsWith('http') || url.startsWith('data:')
    ? url
    : assetUrl(url);
  return (
    <img
      src={src}
      alt="图片"
      className="max-w-full rounded-lg object-cover max-h-[200px]"
      data-testid="image-message"
    />
  );
}

function VoiceBubble({ duration, isMe }: { duration: number; isMe: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 min-w-[80px] ${isMe ? 'flex-row-reverse' : ''}`}
      data-testid="voice-message"
    >
      <Mic size={18} />
      <span>{duration}"</span>
    </div>
  );
}

function RedPacketBubble({ message }: { message: RedPacketMessage }) {
  const isOpened = message.packetStatus === 'opened';
  return (
    <div
      className={`flex items-center gap-3 min-w-[180px] rounded-md p-3 ${
        isOpened ? 'bg-red-300' : 'bg-red-500'
      } text-white`}
      data-testid="redpacket-message"
    >
      <Gift size={28} />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{message.title}</div>
        <div className="text-xs opacity-90">{isOpened ? '已领取' : '微信红包'}</div>
      </div>
      <div className="text-lg font-bold">¥{message.amount.toFixed(2)}</div>
    </div>
  );
}

function renderContent(message: Message, isMe: boolean) {
  switch (message.type) {
    case 'text':
      return message.content;
    case 'image':
      return <ImageBubble url={message.url} />;
    case 'voice':
      return <VoiceBubble duration={message.duration} isMe={isMe} />;
    case 'redpacket':
      return <RedPacketBubble message={message} />;
    case 'transfer':
      return (
        <span className="flex items-center gap-1">
          <ImageIcon size={16} />
          [转账] ¥{message.amount.toFixed(2)}
        </span>
      );
    case 'location':
      return (
        <span className="flex items-center gap-1">
          <ImageIcon size={16} />
          [位置] {message.address}
        </span>
      );
    default:
      return null;
  }
}

// 单条聊天消息气泡：左侧显示对方头像和昵称，右侧显示自己消息和状态
export function MessageBubble({ message, isMe, contactName, contactAvatar }: MessageBubbleProps) {
  return (
    <div
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4 px-4`}
      data-testid="message-bubble"
    >
      {!isMe && (
        <img
          src={assetUrl(contactAvatar)}
          alt={contactName}
          className="w-10 h-10 rounded-md bg-gray-200 object-cover mr-3 flex-shrink-0"
        />
      )}
      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isMe && (
          <span className="text-xs text-wechat-text-secondary mb-1" data-testid="message-sender-name">{contactName}</span>
        )}
        <div
          className={`relative px-3 py-2 rounded-lg text-sm break-words ${
            isMe ? 'bg-wechat-green text-white' : 'bg-wechat-card text-wechat-text-primary'
          }`}
          data-testid="message-content"
        >
          {renderContent(message, isMe)}
        </div>
        {isMe && (
          <div className="flex items-center mt-1 gap-0.5" data-testid="message-status">
            <StatusIcon status={message.status} />
          </div>
        )}
      </div>
    </div>
  );
}
