// 底部水印：固定于手机壳内，不拦截任何点击
export function Watermark() {
  return (
    <div
      className="absolute bottom-20 left-0 right-0 z-50 flex justify-center pointer-events-none"
      data-testid="watermark"
    >
      <span className="text-[10px] text-wechat-text-secondary opacity-50">
        WeChat Solo Demo · 仅供演示
      </span>
    </div>
  );
}
