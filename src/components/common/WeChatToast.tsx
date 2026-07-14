import { useEffect } from 'react';

interface WeChatToastProps {
  message: string;
  visible: boolean;
  onClose?: () => void;
  duration?: number;
}

// 微信风格居中黑色半透明提示，自动消失，带淡入缩放动画
export function WeChatToast({ message, visible, onClose, duration = 2000 }: WeChatToastProps) {
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none animate-fade-scale"
      data-testid="wechat-toast"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="提示"
    >
      <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm max-w-[80%] text-center">
        {message}
      </div>
    </div>
  );
}
