/**
 * 将毫秒级 Unix 时间戳格式化为微信聊天列表样式。
 * @param timestamp - 毫秒级 Unix 时间戳
 * @returns 当天显示 HH:mm，昨天显示“昨天”，一周内显示星期，更早显示 MM-DD
 */
export function formatChatTime(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);

  const oneDay = 24 * 60 * 60 * 1000;
  // 按自然日计算相差天数，避免同一天消息因小时不同被分到不同桶
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / oneDay);

  if (dayDiff === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  if (dayDiff === 1) {
    return '昨天';
  }

  if (dayDiff >= 2 && dayDiff <= 6) {
    return date.toLocaleDateString('zh-CN', { weekday: 'short' });
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}
