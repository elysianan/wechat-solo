import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

// 微信风格顶部导航栏：左侧返回箭头、中间标题、右侧可自定义
export function Header({ title, onBack, right }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-3 h-11 bg-wechat-bg border-b border-wechat-divider"
      data-testid="page-header"
    >
      <div className="w-14">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-wechat-text-primary -ml-1"
            data-testid="header-back"
          >
            <ChevronLeft size={22} />
          </button>
        )}
      </div>
      <h1 className="text-[17px] font-semibold text-center flex-1 truncate text-wechat-text-primary">{title}</h1>
      <div className="w-14 flex justify-end">{right}</div>
    </header>
  );
}
