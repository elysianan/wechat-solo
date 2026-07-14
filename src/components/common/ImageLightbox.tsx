import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { assetUrl } from '../../utils/asset';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  visible: boolean;
  onClose: () => void;
}

// 全屏图片查看器，聊天和朋友圈复用
export function ImageLightbox({ src, alt = '图片', visible, onClose }: ImageLightboxProps) {
  const [show, setShow] = useState(false);
  // 保留最后一次非空 src，用于退出动画期间避免渲染空 src 的图片
  const [lastSrc, setLastSrc] = useState(src);

  // 处理进入/退出动画：visible 为 true 时立即挂载并触发显示；false 时先触发隐藏再卸载
  useEffect(() => {
    if (visible) {
      if (src) setLastSrc(src);
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timer);
    }
  }, [visible, src]);

  if (!visible && !show) return null;

  const displaySrc =
    src.startsWith('blob:') || src.startsWith('http') || src.startsWith('data:')
      ? src
      : assetUrl(src) || assetUrl(lastSrc);

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/90 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      data-testid="image-lightbox"
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 text-white/80 p-2"
        data-testid="image-lightbox-close"
        aria-label="关闭"
      >
        <X size={28} />
      </button>
      {displaySrc ? (
        <img
          src={displaySrc}
          alt={alt}
          className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
            visible ? 'scale-100' : 'scale-95'
          }`}
          onClick={(e) => e.stopPropagation()}
        />
      ) : null}
    </div>
  );
}
