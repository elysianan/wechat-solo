import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

// 微信风格顶部导航栏：左侧返回、中间标题、右侧可自定义
export function Header({ title, onBack, right }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-3 h-12 bg-wechat-bg border-b border-wechat-divider"
      data-testid="page-header"
    >
      <div className="w-16">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-wechat-text-primary"
            data-testid="header-back"
          >
            <ChevronLeft size={20} />
            <span className="text-sm">返回</span>
          </button>
        )}
      </div>
      <h1 className="text-base font-medium text-center flex-1 truncate text-wechat-text-primary">{title}</h1>
      <div className="w-16 flex justify-end">{right}</div>
    </header>
  );
}
