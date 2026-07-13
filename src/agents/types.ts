import type { Contact, Message } from '../types';

export type {
  AgentBehavior,
  AgentPersona,
  ReplyRule,
  ReplyTrigger,
} from '../types';

// Agent 引擎输入
export interface GenerateReplyInput {
  contact: Contact;
  userMessage: Message;
  recentMessages: Message[];
  options?: {
    timeScale?: number; // 默认 1；0 表示立即响应
    forceReply?: boolean; // true 时跳过"已读不回"判定（@提及场景必回）
    now?: number; // 当前时间戳(时段感知用, 测试可注入; 默认 Date.now())
    // 本会话已用过的台词(最终文本): 引擎选取时跳过, 并在回复后直接写入此 Set
    sessionUsedResponses?: Set<string>;
    // 本会话规则使用计数: 配合 maxUsageInSession 剔除, 引擎命中后直接 +1
    sessionRuleUsage?: Map<string, number>;
    userNickname?: string; // {nickname} 模板用, 缺省「我」
  };
}

// Agent 回复计划
export interface ReplyPlan {
  conversationId: string;
  contactId: string;
  readUserMessageIds: string[];       // 要标为 read 的用户消息 id
  readDelayMs: number;                // 从发送到 read 的延迟
  typingDurationMs: number;           // 0 表示不显示"正在输入"
  replyDelayMs: number;               // 从发送到 Agent 回复出现的总延迟
  replyMessages: Array<{ content: string }>;
  usedRuleId?: string;                // 本次命中的规则 id(已读不回时无)
}
