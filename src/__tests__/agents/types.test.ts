import { describe, it, expect } from 'vitest';
import type { AgentPersona, ReplyPlan } from '../../agents/types';

describe('agents/types re-export', () => {
  it('can import AgentPersona from agents/types', () => {
    const persona: AgentPersona = {
      id: 'mom',
      name: '王阿姨',
      avatar: '/avatar-mom.png',
      wechatId: 'wxid_mom',
      region: '中国',
      signature: '家和万事兴',
      tags: ['家人'],
      version: 2,
      initiateChance: 1,
      initiateTopics: [],
      behavior: {
        replyDelayMin: 1000,
        replyDelayMax: 3000,
        typingIndicatorChance: 0.7,
        readButNoReplyChance: 0.05,
        multiMessageChance: 0.3,
        emojiChance: 0.6,
        groupReplyChance: 0.5,
      },
      rules: [
        {
          id: 'mom-food',
          triggers: { keywords: ['吃', '饭'] },
          responses: ['吃了吗？'],
          weight: 1,
        },
      ],
    };
    expect(persona.name).toBe('王阿姨');
  });
});

describe('agents/types ReplyPlan', () => {
  it('accepts a valid ReplyPlan object', () => {
    const plan: ReplyPlan = {
      conversationId: 'conv-1',
      contactId: 'mom',
      readUserMessageIds: ['msg-1'],
      readDelayMs: 300,
      typingDurationMs: 500,
      replyDelayMs: 1000,
      replyMessages: [{ content: '吃了吗？' }],
    };
    expect(plan.replyMessages[0].content).toBe('吃了吗？');
  });
});
