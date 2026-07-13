import { useRef, useState } from 'react';
import { Plus, AtSign } from 'lucide-react';
import { WeChatToast } from '../common/WeChatToast';
import { MentionPicker, type MentionMember } from './MentionPicker';

interface MessageInputProps {
  onSend: (text: string) => void;
  // 群聊成员列表：传入时显示 @ 按钮
  members?: MentionMember[];
}

// 底部消息输入框：支持输入文字、回车发送、@成员（群聊）、工具按钮触发演示模式 Toast
export function MessageInput({ onSend, members }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showMention, setShowMention] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // 打开 @ 面板前记录光标位置，用于插入
  const cursorRef = useRef<number | null>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const handleMentionSelect = (name: string) => {
    const insert = `@${name} `;
    setText((prev) => {
      const pos = cursorRef.current ?? prev.length;
      return prev.slice(0, pos) + insert + prev.slice(pos);
    });
    setShowMention(false);
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-wechat-bg border-t border-wechat-divider px-3 py-2 max-w-phone mx-auto"
      data-testid="message-input"
    >
      <WeChatToast message="演示模式 · 该功能仅供展示" visible={showToast} onClose={() => setShowToast(false)} />
      <MentionPicker
        visible={showMention}
        members={members ?? []}
        onSelect={handleMentionSelect}
        onClose={() => setShowMention(false)}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowToast(true)}
          className="text-wechat-text-secondary"
          data-testid="tool-button"
        >
          <Plus size={28} />
        </button>
        {members && members.length > 0 && (
          <button
            type="button"
            onClick={() => {
              cursorRef.current = inputRef.current?.selectionStart ?? text.length;
              setShowMention(true);
            }}
            className="text-wechat-text-secondary"
            data-testid="mention-button"
          >
            <AtSign size={26} />
          </button>
        )}
        <input
          ref={inputRef}
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
