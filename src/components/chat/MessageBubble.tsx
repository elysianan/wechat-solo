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
      className="max-w-full rounded object-cover max-h-[200px]"
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
      className={`flex items-center gap-3 min-w-[180px] rounded p-3 ${
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

// 气泡尾巴：用 border 三角形实现，颜色跟随气泡背景
function BubbleTail({ isMe }: { isMe: boolean }) {
  return (
    <span
      className={`absolute bottom-2 w-0 h-0 border-y-4 border-y-transparent ${
        isMe
          ? '-right-1.5 border-l-4 border-l-wechat-green'
          : '-left-1.5 border-r-4 border-r-wechat-card'
      }`}
      data-testid="bubble-tail"
    />
  );
}

// 单条聊天消息气泡：左侧显示对方头像和昵称，右侧显示自己消息和状态
export function MessageBubble({ message, isMe, contactName, contactAvatar }: MessageBubbleProps) {
  // 微信风格非对称圆角：尾巴侧小圆角，对侧大圆角
  const bubbleRadius = isMe ? 'rounded-[16px_4px_4px_16px]' : 'rounded-[4px_16px_16px_4px]';

  return (
    <div
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4 px-4 animate-message-in`}
      data-testid="message-bubble"
    >
      {!isMe && (
        <img
          src={assetUrl(contactAvatar)}
          alt={contactName}
          className="w-10 h-10 rounded bg-wechat-bg object-cover mr-3 flex-shrink-0"
        />
      )}
      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isMe && (
          <span className="text-xs text-wechat-text-secondary mb-1" data-testid="message-sender-name">{contactName}</span>
        )}
        <div className="flex items-end gap-1">
          {isMe && (
            <div className="flex items-center mb-2 gap-0.5" data-testid="message-status">
              <StatusIcon status={message.status} />
            </div>
          )}
          <div
            className={`relative px-3 py-2 text-base break-words ${bubbleRadius} ${
              isMe ? 'bg-wechat-green text-white' : 'bg-wechat-card text-wechat-text-primary'
            }`}
            data-testid="message-content"
          >
            <BubbleTail isMe={isMe} />
            {renderContent(message, isMe)}
          </div>
        </div>
      </div>
    </div>
  );
}
