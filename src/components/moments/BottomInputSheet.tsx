import { useEffect, useState } from 'react';

interface BottomInputSheetProps {
  visible: boolean;
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

// 底部评论输入弹层，带滑入滑出动画
export function BottomInputSheet({ visible, onSubmit, onCancel }: BottomInputSheetProps) {
  const [content, setContent] = useState('');
  const [show, setShow] = useState(false);

  // 处理进入/退出动画：visible 为 true 时立即挂载并触发显示；false 时先触发隐藏再卸载
  useEffect(() => {
    if (visible) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // visible 为 true 时延迟聚焦输入框
  useEffect(() => {
    if (!visible) return;
    const input = document.querySelector<HTMLInputElement>('[data-testid="bottom-input"]');
    if (!input) return;
    const timer = setTimeout(() => input.focus(), 200);
    return () => clearTimeout(timer);
  }, [visible, show]);

  if (!visible && !show) return null;

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      data-testid="bottom-input-sheet"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div
        className={`absolute bottom-0 left-0 right-0 bg-wechat-card p-3 flex gap-2 transition-transform duration-200 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="评论"
          className="flex-1 bg-wechat-bg rounded-md px-3 py-2 text-sm outline-none"
          data-testid="bottom-input"
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
