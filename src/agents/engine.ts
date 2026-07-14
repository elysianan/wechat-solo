import type { GenerateReplyInput, ReplyPlan } from './types';
import type { Message, ReplyRule } from '../types';
import { getTimeWindow } from '../utils/timeWindow';
import { STORY_CHAINS } from '../data/personas';

// 提取消息的文本内容：非文本消息返回空串，供引擎匹配与防重复使用
function messageText(message: Message): string {
  return message.type === 'text' ? message.content : '';
}

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

// 判断规则是否命中，返回命中的关键词：
// null = 未命中；'' = 命中但无具体关键词(纯 context / 正则 / default)；非空 = 命中的关键词
// context 是门槛条件: 声明了 context 时, 最近 5 条消息必须含任一 context 关键词
function matchKeyword(rule: ReplyRule, content: string, recentContents: string[]): string | null {
  if (rule.triggers.context && rule.triggers.context.length > 0) {
    const contextText = recentContents.slice(-5).join(' ');
    if (!rule.triggers.context.some((keyword) => contextText.includes(keyword))) {
      return null;
    }
    // 规则只有 context 没有 keywords/patterns 时, 门槛通过即命中
    if (!rule.triggers.keywords && !rule.triggers.patterns) {
      return '';
    }
  }
  const keyword = rule.triggers.keywords?.find((k) => content.includes(k));
  if (keyword !== undefined) {
    return keyword;
  }
  if (rule.triggers.patterns?.some((pattern) => pattern.test(content))) {
    return '';
  }
  return null;
}

