import { useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, Gift, X } from 'lucide-react';
import type { Message, MessageStatus, RedPacketMessage } from '../../types';
import { assetUrl } from '../../utils/asset';
import { useAppStore } from '../../stores/useAppStore';
import { ImageLightbox } from '../common/ImageLightbox';
import { MessageContextMenu } from './MessageContextMenu';
import { LocationMessageCard } from './LocationMessageCard';
import { ContactCardMessage } from './ContactCardMessage';
import { TransferMessageCard } from './TransferMessageCard';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  contactName: string;
  contactAvatar: string;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
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

function ImageBubble({ url, onClick }: { url: string; onClick?: () => void }) {
  const src = url.startsWith('blob:') || url.startsWith('http') || url.startsWith('data:')
    ? url
    : assetUrl(url);
  return (
    <img
      src={src}
      alt="图片"
      className="max-w-full rounded object-cover max-h-[200px] cursor-pointer"
      data-testid="image-message"
      onClick={onClick}
    />
  );
}

function VoiceBubble({
  duration,
  isMe,
  isPlaying,
  playedSeconds,
  onClick,
}: {
  duration: number;
  isMe: boolean;
  isPlaying: boolean;
  playedSeconds: number;
  onClick?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 min-w-[100px] cursor-pointer ${
        isMe ? 'flex-row-reverse' : ''
      }`}
      data-testid="voice-message"
      onClick={onClick}
    >
      <div className="flex items-end gap-0.5 h-5" data-testid="voice-play-button">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`w-1 bg-current rounded-full ${
              isPlaying ? 'animate-typing-pulse' : ''
            }`}
            style={{
              height: `${40 + i * 25}%`,
              animationDelay: `${i * 120}ms`,
            }}
          />
        ))}
      </div>
      <span className="text-sm">
        {isPlaying ? `${playedSeconds}"` : `${duration}"`}
      </span>
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/60 transition-all duration-200"
            style={{ width: `${Math.min(100, (playedSeconds / duration) * 100)}%` }}
            data-testid="voice-progress"
          />
        </div>
      )}
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

function renderContent(
  message: Message,
  isMe: boolean,
  onImageClick: () => void,
  voiceProps: {
    isPlaying: boolean;
    playedSeconds: number;
    onClick: () => void;
  },
  onContactCardClick?: () => void,
  onTransferClick?: () => void
) {
  switch (message.type) {
    case 'text':
      return message.content;
    case 'image':
      return <ImageBubble url={message.url} onClick={onImageClick} />;
    case 'voice':
      return (
        <VoiceBubble
          duration={message.duration}
          isMe={isMe}
          isPlaying={voiceProps.isPlaying}
          playedSeconds={voiceProps.playedSeconds}
          onClick={voiceProps.onClick}
        />
      );
    case 'redpacket':
      return <RedPacketBubble message={message} />;
    case 'transfer':
      return (
        <div onClick={onTransferClick} className="cursor-pointer" data-testid="transfer-message-card-wrapper">
          <TransferMessageCard message={message} isMe={isMe} />
        </div>
      );
    case 'location':
      return <LocationMessageCard message={message} />;
    case 'contact_card':
      return <ContactCardMessage message={message} onClick={onContactCardClick} />;
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

// 单条聊天消息气泡：支持长按菜单、图片查看、语音播放、失败重试
export function MessageBubble({
  message,
  isMe,
  contactName,
  contactAvatar,
  onDelete,
  onRetry,
}: MessageBubbleProps) {
  const navigateToContactDetail = useAppStore((state) => state.navigateToContactDetail);
  const navigateToTransferDetail = useAppStore((state) => state.navigateToTransferDetail);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const bubbleRadius = isMe ? 'rounded-[16px_4px_4px_16px]' : 'rounded-[4px_16px_16px_4px]';

  // 菜单打开时监听全局点击，点击菜单外部关闭
  useEffect(() => {
    if (!menuVisible) return;

    const handleDocumentPointerDown = () => {
      setMenuVisible(false);
    };

    // 延迟绑定，避免本次触发长按的 pointerUp 立即关闭菜单
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleDocumentPointerDown, { once: true });
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
    };
  }, [menuVisible]);
  useEffect(() => {
    if (!isPlaying || message.type !== 'voice') return;

    voiceTimer.current = setInterval(() => {
      setPlayedSeconds((prev) => {
        if (prev >= message.duration) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (voiceTimer.current) clearInterval(voiceTimer.current);
    };
  }, [isPlaying, message]);

  const handleVoiceClick = () => {
    if (message.type !== 'voice') return;
    if (isPlaying) {
      setIsPlaying(false);
      setPlayedSeconds(0);
    } else {
      setPlayedSeconds(0);
      setIsPlaying(true);
    }
  };

  const handleContactCardClick = () => {
    if (message.type === 'contact_card') {
      navigateToContactDetail(message.contactId);
    }
  };

  const handleTransferClick = () => {
    if (message.type === 'transfer') {
      navigateToTransferDetail(message.id);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const x = e.clientX;
    const y = e.clientY;
    longPressTimer.current = setTimeout(() => {
      setMenuPos({ x, y });
      setMenuVisible(true);
    }, 600);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuVisible(true);
  };

  const handleCopy = async () => {
    if (message.type !== 'text') return;
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      // 复制失败时静默忽略
    }
  };

  const menuItems = [];
  if (message.type === 'text') {
    menuItems.push({ id: 'copy', label: '复制', onClick: handleCopy });
  }
  if (message.type === 'image') {
    menuItems.push({
      id: 'view',
      label: '查看',
      onClick: () => setLightboxVisible(true),
    });
  }
  if (message.status === 'failed' && onRetry) {
    menuItems.push({
      id: 'retry',
      label: '重新发送',
      onClick: () => onRetry(message.id),
    });
  }
  if (isMe && onDelete) {
    menuItems.push({
      id: 'delete',
      label: '删除',
      onClick: () => onDelete(message.id),
      danger: true,
    });
  }

  const showRetryButton = isMe && message.status === 'failed' && onRetry;

  return (
    <>
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
            <span
              className="text-xs text-wechat-text-secondary mb-1"
              data-testid="message-sender-name"
            >
              {contactName}
            </span>
          )}
          <div className="flex items-end gap-1">
            {isMe && (
              <div className="flex items-center mb-2 gap-0.5" data-testid="message-status">
                {showRetryButton ? (
                  <button
                    onClick={() => onRetry?.(message.id)}
                    className="text-red-500 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full bg-red-500/10"
                    data-testid="message-retry-button"
                    aria-label="重新发送"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                ) : (
                  <StatusIcon status={message.status} />
                )}
              </div>
            )}
            <div
              className={`relative px-3 py-2 text-base break-words ${bubbleRadius} ${
                isMe ? 'bg-wechat-green text-white' : 'bg-wechat-card text-wechat-text-primary'
              }`}
              data-testid="message-content"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onContextMenu={handleContextMenu}
            >
              <BubbleTail isMe={isMe} />
              {renderContent(message, isMe, () => setLightboxVisible(true), {
                isPlaying,
                playedSeconds,
                onClick: handleVoiceClick,
              }, handleContactCardClick, handleTransferClick)}
            </div>
          </div>
        </div>
      </div>

      {message.type === 'image' && (
        <ImageLightbox
          src={message.url}
          visible={lightboxVisible}
          onClose={() => setLightboxVisible(false)}
        />
      )}

      <MessageContextMenu
        visible={menuVisible}
        x={menuPos.x}
        y={menuPos.y}
        items={menuItems}
        onClose={() => setMenuVisible(false)}
      />
    </>
  );
}
