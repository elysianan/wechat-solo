interface MomentImageGridProps {
  images: string[];
}

// 朋友圈图片网格占位图
export function MomentImageGrid({ images }: MomentImageGridProps) {
  if (images.length === 0) return null;

  const gridCols = images.length === 1 ? 1 : images.length === 2 || images.length === 4 ? 2 : 3;

  return (
    <div
      className="grid gap-1 mt-2"
      style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      data-testid="moment-image-grid"
    >
      {images.map((_, index) => (
        <div
          key={index}
          className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded"
          data-testid="moment-image"
        />
      ))}
    </div>
  );
}
