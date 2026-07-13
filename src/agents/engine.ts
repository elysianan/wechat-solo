import type { GenerateReplyInput, ReplyPlan } from './types';
import type { ReplyRule } from '../types';
import { getTimeWindow } from '../utils/timeWindow';

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
// context 是门槛条件: 规则声明了 context 时, 最近 5 条消息必须含任一 context 关键词;
// 若规则只有 context 没有 keywords/patterns, 门槛通过即命中
function matchesRule(rule: ReplyRule, content: string, recentContents: string[]): boolean {
  if (rule.triggers.context && rule.triggers.context.length > 0) {
    const contextText = recentContents.slice(-5).join(' ');
    if (!rule.triggers.context.some((keyword) => contextText.includes(keyword))) {
      return false;
    }
    if (!rule.triggers.keywords && !rule.triggers.patterns) {
      return true;
    }
  }
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

// 选择回复规则：先按时段过滤, 再匹配关键词/context, 无命中则兜底 default
function selectRule(
  rules: ReplyRule[],
  content: string,
  recentContents: string[],
  now: number
): ReplyRule | undefined {
  if (rules.length === 0) {
    return undefined;
  }
  const currentWindow = getTimeWindow(now);
  // 时段过滤: 声明了 timeWindow 的规则仅在指定时段参与候选
  const inWindow = rules.filter(
    (rule) => !rule.triggers.timeWindow || rule.triggers.timeWindow.includes(currentWindow)
  );
  const matched = inWindow.filter((rule) => matchesRule(rule, content, recentContents));
  const candidates = matched.length > 0 ? matched : inWindow.filter((rule) => rule.triggers.default);
  if (candidates.length === 0) {
    // 时段过滤后无兜底时回退到过滤前的最后一条, 保证引擎不崩溃
    return inWindow.length > 0 ? inWindow[inWindow.length - 1] : rules[rules.length - 1];
  }
  return selectWeightedRule(candidates);
}

// 根据联系人的人设生成回复计划
export function generateReply(input: GenerateReplyInput): ReplyPlan {
  const { contact, userMessage, recentMessages, options } = input;
  const timeScale = options?.timeScale ?? 1;
  const forceReply = options?.forceReply ?? false;
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

  // 已读不回（@提及时必回，跳过该判定）
  if (!forceReply && Math.random() < behavior.readButNoReplyChance) {
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
  const now = options?.now ?? Date.now();
  const recentContents = recentMessages.map((message) => message.content);
  const rule = selectRule(contact.persona.rules, userMessage.content, recentContents, now);
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
