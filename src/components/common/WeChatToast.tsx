import { useEffect, useState } from 'react';

interface WeChatToastProps {
  message: string;
  visible: boolean;
  onClose?: () => void;
  duration?: number;
}

// 微信风格居中黑色半透明提示，自动消失
export function WeChatToast({ message, visible, onClose, duration = 2000 }: WeChatToastProps) {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    setShow(visible);
    if (!visible) return;

    const timer = setTimeout(() => {
      setShow(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none" data-testid="wechat-toast">
      <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm max-w-[80%] text-center">
        {message}
      </div>
    </div>
  );
}
