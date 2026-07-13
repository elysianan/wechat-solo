import type { ElementType } from 'react';

interface MenuListItemProps {
  icon: ElementType;
  label: string;
  onClick?: () => void;
  testId?: string;
}

// 「我」页/设置页通用菜单行：图标 + 标题 + 右箭头
export function MenuListItem({ icon: Icon, label, onClick, testId }: MenuListItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center px-4 py-3 active:bg-wechat-bg"
      data-testid={testId}
    >
      <Icon size={22} className="text-wechat-green" />
      <span className="ml-3 text-base text-wechat-text-primary flex-1 text-left">{label}</span>
      <span className="text-wechat-text-secondary text-sm">›</span>
    </button>
  );
}
