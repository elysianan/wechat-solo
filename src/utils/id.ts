const counters: Record<string, number> = {};

// 生成带前缀的递增唯一 ID，用于 seed 数据与运行时评论/动态
export function makeId(prefix: string): string {
  const next = (counters[prefix] ?? 0) + 1;
  counters[prefix] = next;
  return `${prefix}-${next}`;
}

// 生成带时间戳与随机后缀的消息 ID
export function makeMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
