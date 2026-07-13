import { describe, it, expect } from 'vitest';
import { generateReply } from '../../agents/engine';
import type { GenerateReplyInput } from '../../agents/types';
import type { Contact, Message } from '../../types';

// 测试用联系人: 关键词规则(3 台词) + maxUsage 规则 + default 规则
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
          id: 'kw-rule',
          triggers: { keywords: ['加班', '忙'] },
          responses: ['{keyword}真辛苦', '{nickname}要注意休息', '打工人加油'],
          weight: 1,
        },
        {
          id: 'limited-rule',
          triggers: { keywords: ['限定'] },
          responses: ['限定台词'],
          weight: 1,
          maxUsageInSession: 1,
        },
        {
          id: 'default-rule',
          triggers: { default: true },
          responses: ['兜底甲', '兜底乙'],
          weight: 1,
        },
      ],
    },
  };
}

function makeMessage(content: string): Message {
  return {
    id: `msg-${Math.random()}`,
    conversationId: 'conv-tester',
    senderId: 'me',
    type: 'text',
    content,
    status: 'read',
    createdAt: Date.now(),
  };
}

function makeInput(overrides: Partial<GenerateReplyInput> = {}): GenerateReplyInput {
  return {
    contact: makeContact(),
    userMessage: makeMessage('在加班'),
    recentMessages: [],
    options: { timeScale: 0, forceReply: true },
    ...overrides,
  };
}

describe('引擎回复防重复', () => {
  it('已用过的台词不会被重复选取', () => {
    const sessionUsedResponses = new Set<string>(['{keyword}真辛苦', '打工人加油']);
    // 前两条含模板的已被"使用"(按替换前文本记录), 只剩 {nickname}要注意休息
    const plan = generateReply(
      makeInput({
        options: { timeScale: 0, forceReply: true, sessionUsedResponses, userNickname: '小明' },
      })
    );
    expect(plan.replyMessages[0].content).toBe('小明要注意休息');
  });

  it('规则台词全部用过时回退全集, 不崩溃', () => {
    const sessionUsedResponses = new Set<string>([
      '{keyword}真辛苦',
      '{nickname}要注意休息',
      '打工人加油',
    ]);
    const plan = generateReply(
      makeInput({ options: { timeScale: 0, forceReply: true, sessionUsedResponses } })
    );
    expect(plan.replyMessages.length).toBeGreaterThan(0);
  });

  it('引擎调用后更新 session 状态: 台词入 Set, 规则计数 +1', () => {
    const sessionUsedResponses = new Set<string>();
    const sessionRuleUsage = new Map<string, number>();
    const plan = generateReply(
      makeInput({ options: { timeScale: 0, forceReply: true, sessionUsedResponses, sessionRuleUsage } })
    );
    expect(sessionRuleUsage.get('kw-rule')).toBe(1);
    // 记录的是模板替换后的最终文本
    expect(sessionUsedResponses.has(plan.replyMessages[0].content)).toBe(true);
    expect(plan.usedRuleId).toBe('kw-rule');
  });
});

describe('引擎 maxUsageInSession', () => {
  it('次数用尽的规则被剔除, 落到 default', () => {
    const sessionRuleUsage = new Map<string, number>([['limited-rule', 1]]);
    const plan = generateReply(
      makeInput({
        userMessage: makeMessage('这是限定话题'),
        options: { timeScale: 0, forceReply: true, sessionRuleUsage },
      })
    );
    expect(plan.usedRuleId).toBe('default-rule');
  });

  it('次数未用尽时正常命中', () => {
    const sessionRuleUsage = new Map<string, number>();
    const plan = generateReply(
      makeInput({
        userMessage: makeMessage('这是限定话题'),
        options: { timeScale: 0, forceReply: true, sessionRuleUsage },
      })
    );
    expect(plan.usedRuleId).toBe('limited-rule');
  });
});

describe('引擎模板替换', () => {
  it('{keyword} 替换为用户消息中命中的关键词', () => {
    const sessionUsedResponses = new Set<string>(['{nickname}要注意休息', '打工人加油']);
    const plan = generateReply(
      makeInput({
        userMessage: makeMessage('最近一直加班'),
        options: { timeScale: 0, forceReply: true, sessionUsedResponses },
      })
    );
    expect(plan.replyMessages[0].content).toBe('加班真辛苦');
  });

  it('{nickname} 替换为注入的用户昵称', () => {
    const sessionUsedResponses = new Set<string>(['{keyword}真辛苦', '打工人加油']);
    const plan = generateReply(
      makeInput({
        options: { timeScale: 0, forceReply: true, sessionUsedResponses, userNickname: '小明' },
      })
    );
    expect(plan.replyMessages[0].content).toBe('小明要注意休息');
  });

  it('无关键词命中(default 规则)时 {keyword} 替换为空字符串', () => {
    const contact = makeContact();
    contact.persona.rules = [
      {
        id: 'default-rule',
        triggers: { default: true },
        responses: ['你刚才说{keyword}是吧'],
        weight: 1,
      },
    ];
    const plan = generateReply(
      makeInput({ contact, userMessage: makeMessage('天气不错') })
    );
    expect(plan.replyMessages[0].content).toBe('你刚才说是吧');
  });
});
