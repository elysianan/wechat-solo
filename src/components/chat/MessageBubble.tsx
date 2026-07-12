import { Check, CheckCheck } from 'lucide-react';
import type { Message, MessageStatus } from '../../types';

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

// 单条聊天消息气泡：左侧显示对方头像和昵称，右侧显示自己消息和状态
export function MessageBubble({ message, isMe, contactName, contactAvatar }: MessageBubbleProps) {
  return (
    <div
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4 px-4`}
      data-testid="message-bubble"
    >
      {!isMe && (
        <img
          src={contactAvatar}
          alt={contactName}
          className="w-10 h-10 rounded-md bg-gray-200 object-cover mr-3 flex-shrink-0"
        />
      )}
      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isMe && (
          <span className="text-xs text-wechat-text-secondary mb-1">{contactName}</span>
        )}
        <div
          className={`relative px-3 py-2 rounded-lg text-sm break-words ${
            isMe ? 'bg-wechat-green text-white' : 'bg-white text-wechat-text-primary'
          }`}
          data-testid="message-content"
        >
          {message.content}
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
