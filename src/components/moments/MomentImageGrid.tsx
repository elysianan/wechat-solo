import { assetUrl } from '../../utils/asset';

interface MomentImageGridProps {
  images: string[];
  onImageClick?: (index: number) => void;
}

// 朋友圈图片网格：支持 1/2/4 张两列，其他三列
export function MomentImageGrid({ images, onImageClick }: MomentImageGridProps) {
  if (images.length === 0) return null;

  const gridCols = images.length === 1 ? 1 : images.length === 2 || images.length === 4 ? 2 : 3;
  const isSingle = images.length === 1;

  return (
    <div
      className="grid gap-1 mt-2"
      style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      data-testid="moment-image-grid"
    >
      {images.map((url, index) => {
        const src =
          url.startsWith('blob:') || url.startsWith('http') || url.startsWith('data:')
            ? url
            : assetUrl(url);
        return (
          <img
            key={index}
            src={src}
            alt={`朋友圈图片 ${index + 1}`}
            className={`rounded object-cover bg-wechat-bg cursor-pointer ${
              isSingle ? 'max-w-[200px] max-h-[200px]' : 'aspect-square'
            }`}
            data-testid={`moment-image-${index}`}
            onClick={() => onImageClick?.(index)}
          />
        );
      })}
    </div>
  );
}