// 规则匹配结果
interface RuleMatch {
  rule: ReplyRule;
  keyword: string; // '' 表示命中但无具体关键词
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

// 加权随机选一个匹配结果
function selectWeightedMatch(matches: RuleMatch[]): RuleMatch {
  const totalWeight = matches.reduce((sum, match) => sum + match.rule.weight, 0);
  let random = Math.random() * totalWeight;
  for (const match of matches) {
    random -= match.rule.weight;
    if (random <= 0) {
      return match;
    }
  }
  return matches[matches.length - 1];
}

// 选择回复规则：时段过滤 → maxUsage 剔除 → 关键词/context 匹配 → 兜底 default
function selectRule(
  rules: ReplyRule[],
  content: string,
  recentContents: string[],
  now: number,
  sessionRuleUsage?: Map<string, number>
): RuleMatch | undefined {
  if (rules.length === 0) {
    return undefined;
  }
  const currentWindow = getTimeWindow(now);
  // 时段过滤: 声明了 timeWindow 的规则仅在指定时段参与候选
  const inWindow = rules.filter(
    (rule) => !rule.triggers.timeWindow || rule.triggers.timeWindow.includes(currentWindow)
  );
  // maxUsageInSession 用尽的规则剔除; 全部用尽时回退到不过滤, 保证有回复
  const available = inWindow.filter((rule) => {
    if (rule.maxUsageInSession === undefined) {
      return true;
    }
    return (sessionRuleUsage?.get(rule.id) ?? 0) < rule.maxUsageInSession;
  });
  const pool = available.length > 0 ? available : inWindow;

  const matched: RuleMatch[] = [];
  for (const rule of pool) {
    const keyword = matchKeyword(rule, content, recentContents);
    if (keyword !== null) {
      matched.push({ rule, keyword });
    }
  }
  if (matched.length > 0) {
    return selectWeightedMatch(matched);
  }
  const defaults = pool.filter((rule) => rule.triggers.default);
  if (defaults.length > 0) {
    return { rule: selectWeightedRule(defaults), keyword: '' };
  }
  // 终极兜底: 回退到最后一条, 保证引擎不崩溃
  const fallback = pool.length > 0 ? pool[pool.length - 1] : rules[rules.length - 1];
  return { rule: fallback, keyword: '' };
}

// 选取台词: 跳过 session 已用过的(按原文比对); 全部用过则回退全集
function pickResponse(responses: string[], usedResponses?: Set<string>): string {
  const pool = responses.filter((response) => !usedResponses?.has(response));
  return pickRandom(pool.length > 0 ? pool : responses);
}

// 模板替换: {keyword} → 命中关键词(无则空串), {nickname} → 用户昵称
function applyTemplate(text: string, keyword: string, nickname: string): string {
  return text.replace(/\{keyword\}/g, keyword).replace(/\{nickname\}/g, nickname);
}

// 根据联系人的人设生成回复计划
export function generateReply(input: GenerateReplyInput): ReplyPlan {
  const { contact, userMessage, recentMessages, options } = input;
  const timeScale = options?.timeScale ?? 1;
  const forceReply = options?.forceReply ?? false;
  const behavior = contact.persona.behavior;

  // Sprint7：Agent 引擎当前只处理文本消息，非文本消息直接返回空计划
  if (userMessage.type !== 'text') {
    return {
      conversationId: userMessage.conversationId,
      contactId: contact.id,
      readUserMessageIds: recentMessages
        .filter((message) => message.senderId === 'me')
        .map((message) => message.id),
      readDelayMs: 0,
      typingDurationMs: 0,
      replyDelayMs: 0,
      replyMessages: [],
    };
  }

  // 计算时间线
  const baseDelay = randomBetween(behavior.replyDelayMin, behavior.replyDelayMax) * timeScale;
  const showTyping = Math.random() < behavior.typingIndicatorChance;
  const readDelay = baseDelay * randomBetween(0.4, 0.5);
  const typingDuration = showTyping ? (baseDelay - readDelay) * randomBetween(0.4, 0.9) : 0;

  // 所有我发送的消息都视为会被对方 read
  const readUserMessageIds = recentMessages
    .filter((message) => message.senderId === 'me')
    .map((message) => message.id);

  // 剧情进度变更: 对象=更新, null=清除, undefined=不变
  let storyUpdate: ReplyPlan['storyUpdate'];

  // 构造剧情台词回复(必回, 跳过已读不回; 参与 session 防重复)
  const buildStoryReply = (replies: string[]): { content: string } => {
    const content = applyTemplate(
      pickResponse(replies, options?.sessionUsedResponses),
      '',
      options?.userNickname ?? '我'
    );
    options?.sessionUsedResponses?.add(content);
    return { content };
  };

  const storyPlan = (replyMessages: Array<{ content: string }>): ReplyPlan => ({
    conversationId: userMessage.conversationId,
    contactId: contact.id,
    readUserMessageIds,
    readDelayMs: readDelay,
    typingDurationMs: typingDuration,
    replyDelayMs: baseDelay,
    replyMessages,
    storyUpdate,
  });

  // 剧情链分支(仅单聊: 调用方传入 conversation 时生效; 群聊不传)
  if (input.conversation) {
    const progress = input.conversation.storyProgress;
    const chain = progress
      ? STORY_CHAINS.find((c) => c.id === progress.chainId)
      : undefined;

    if (progress && chain) {
      // 剧情进行中: 推进 / 拉回 / 脱离
      const step = chain.steps[progress.step];
      const canAdvance =
        !step.advanceKeywords ||
        step.advanceKeywords.some((keyword) => userMessage.content.includes(keyword));

      if (canAdvance) {
        const nextStep = progress.step + 1;
        if (nextStep < chain.steps.length) {
          // 推进到下一步
          storyUpdate = { chainId: chain.id, step: nextStep };
          return storyPlan([buildStoryReply(chain.steps[nextStep].replies)]);
        }
        // 剧情走完: 清除进度, 本次回归普通规则
        storyUpdate = null;
      } else if (Math.random() < 0.5) {
        // 跑题拉回: 重读当前步台词, 进度不变
        return storyPlan([buildStoryReply(step.replies)]);
      } else {
        // 跑题脱离: 清除进度, 走普通规则
        storyUpdate = null;
      }
    } else if (!progress) {
      // 无进行中剧情: 命中触发词且概率通过则进入剧情
      const triggered = STORY_CHAINS.find(
        (c) =>
          c.contactId === contact.id &&
          c.triggerKeywords.some((keyword) => userMessage.content.includes(keyword)) &&
          Math.random() < c.triggerChance
      );
      if (triggered) {
        storyUpdate = { chainId: triggered.id, step: 0 };
        return storyPlan([buildStoryReply(triggered.steps[0].replies)]);
      }
    }
  }

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
      storyUpdate,
    };
  }

  // 选择规则与回复文本
  const now = options?.now ?? Date.now();
  const recentContents = recentMessages.map(messageText);
  const match = selectRule(
    contact.persona.rules,
    userMessage.content,
    recentContents,
    now,
    options?.sessionRuleUsage
  );
  const replyMessages: Array<{ content: string }> = [];
  let usedRuleId: string | undefined;

  if (match) {
    const { rule, keyword } = match;
    usedRuleId = rule.id;
    const nickname = options?.userNickname ?? '我';
    const usedRaws: string[] = [];

    const firstRaw = pickResponse(rule.responses, options?.sessionUsedResponses);
    usedRaws.push(firstRaw);
    replyMessages.push({ content: applyTemplate(firstRaw, keyword, nickname) });

    // 按概率追加第二条消息：避开第一条与 session 已用台词
    if (
      behavior.multiMessageChance > 0 &&
      rule.responses.length > 1 &&
      Math.random() < behavior.multiMessageChance
    ) {
      const remaining = rule.responses.filter(
        (response) => response !== firstRaw && !options?.sessionUsedResponses?.has(response)
      );
      const secondPool =
        remaining.length > 0 ? remaining : rule.responses.filter((response) => response !== firstRaw);
      if (secondPool.length > 0) {
        const secondRaw = pickRandom(secondPool);
        usedRaws.push(secondRaw);
        replyMessages.push({ content: applyTemplate(secondRaw, keyword, nickname) });
      }
    }

    // 更新 session 状态: 直接写入传入的 Set/Map, 调用方无需再记录
    // 同时记录原文(防同一模板重复选取)与最终文本(防跨规则撞文案)
    options?.sessionRuleUsage?.set(rule.id, (options.sessionRuleUsage.get(rule.id) ?? 0) + 1);
    for (const raw of usedRaws) {
      options?.sessionUsedResponses?.add(raw);
    }
    for (const message of replyMessages) {
      options?.sessionUsedResponses?.add(message.content);
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
    usedRuleId,
    storyUpdate,
  };
}
