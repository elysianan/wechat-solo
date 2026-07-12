import { describe, it, expect } from 'vitest';
import { formatChatTime } from '../../utils/time';

describe('formatChatTime', () => {
  it('当天显示 HH:mm', () => {
    const now = new Date();
    const ts = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 5).getTime();
    expect(formatChatTime(ts)).toMatch(/^\d{2}:\d{2}$/);
  });

  it('昨天显示“昨天”', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const ts = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 10, 0).getTime();
    expect(formatChatTime(ts)).toBe('昨天');
  });

  it('一周内显示星期', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const ts = new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 10, 0).getTime();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    expect(weekdays).toContain(formatChatTime(ts));
  });

  it('更早显示 MM-DD', () => {
    const older = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ts = new Date(older.getFullYear(), older.getMonth(), older.getDate(), 10, 0).getTime();
    const expected = `${String(older.getMonth() + 1).padStart(2, '0')}-${String(older.getDate()).padStart(2, '0')}`;
    expect(formatChatTime(ts)).toBe(expected);
  });
});
