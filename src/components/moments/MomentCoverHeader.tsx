import { ChevronLeft } from 'lucide-react';
import type { Me } from '../../types';
import { assetUrl } from '../../utils/asset';

// 朋友圈封面占位图：蓝绿渐变风景感 SVG
const COVER_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI2NyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjN2JiNmY5Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZTZlZmM5Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==";

interface MomentCoverHeaderProps {
  me: Me | null;
  onBack: () => void;
}

// 朋友圈封面区
export function MomentCoverHeader({ me, onBack }: MomentCoverHeaderProps) {
  return (
    <div className="relative h-56" data-testid="moment-cover-header">
      <img
        src={COVER_IMAGE}
        alt="朋友圈封面"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <button
        onClick={onBack}
        className="absolute top-3 left-3 z-10 flex items-center justify-center w-8 h-8 text-white drop-shadow"
        data-testid="moments-back"
      >
        <ChevronLeft size={24} />
      </button>
      {me && (
        <div className="absolute bottom-0 right-4 translate-y-1/2 flex items-end gap-3">
          <span className="text-white text-lg font-medium drop-shadow mb-2">{me.nickname}</span>
          <img
            src={assetUrl(me.avatar)}
            alt={me.nickname}
            className="w-16 h-16 rounded bg-wechat-bg border-[3px] border-white object-cover shadow"
          />
        </div>
      )}
    </div>
  );
}
