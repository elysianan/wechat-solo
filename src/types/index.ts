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
export type MessageType =
  | 'text'
  | 'image'
  | 'voice'
  | 'redpacket'
  | 'transfer'
  | 'location'
  | 'contact_card';

// 消息状态
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// 消息公共字段
interface BaseMessage {
  id: string;
  conversationId: string;
  senderId: 'me' | string;
  status: MessageStatus;
  createdAt: number;
  replyTo?: {
    messageId: string;
    senderName: string;
    content: string;
  };
}

// 文本消息
export interface TextMessage extends BaseMessage {
  type: 'text';
  content: string;
}

// 图片消息
export interface ImageMessage extends BaseMessage {
  type: 'image';
  url: string;
  width?: number;
  height?: number;
}

// 语音消息
export interface VoiceMessage extends BaseMessage {
  type: 'voice';
  url: string;
  duration: number;
}

// 红包消息
export interface RedPacketMessage extends BaseMessage {
  type: 'redpacket';
  amount: number;
  title?: string;
  packetStatus: 'pending' | 'opened' | 'expired';
}

// 转账消息（占位，Sprint7 仅提供默认渲染）
export interface TransferMessage extends BaseMessage {
  type: 'transfer';
  amount: number;
  note?: string;
  transferStatus: 'pending' | 'received' | 'refunded';
  transferCreatedAt?: number;
  transferCompletedAt?: number;
}

// 位置消息（占位，Sprint7 仅提供默认渲染）
export interface LocationMessage extends BaseMessage {
  type: 'location';
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

// 名片消息
export interface ContactCardMessage extends BaseMessage {
  type: 'contact_card';
  contactId: string;
  nickname: string;
  avatar: string;
  region?: string;
  signature?: string;
}

export type Message =
  | TextMessage
  | ImageMessage
  | VoiceMessage
  | RedPacketMessage
  | TransferMessage
  | LocationMessage
  | ContactCardMessage;

// 发送消息时传入的负载（不含 id / senderId / status / createdAt 等运行时字段）
export interface TextPayload {
  type: 'text';
  content: string;
}

export interface ImagePayload {
  type: 'image';
  url: string;
  width?: number;
  height?: number;
}

export interface VoicePayload {
  type: 'voice';
  url: string;
  duration: number;
}

export interface RedPacketPayload {
  type: 'redpacket';
  amount: number;
  title?: string;
}

export interface LocationPayload {
  type: 'location';
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface ContactCardPayload {
  type: 'contact_card';
  contactId: string;
  nickname: string;
  avatar: string;
  region?: string;
  signature?: string;
}

export interface TransferPayload {
  type: 'transfer';
  amount: number;
  note?: string;
}

export type MessagePayload =
  | TextPayload
  | ImagePayload
  | VoicePayload
  | RedPacketPayload
  | LocationPayload
  | ContactCardPayload
  | TransferPayload;

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
  // 进行中的剧情链进度(单聊专用); 缺省表示无进行中剧情
  storyProgress?: { chainId: string; step: number };
  // 该联系人上次主动发起对话的时间戳(冷却用)
  lastInitiatedAt?: number;
}

// 剧情链: 多轮剧本对话, 进度存于 Conversation.storyProgress
export interface StoryChain {
  id: string;
  contactId: string;
  // 用户消息命中这些关键词时, 按 triggerChance 概率进入剧情
  triggerKeywords: string[];
  triggerChance: number;
  steps: Array<{
    replies: string[];           // 该步 Agent 台词池, 随机取一
    // 用户回复含这些词才推进到下一步; 缺省=任意回复都推进
    advanceKeywords?: string[];
  }>;
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

// 时段枚举: 规则的时段感知触发
export type TimeWindow = 'morning' | 'afternoon' | 'evening' | 'night';

// Agent 回复触发条件
export interface ReplyTrigger {
  keywords?: string[];
  patterns?: RegExp[];
  // 上下文门槛: 最近 5 条消息含任一关键词, 该规则才可命中
  context?: string[];
  // 时段限制: 仅在指定时段参与匹配; 缺省表示全时段
  timeWindow?: TimeWindow[];
  default?: boolean;
  // 仅匹配指定消息类型; 缺省表示不限制
  messageType?: 'text' | 'location' | 'contact_card' | 'transfer';
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
  // 收到转账后收款概率，默认 0.8
  transferAcceptChance?: number;
  // 收到转账后退还概率，默认 0.1
  transferRefundChance?: number;
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
  // 规则库版本: 与 PERSONA_VERSION 一致; 旧数据缺失或偏低时触发升级重写
  version: number;
  // 主动发起对话的相对权重(加权随机选人用)
  initiateChance: number;
  // 主动发起对话的话题池
  initiateTopics: string[];
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
