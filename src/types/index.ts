// 当前登录用户
export interface Me {
  id: 'me';
  nickname: string;
  avatar: string;
  wechatId: string;
  region: string;
  signature: string;
}

// 消息类型
export type MessageType = 'text' | 'image' | 'voice' | 'redpacket' | 'transfer' | 'location';

// 消息状态
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// 消息
export interface Message {
  id: string;
  conversationId: string;
  senderId: 'me' | string;
  type: MessageType;
  content: string;
  status: MessageStatus;
  createdAt: number;
  replyTo?: {
    messageId: string;
    senderName: string;
    content: string;
  };
}

// 会话类型
export type ConversationType = 'single' | 'group';

// 会话
export interface Conversation {
  id: string;
  type: ConversationType;
  contactId?: string;
  // 群聊专用字段（单聊不填）
  name?: string;
  avatar?: string;
  memberIds?: string[];
  lastMessageId: string;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  updatedAt: number;
}

// 朋友圈点赞
export interface Like {
  contactId: string;
  createdAt: number;
}

// 朋友圈评论
export interface Comment {
  id: string;
  contactId: string;
  content: string;
  createdAt: number;
}

// 朋友圈动态
export interface Moment {
  id: string;
  authorId: string;
  content: string;
  images: string[];
  createdAt: number;
  likes: Like[];
  comments: Comment[];
}

// 应用设置
export interface AppSettings {
  darkMode: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  version: string;
}

// 联系人标签（独立实体，允许空标签）
export interface Tag {
  id: string;
  name: string;
  createdAt: number;
}

// Agent 回复触发条件
export interface ReplyTrigger {
  keywords?: string[];
  patterns?: RegExp[];
  context?: string[];
  default?: boolean;
}

// Agent 回复规则
export interface ReplyRule {
  id: string;
  triggers: ReplyTrigger;
  responses: string[];
  weight: number;
  maxUsageInSession?: number;
}

// Agent 行为参数
export interface AgentBehavior {
  replyDelayMin: number;
  replyDelayMax: number;
  typingIndicatorChance: number;
  readButNoReplyChance: number;
  multiMessageChance: number;
  emojiChance: number;
  // 群内无 @ 时的主动回复概率（按人设差异化）
  groupReplyChance: number;
}

// Agent 人设
export interface AgentPersona {
  id: string;
  name: string;
  avatar: string;
  wechatId: string;
  region: string;
  signature: string;
  tags: string[];
  behavior: AgentBehavior;
  rules: ReplyRule[];
}

// 联系人
export interface Contact {
  id: string;
  name: string;
  avatar: string;
  wechatId: string;
  region: string;
  signature: string;
  tags: string[];
  persona: AgentPersona;
  isOnline: boolean;
}
