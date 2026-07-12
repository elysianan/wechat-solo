import type { GenerateReplyInput, ReplyPlan } from './types';
import type { ReplyRule } from '../types';

// 生成 [min, max] 之间的随机数
function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// 从数组中随机取一项
function pickRandom<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error('pickRandom: 数组不能为空');
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

// 判断规则是否命中用户消息
function matchesRule(rule: ReplyRule, content: string): boolean {
  if (rule.triggers.keywords?.some((keyword) => content.includes(keyword))) {
    return true;
  }
  if (rule.triggers.patterns?.some((pattern) => pattern.test(content))) {
    return true;
  }
  return false;
}

// 按 weight 加权随机选一条规则
function selectWeightedRule(rules: ReplyRule[]): ReplyRule {
  if (rules.length === 0) {
    throw new Error('selectWeightedRule: 规则数组不能为空');
  }
  const totalWeight = rules.reduce((sum, rule) => sum + rule.weight, 0);
  let random = Math.random() * totalWeight;
  for (const rule of rules) {
    random -= rule.weight;
    if (random <= 0) {
      return rule;
    }
  }
  return rules[rules.length - 1];
}

// 选择回复规则：先匹配关键词，无命中则兜底 default
function selectRule(rules: ReplyRule[], content: string): ReplyRule | undefined {
  if (rules.length === 0) {
    return undefined;
  }
  const matched = rules.filter((rule) => matchesRule(rule, content));
  const candidates = matched.length > 0 ? matched : rules.filter((rule) => rule.triggers.default);
  if (candidates.length === 0) {
    // 没有任何规则时回退到最后一条，保证引擎不崩溃
    return rules[rules.length - 1];
  }
  return selectWeightedRule(candidates);
}

// 根据联系人的人设生成回复计划
export function generateReply(input: GenerateReplyInput): ReplyPlan {
  const { contact, userMessage, recentMessages, options } = input;
  const timeScale = options?.timeScale ?? 1;
  const behavior = contact.persona.behavior;

  // 计算时间线
  const baseDelay = randomBetween(behavior.replyDelayMin, behavior.replyDelayMax) * timeScale;
  const showTyping = Math.random() < behavior.typingIndicatorChance;
  const readDelay = baseDelay * randomBetween(0.4, 0.5);
  const typingDuration = showTyping ? (baseDelay - readDelay) * randomBetween(0.4, 0.9) : 0;

  // 所有我发送的消息都视为会被对方 read
  const readUserMessageIds = recentMessages
    .filter((message) => message.senderId === 'me')
    .map((message) => message.id);

  // 已读不回
  if (Math.random() < behavior.readButNoReplyChance) {
    return {
      conversationId: userMessage.conversationId,
      contactId: contact.id,
      readUserMessageIds,
      readDelayMs: readDelay,
      typingDurationMs: 0,
      replyDelayMs: baseDelay,
      replyMessages: [],
    };
  }

  // 选择规则与回复文本
  const rule = selectRule(contact.persona.rules, userMessage.content);
  const replyMessages: Array<{ content: string }> = [];
  if (rule) {
    const firstResponse = pickRandom(rule.responses);
    replyMessages.push({ content: firstResponse });

    // 按概率追加第二条消息，避免与第一条完全相同
    if (
      behavior.multiMessageChance > 0 &&
      rule.responses.length > 1 &&
      Math.random() < behavior.multiMessageChance
    ) {
      const remainingResponses = rule.responses.filter((response) => response !== firstResponse);
      if (remainingResponses.length > 0) {
        replyMessages.push({ content: pickRandom(remainingResponses) });
      }
    }
  }

  return {
    conversationId: userMessage.conversationId,
    contactId: contact.id,
    readUserMessageIds,
    readDelayMs: readDelay,
    typingDurationMs: typingDuration,
    replyDelayMs: baseDelay,
    replyMessages,
  };
}
