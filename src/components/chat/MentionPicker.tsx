export interface MentionMember {
  id: string;
  name: string;
}

interface MentionPickerProps {
  visible: boolean;
  members: MentionMember[];
  onSelect: (name: string) => void;
  onClose: () => void;
}

// @成员选择面板：底部弹出，点击成员回调插入
export function MentionPicker({ visible, members, onSelect, onClose }: MentionPickerProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/30 animate-fade-scale"
      data-testid="mention-picker-mask"
      onClick={onClose}
    >
      <div
        className="w-full max-w-phone bg-wechat-card rounded-t-lg max-h-[40%] overflow-y-auto animate-slide-up"
        data-testid="mention-picker"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-2 text-xs text-wechat-text-secondary border-b border-wechat-divider">
          选择提醒的人
        </div>
        {members.map((member) => (
          <button
            key={member.id}
            onClick={() => onSelect(member.name)}
            className="w-full text-left px-4 py-3 text-sm text-wechat-text-primary border-b border-wechat-divider last:border-b-0 active:bg-wechat-bg active:scale-[0.98] transition-transform duration-100"
            data-testid={`mention-member-${member.id}`}
          >
            {member.name}
          </button>
        ))}
      </div>
    </div>
  );
}
