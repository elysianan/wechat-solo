import type { TimeWindow } from '../types';

// 时段划分: morning 6-11 / afternoon 11-14 / evening 14-22 / night 22-6
// 深夜单独成档: 「这么晚还不睡」类台词辨识度最高
export function getTimeWindow(now: number): TimeWindow {
  const hour = new Date(now).getHours();
  if (hour >= 6 && hour < 11) {
    return 'morning';
  }
  if (hour >= 11 && hour < 14) {
    return 'afternoon';
  }
  if (hour >= 14 && hour < 22) {
    return 'evening';
  }
  return 'night';
}
