import { useState } from 'react';
import { Header } from '../components/common/Header';
import { WeChatToast } from '../components/common/WeChatToast';
import { useAppStore } from '../stores/useAppStore';
import { Wallet, CreditCard, Receipt, TrendingUp, Smartphone, QrCode } from 'lucide-react';

// 支付页功能入口（全部 Toast 占位）
const payEntries = [
  { id: 'qr', label: '收付款', icon: QrCode },
  { id: 'wallet', label: '零钱', icon: Wallet },
  { id: 'cards', label: '银行卡', icon: CreditCard },
  { id: 'bills', label: '账单', icon: Receipt },
  { id: 'finance', label: '理财通', icon: TrendingUp },
  { id: 'topup', label: '手机充值', icon: Smartphone },
] as const;

// 支付页 Mock：余额卡片 + 功能网格
export function PayPage() {
  const popPage = useAppStore((state) => state.popPage);
  const [toastVisible, setToastVisible] = useState(false);

  return (
    <div className="h-full overflow-y-auto bg-wechat-bg" data-testid="pay-page">
      <Header title="支付" onBack={popPage} />

      {/* 余额卡片 */}
      <div className="m-3 rounded-lg bg-wechat-green text-white p-5" data-testid="pay-balance-card">
        <div className="text-sm opacity-90">零钱（元）</div>
        <div className="text-3xl font-semibold mt-1">1,888.00</div>
        <div className="text-xs opacity-80 mt-3">演示数据 · 非真实账户</div>
      </div>

      {/* 功能网格 */}
      <div className="mx-3 rounded-lg bg-wechat-card grid grid-cols-3 divide-wechat-divider">
        {payEntries.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.id}
              onClick={() => setToastVisible(true)}
              className="flex flex-col items-center py-5 active:bg-wechat-bg"
              data-testid={`pay-entry-${entry.id}`}
            >
              <Icon size={26} className="text-wechat-green" />
              <span className="text-sm text-wechat-text-primary mt-2">{entry.label}</span>
            </button>
          );
        })}
      </div>

      <WeChatToast
        message="演示模式 · 该功能仅供展示"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}
