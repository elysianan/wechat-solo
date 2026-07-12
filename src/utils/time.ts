// 将时间戳格式化为微信聊天列表样式：当天显示 HH:mm，昨天显示“昨天”，一周内显示星期，更早显示 MM-DD
export function formatChatTime(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);

  const isSameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  if (isSameDay) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  const oneDay = 24 * 60 * 60 * 1000;
  const yesterday = new Date(now.getTime() - oneDay);
  const isYesterday =
    yesterday.getFullYear() === date.getFullYear() &&
    yesterday.getMonth() === date.getMonth() &&
    yesterday.getDate() === date.getDate();
  if (isYesterday) {
    return '昨天';
  }

  const diff = now.getTime() - date.getTime();
  const oneWeek = 7 * oneDay;
  if (diff < oneWeek) {
    return date.toLocaleDateString('zh-CN', { weekday: 'short' });
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}
