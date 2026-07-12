import { ChevronLeft } from 'lucide-react';
import type { Me } from '../../types';

interface MomentCoverHeaderProps {
  me: Me | null;
  onBack: () => void;
}

// 朋友圈封面区
export function MomentCoverHeader({ me, onBack }: MomentCoverHeaderProps) {
  return (
    <div className="relative h-56 bg-gradient-to-b from-blue-300 to-blue-100" data-testid="moment-cover-header">
      <button
        onClick={onBack}
        className="absolute top-3 left-3 z-10 flex items-center text-white drop-shadow"
        data-testid="moments-back"
      >
        <ChevronLeft size={24} />
        <span className="text-sm">朋友圈</span>
      </button>
      {me && (
        <div className="absolute bottom-0 right-4 translate-y-1/2 flex items-end gap-3">
          <span className="text-white text-base font-medium drop-shadow mb-2">{me.nickname}</span>
          <img
            src={me.avatar}
            alt={me.nickname}
            className="w-16 h-16 rounded-md bg-gray-200 border-2 border-white object-cover"
          />
        </div>
      )}
    </div>
  );
}
