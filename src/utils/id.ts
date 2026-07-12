// 生成带前缀的唯一 ID，seed 数据与运行时评论/动态均适用
export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// 生成带时间戳与随机后缀的消息 ID
export function makeMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
