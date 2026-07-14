import { useState } from 'react';
import { Wallet, Star, Image, CreditCard, Smile, Settings, QrCode, ChevronRight } from 'lucide-react';
import { MenuListItem } from '../components/me/MenuListItem';
import { WeChatToast } from '../components/common/WeChatToast';
import { useAppStore } from '../stores/useAppStore';
import { useContactStore } from '../stores/useContactStore';
import { assetUrl } from '../utils/asset';

// 「我」页面：个人信息卡 + 菜单分组
export function MePage() {
  const me = useContactStore((state) => state.me);
  const navigateToProfileEdit = useAppStore((state) => state.navigateToProfileEdit);
  const navigateToPay = useAppStore((state) => state.navigateToPay);
  const navigateToSettings = useAppStore((state) => state.navigateToSettings);
  const [toastVisible, setToastVisible] = useState(false);

  return (
    <div className="h-full overflow-y-auto bg-wechat-bg pb-16" data-testid="me-page">
      {/* 个人信息卡：点击进入编辑 */}
      <button
        onClick={navigateToProfileEdit}
        className="w-full flex items-center bg-wechat-card px-4 pt-10 pb-5 active:bg-wechat-bg active:scale-[0.98] transition-transform duration-100"
        data-testid="me-profile-card"
      >
        <img
          src={assetUrl(me?.avatar)}
          alt={me?.nickname}
          className="w-16 h-16 rounded object-cover bg-wechat-bg"
        />
        <div className="ml-4 flex-1 text-left">
          <div className="text-[17px] font-medium text-wechat-text-primary">{me?.nickname ?? '我'}</div>
          <div className="text-[13px] text-wechat-text-secondary mt-1">
            微信号：{me?.wechatId ?? '-'}
          </div>
        </div>
        <div className="flex items-center text-wechat-text-secondary">
          <QrCode size={18} className="mr-2" />
          <ChevronRight size={20} />
        </div>
      </button>

      {/* 第一组：支付 */}
      <div className="mt-2 bg-wechat-card divide-y divide-wechat-divider">
        <MenuListItem icon={Wallet} label="支付" onClick={navigateToPay} testId="me-entry-pay" />
      </div>

      {/* 第二组：占位功能 */}
      <div className="mt-2 bg-wechat-card divide-y divide-wechat-divider">
        <MenuListItem icon={Star} label="收藏" onClick={() => setToastVisible(true)} testId="me-entry-favorites" />
        <MenuListItem icon={Image} label="相册" onClick={() => setToastVisible(true)} testId="me-entry-album" />
        <MenuListItem icon={CreditCard} label="卡包" onClick={() => setToastVisible(true)} testId="me-entry-cards" />
        <MenuListItem icon={Smile} label="表情" onClick={() => setToastVisible(true)} testId="me-entry-stickers" />
      </div>

      {/* 第三组：设置 */}
      <div className="mt-2 bg-wechat-card divide-y divide-wechat-divider">
        <MenuListItem icon={Settings} label="设置" onClick={navigateToSettings} testId="me-entry-settings" />
      </div>

      <WeChatToast
        message="演示模式 · 该功能仅供展示"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}
