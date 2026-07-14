import { assetUrl } from '../../utils/asset';

interface TypingIndicatorProps {
  avatar: string;
  name: string;
}

// 聊天详情页中的"对方正在输入…"提示
export function TypingIndicator({ avatar, name }: TypingIndicatorProps) {
  return (
    <div
      className="flex justify-start mb-4 px-4"
      data-testid="typing-indicator"
    >
      <img
        src={assetUrl(avatar)}
        alt={name}
        className="w-10 h-10 rounded bg-wechat-bg object-cover mr-3 flex-shrink-0"
      />
      <div className="flex flex-col items-start max-w-[70%]">
        <span className="text-xs text-wechat-text-secondary mb-1">{name}</span>
        <div className="px-3 py-2 rounded-lg text-sm bg-wechat-card text-wechat-text-primary">
          <div className="flex items-center gap-1">
            <span className="text-xs text-wechat-text-secondary">对方正在输入</span>
            <span className="inline-flex gap-0.5">
              <span
                className="w-1 h-1 bg-wechat-text-secondary rounded-full animate-typing-pulse"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1 h-1 bg-wechat-text-secondary rounded-full animate-typing-pulse"
                style={{ animationDelay: '200ms' }}
              />
              <span
                className="w-1 h-1 bg-wechat-text-secondary rounded-full animate-typing-pulse"
                style={{ animationDelay: '400ms' }}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
