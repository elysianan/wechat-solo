interface MenuItem {
  id: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface MessageContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

// 消息长按弹出的上下文菜单
export function MessageContextMenu({ visible, x, y, items, onClose }: MessageContextMenuProps) {
  if (!visible || items.length === 0) return null;

  // 简单边界保护，避免菜单贴边被截断
  const adjustedX = Math.min(x, window.innerWidth - 128);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 40);

  return (
    <div
      className="fixed z-[70] min-w-[96px] rounded-lg bg-black/80 backdrop-blur-sm overflow-hidden shadow-lg"
      style={{ left: Math.max(8, adjustedX), top: Math.max(8, adjustedY) }}
      data-testid="message-context-menu"
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 active:bg-white/20 transition-colors ${
            item.danger ? 'text-red-400' : ''
          }`}
          data-testid={`context-menu-item-${item.id}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
