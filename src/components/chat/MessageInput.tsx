import { useRef, useState } from 'react';
import { Plus, AtSign, Image as ImageIcon, Mic, Gift, X } from 'lucide-react';
import { MentionPicker, type MentionMember } from './MentionPicker';
import type { MessagePayload } from '../../types';

interface MessageInputProps {
  onSend: (payload: MessagePayload) => void;
  // 群聊成员列表：传入时显示 @ 按钮
  members?: MentionMember[];
}

function VoiceRecorderOverlay({ seconds }: { seconds: number }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      data-testid="voice-recorder-overlay"
    >
      <div className="relative flex flex-col items-center">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-wechat-green/30 animate-pulse-ring" />
          <div className="absolute inset-2 rounded-full bg-wechat-green/50 animate-pulse-ring" style={{ animationDelay: '0.4s' }} />
          <div className="relative w-16 h-16 rounded-full bg-wechat-green flex items-center justify-center text-white">
            <Mic size={32} />
          </div>
        </div>
        <div className="mt-4 text-white text-lg font-medium">{seconds}s</div>
        <div className="mt-1 text-white/80 text-sm">松开结束，上滑取消</div>
      </div>
    </div>
  );
}

// 底部消息输入框：支持文字、图片、语音、红包、@成员
export function MessageInput({ onSend, members }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showMention, setShowMention] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showRedPacket, setShowRedPacket] = useState(false);
  const [redPacketAmount, setRedPacketAmount] = useState('');
  const [redPacketTitle, setRedPacketTitle] = useState('恭喜发财，大吉大利');

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 打开 @ 面板前记录光标位置，用于插入
  const cursorRef = useRef<number | null>(null);

  const handleSendText = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend({ type: 'text', content: trimmed });
    setText('');
    setShowTools(false);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onSend({ type: 'image', url });
    e.target.value = '';
    setShowTools(false);
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (!isRecording) return;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    const duration = Math.max(recordingSeconds, 1);
    onSend({ type: 'voice', url: 'voice://demo', duration });
    setRecordingSeconds(0);
    setShowTools(false);
  };

  const handleSendRedPacket = () => {
    const amount = parseFloat(redPacketAmount);
    if (Number.isNaN(amount) || amount <= 0) return;
    onSend({ type: 'redpacket', amount, title: redPacketTitle.trim() || undefined });
    setRedPacketAmount('');
    setRedPacketTitle('恭喜发财，大吉大利');
    setShowRedPacket(false);
    setShowTools(false);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-wechat-bg border-t border-wechat-divider px-3 py-2 max-w-phone mx-auto z-20"
      data-testid="message-input"
    >
      {isRecording && <VoiceRecorderOverlay seconds={recordingSeconds} />}

      <MentionPicker
        visible={showMention}
        members={members ?? []}
        onSelect={handleMentionSelect}
        onClose={() => setShowMention(false)}
      />

      {showRedPacket && (
        <div
          className="absolute bottom-full left-0 right-0 bg-wechat-card p-4 shadow-lg border-t border-wechat-divider animate-slide-up"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">发红包</span>
            <button
              type="button"
              onClick={() => setShowRedPacket(false)}
              data-testid="redpacket-cancel-button"
            >
              <X size={18} />
            </button>
          </div>
          <input
            type="number"
            inputMode="decimal"
            placeholder="金额（元）"
            value={redPacketAmount}
            onChange={(e) => setRedPacketAmount(e.target.value)}
            className="w-full bg-wechat-bg rounded px-3 py-2 text-sm mb-2 outline-none"
            data-testid="redpacket-amount-input"
          />
          <input
            type="text"
            placeholder="祝福语"
            value={redPacketTitle}
            onChange={(e) => setRedPacketTitle(e.target.value)}
            className="w-full bg-wechat-bg rounded px-3 py-2 text-sm mb-3 outline-none"
            data-testid="redpacket-title-input"
          />
          <button
            type="button"
            onClick={handleSendRedPacket}
            disabled={!redPacketAmount || parseFloat(redPacketAmount) <= 0}
            className="w-full bg-wechat-green text-white text-sm py-2 rounded disabled:opacity-50 active:scale-[0.98] transition-transform"
            data-testid="redpacket-send-button"
          >
            塞钱进红包
          </button>
        </div>
      )}

      {showTools && !showRedPacket && (
        <div className="flex gap-6 px-2 py-3 animate-slide-up">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1 text-wechat-text-secondary active:scale-95 transition-transform"
            data-testid="tool-image-button"
          >
            <div className="w-12 h-12 rounded-xl bg-wechat-card flex items-center justify-center">
              <ImageIcon size={24} />
            </div>
            <span className="text-xs">图片</span>
          </button>
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className="flex flex-col items-center gap-1 text-wechat-text-secondary select-none active:scale-95 transition-transform"
            data-testid="tool-voice-button"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              isRecording ? 'bg-wechat-green text-white' : 'bg-wechat-card'
            }`}>
              <Mic size={24} />
            </div>
            <span className="text-xs">{isRecording ? `${recordingSeconds}s` : '语音'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowRedPacket(true)}
            className="flex flex-col items-center gap-1 text-wechat-text-secondary active:scale-95 transition-transform"
            data-testid="tool-redpacket-button"
          >
            <div className="w-12 h-12 rounded-xl bg-wechat-card flex items-center justify-center">
              <Gift size={24} />
            </div>
            <span className="text-xs">红包</span>
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
        data-testid="image-file-input"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowTools((prev) => !prev)}
          className={`text-wechat-text-secondary transition-transform duration-200 ${showTools ? 'rotate-45' : ''}`}
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
            className="text-wechat-text-secondary active:scale-90 transition-transform"
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
          onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
          placeholder="请输入消息"
          className="flex-1 bg-wechat-card rounded px-3 py-2 text-sm outline-none"
          data-testid="text-input"
        />
        <button
          type="button"
          onClick={handleSendText}
          disabled={!text.trim()}
          className="bg-wechat-green text-white text-sm px-4 py-2 rounded disabled:opacity-50 active:scale-95 transition-transform"
          data-testid="send-button"
        >
          发送
        </button>
      </div>
    </div>
  );
}
