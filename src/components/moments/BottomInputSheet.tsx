import { useState } from 'react';

interface BottomInputSheetProps {
  visible: boolean;
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

// 底部评论输入弹层
export function BottomInputSheet({ visible, onSubmit, onCancel }: BottomInputSheetProps) {
  const [content, setContent] = useState('');

  if (!visible) return null;

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
  };

  return (
    <div className="fixed inset-0 z-50" data-testid="bottom-input-sheet">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="absolute bottom-0 left-0 right-0 bg-wechat-card p-3 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="评论"
          className="flex-1 bg-wechat-bg rounded-md px-3 py-2 text-sm outline-none"
          data-testid="bottom-input"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="bg-wechat-green text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
          data-testid="bottom-input-submit"
        >
          发送
        </button>
      </div>
    </div>
  );
}
