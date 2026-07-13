import { describe, it, expect } from 'vitest';
import { getTimeWindow } from '../../utils/timeWindow';
import { generateReply } from '../../agents/engine';
import type { GenerateReplyInput } from '../../agents/types';
import type { Contact, Message } from '../../types';

// 测试用联系人: 规则命中域互不重叠, 避免加权随机带来不确定性
// ctx-rule(忙+上下文) / night-rule(在吗+深夜) / plain-rule(哈哈) / default-rule(兜底)
function makeContact(): Contact {
  return {
    id: 'tester',
    name: '测试员',
    avatar: '/avatar-me.svg',
    wechatId: 'wxid_tester',
    region: '中国',
    signature: '',
    tags: [],
    isOnline: true,
    persona: {
      id: 'tester',
      name: '测试员',
      avatar: '/avatar-me.svg',
      wechatId: 'wxid_tester',
      region: '中国',
      signature: '',
      tags: [],
      version: 2,
      initiateChance: 1,
      initiateTopics: [],
      behavior: {
        replyDelayMin: 0,
        replyDelayMax: 0,
        typingIndicatorChance: 0,
        readButNoReplyChance: 0,
        multiMessageChance: 0,
        emojiChance: 0,
        groupReplyChance: 0,
      },
      rules: [
        {
          id: 'ctx-rule',
          triggers: { keywords: ['忙'], context: ['对象'] },
          responses: ['上下文命中: 再忙也要考虑终身大事'],
          weight: 1,
        },
        {
          id: 'night-rule',
          triggers: { keywords: ['在吗'], timeWindow: ['night'] },
          responses: ['时段命中: 这么晚还不睡?'],
          weight: 1,
        },
        {
          id: 'plain-rule',
          triggers: { keywords: ['哈哈'] },
          responses: ['普通规则命中'],
          weight: 1,
        },
        {
          id: 'default-rule',
          triggers: { default: true },
          responses: ['兜底回复'],
          weight: 1,
        },
      ],
    },
  };
}

function makeMessage(content: string, senderId = 'me'): Message {
  return {
    id: `msg-${Math.random()}`,
    conversationId: 'conv-tester',
    senderId,
    type: 'text',
    content,
    status: 'read',
    createdAt: Date.now(),
  };
}

function makeInput(overrides: Partial<GenerateReplyInput> = {}): GenerateReplyInput {
  return {
    contact: makeContact(),
    userMessage: makeMessage('占位'),
    recentMessages: [],
    options: { timeScale: 0, forceReply: true },
    ...overrides,
  };
}

describe('getTimeWindow 时段划分', () => {
  it('6-11 点为 morning', () => {
    expect(getTimeWindow(new Date(2026, 6, 13, 8, 0).getTime())).toBe('morning');
  });

  it('11-14 点为 afternoon', () => {
    expect(getTimeWindow(new Date(2026, 6, 13, 12, 0).getTime())).toBe('afternoon');
  });

  it('14-22 点为 evening', () => {
    expect(getTimeWindow(new Date(2026, 6, 13, 18, 0).getTime())).toBe('evening');
  });

  it('22-24 与 0-6 点为 night', () => {
    expect(getTimeWindow(new Date(2026, 6, 13, 23, 0).getTime())).toBe('night');
    expect(getTimeWindow(new Date(2026, 6, 13, 2, 0).getTime())).toBe('night');
  });

  it('边界: 6 点整是 morning, 22 点整是 night', () => {
    expect(getTimeWindow(new Date(2026, 6, 13, 6, 0).getTime())).toBe('morning');
    expect(getTimeWindow(new Date(2026, 6, 13, 22, 0).getTime())).toBe('night');
  });
});

describe('引擎 context 匹配', () => {
  it('最近消息含 context 关键词时, context 规则可命中', () => {
    const input = makeInput({
      userMessage: makeMessage('最近太忙了'),
      recentMessages: [makeMessage('你找对象了吗', 'tester')],
    });
    const plan = generateReply(input);
    expect(plan.replyMessages[0].content).toBe('上下文命中: 再忙也要考虑终身大事');
  });

  it('最近消息不含 context 关键词时, context 规则不命中, 兜底 default', () => {
    const input = makeInput({
      userMessage: makeMessage('最近太忙了'),
      recentMessages: [makeMessage('天气不错', 'tester')],
    });
    const plan = generateReply(input);
    expect(plan.replyMessages[0].content).toBe('兜底回复');
  });

  it('context 只看最近 5 条, 更早的消息不生效', () => {
    const old = makeMessage('你找对象了吗', 'tester');
    const recent = Array.from({ length: 5 }, () => makeMessage('闲聊', 'tester'));
    const input = makeInput({
      userMessage: makeMessage('最近太忙了'),
      recentMessages: [old, ...recent],
    });
    const plan = generateReply(input);
    expect(plan.replyMessages[0].content).toBe('兜底回复');
  });

  it('只有 context 没有 keywords 的规则, 门槛通过即命中', () => {
    const contact = makeContact();
    contact.persona.rules = [
      {
        id: 'ctx-only',
        triggers: { context: ['对象'] },
        responses: ['纯上下文规则命中'],
        weight: 1,
      },
      {
        id: 'default-rule',
        triggers: { default: true },
        responses: ['兜底回复'],
        weight: 1,
      },
    ];
    const input = makeInput({
      contact,
      userMessage: makeMessage('随便说点什么'),
      recentMessages: [makeMessage('你找对象了吗', 'tester')],
    });
    const plan = generateReply(input);
    expect(plan.replyMessages[0].content).toBe('纯上下文规则命中');
  });
});

describe('引擎时段感知', () => {
  it('night 时段命中时段规则', () => {
    const input = makeInput({
      userMessage: makeMessage('在吗'),
      options: { timeScale: 0, forceReply: true, now: new Date(2026, 6, 13, 23, 30).getTime() },
    });
    const plan = generateReply(input);
    expect(plan.replyMessages[0].content).toBe('时段命中: 这么晚还不睡?');
  });

  it('非 night 时段, 时段规则被过滤, 无其他命中时兜底 default', () => {
    const input = makeInput({
      userMessage: makeMessage('在吗'),
      options: { timeScale: 0, forceReply: true, now: new Date(2026, 6, 13, 10, 0).getTime() },
    });
    const plan = generateReply(input);
    expect(plan.replyMessages[0].content).toBe('兜底回复');
  });

  it('无时段限制的规则全时段可命中', () => {
    for (const hour of [8, 12, 18, 23]) {
      const input = makeInput({
        userMessage: makeMessage('哈哈哈哈'),
        options: { timeScale: 0, forceReply: true, now: new Date(2026, 6, 13, hour, 0).getTime() },
      });
      const plan = generateReply(input);
      expect(plan.replyMessages[0].content).toBe('普通规则命中');
    }
  });
});
