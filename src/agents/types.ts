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
    timeScale?: number; // 默认 1；测试传 0
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
}
