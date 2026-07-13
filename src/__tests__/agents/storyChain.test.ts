import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateReply } from '../../agents/engine';
import type { GenerateReplyInput } from '../../agents/types';
import { PERSONAS } from '../../data/personas';
import { STORY_CHAINS } from '../../data/personas/storyChains';
import type { Contact, Conversation, Message } from '../../types';

const momPersona = PERSONAS.find((p) => p.id === 'mom')!;
const marriageChain = STORY_CHAINS.find((c) => c.id === 'mom-marriage')!;
const marriageLines = marriageChain.steps.flatMap((step) => step.replies);

function makeMomContact(behaviorPatch: Record<string, number> = {}): Contact {
  return {
    id: 'mom',
    name: '王阿姨',
    avatar: '/avatar-mom.svg',
    wechatId: 'wxid_wangayi',
    region: '中国 杭州',
    signature: '家和万事兴',
    tags: ['家人'],
    isOnline: true,
    persona: {
      ...momPersona,
      behavior: { ...momPersona.behavior, ...behaviorPatch },
    },
  };
}

function makeMessage(content: string): Message {
  return {
    id: `msg-${Math.random()}`,
    conversationId: 'conv-mom',
    senderId: 'me',
    type: 'text',
    content,
    status: 'read',
    createdAt: Date.now(),
  };
}

function makeConversation(storyProgress?: Conversation['storyProgress']): Conversation {
  return {
    id: 'conv-mom',
    type: 'single',
    contactId: 'mom',
    lastMessageId: '',
    unreadCount: 0,
    isPinned: true,
    isMuted: false,
    updatedAt: Date.now(),
    storyProgress,
  };
}

function makeInput(overrides: Partial<GenerateReplyInput> = {}): GenerateReplyInput {
  return {
    contact: makeMomContact(),
    userMessage: makeMessage('占位'),
    recentMessages: [],
    options: { timeScale: 0, forceReply: true },
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('剧情链触发', () => {
  it('用户消息命中触发词且概率通过 → 进入剧情 step 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // 0 < triggerChance 必进
    const plan = generateReply(
      makeInput({
        userMessage: makeMessage('我想去相亲看看'),
        conversation: makeConversation(),
      })
    );
    expect(plan.storyUpdate).toEqual({ chainId: 'mom-marriage', step: 0 });
    expect(plan.replyMessages).toHaveLength(1);
  });

  it('触发概率不过 → 走普通规则, 无 storyUpdate', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // >= triggerChance 不进
    const plan = generateReply(
      makeInput({
        userMessage: makeMessage('我想去相亲看看'),
        conversation: makeConversation(),
      })
    );
    expect(plan.storyUpdate).toBeUndefined();
    expect(plan.replyMessages).toHaveLength(1);
  });

  it('群聊场景(无 conversation)不触发剧情', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const plan = generateReply(
      makeInput({ userMessage: makeMessage('我想去相亲看看') })
    );
    expect(plan.storyUpdate).toBeUndefined();
  });
});

describe('剧情推进', () => {
  it('无 advanceKeywords 的步骤: 任意回复都推进', () => {
    const plan = generateReply(
      makeInput({
        userMessage: makeMessage('还行吧'),
        conversation: makeConversation({ chainId: 'mom-marriage', step: 0 }),
      })
    );
    expect(plan.storyUpdate).toEqual({ chainId: 'mom-marriage', step: 1 });
    expect(plan.replyMessages).toHaveLength(1);
  });

  it('advanceKeywords 接话 → 推进到下一步', () => {
    const plan = generateReply(
      makeInput({
        userMessage: makeMessage('嗯我知道了'),
        conversation: makeConversation({ chainId: 'mom-marriage', step: 2 }),
      })
    );
    expect(plan.storyUpdate).toEqual({ chainId: 'mom-marriage', step: 3 });
  });

  it('走完最后一步后再回复 → 清除进度, 回归普通规则', () => {
    const plan = generateReply(
      makeInput({
        userMessage: makeMessage('好的妈'),
        conversation: makeConversation({ chainId: 'mom-marriage', step: 4 }),
      })
    );
    expect(plan.storyUpdate).toBeNull();
    // 普通规则回复(multiMessageChance 可能追加第二条)
    expect(plan.replyMessages.length).toBeGreaterThanOrEqual(1);
  });
});

describe('剧情跑题分支', () => {
  it('跑题 + random < 0.5 → 拉回(重读当前步, 进度不变)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const plan = generateReply(
      makeInput({
        userMessage: makeMessage('工作太忙了'),
        conversation: makeConversation({ chainId: 'mom-marriage', step: 2 }),
      })
    );
    expect(plan.storyUpdate).toBeUndefined();
    expect(marriageLines).toContain(plan.replyMessages[0].content);
  });

  it('跑题 + random >= 0.5 → 脱离(清除进度, 走普通规则)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.6);
    const plan = generateReply(
      makeInput({
        userMessage: makeMessage('工作太忙了'),
        conversation: makeConversation({ chainId: 'mom-marriage', step: 2 }),
      })
    );
    expect(plan.storyUpdate).toBeNull();
    expect(marriageLines).not.toContain(plan.replyMessages[0].content);
  });
});

describe('剧情进行中必回', () => {
  it('readButNoReplyChance=1 时剧情分支仍然回复', () => {
    const plan = generateReply(
      makeInput({
        contact: makeMomContact({ readButNoReplyChance: 1 }),
        userMessage: makeMessage('还行吧'),
        conversation: makeConversation({ chainId: 'mom-marriage', step: 0 }),
      })
    );
    expect(plan.replyMessages).toHaveLength(1);
    expect(plan.storyUpdate).toEqual({ chainId: 'mom-marriage', step: 1 });
  });
});
