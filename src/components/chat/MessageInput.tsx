import { useState } from 'react';
import { Plus } from 'lucide-react';
import { WeChatToast } from '../common/WeChatToast';

interface MessageInputProps {
  onSend: (text: string) => void;
}

// 底部消息输入框：支持输入文字、回车发送、工具按钮触发演示模式 Toast
export function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-wechat-bg border-t border-wechat-divider px-3 py-2 max-w-phone mx-auto"
      data-testid="message-input"
    >
      <WeChatToast message="演示模式 · 该功能仅供展示" visible={showToast} onClose={() => setShowToast(false)} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowToast(true)}
          className="text-wechat-text-secondary"
          data-testid="tool-button"
        >
          <Plus size={28} />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="请输入消息"
          className="flex-1 bg-wechat-card rounded-md px-3 py-2 text-sm outline-none"
          data-testid="text-input"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className="bg-wechat-green text-white text-sm px-4 py-2 rounded-md disabled:opacity-50"
          data-testid="send-button"
        >
          发送
        </button>
      </div>
    </div>
  );
}
