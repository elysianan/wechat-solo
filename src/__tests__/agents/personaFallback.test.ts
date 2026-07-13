import { describe, it, expect } from 'vitest';
import { generateReply } from '../../agents/engine';
import { PERSONAS } from '../../data/personas';
import type { Contact, Message } from '../../types';

// 用真实 mom 人设构造 contact，验证收窄高频单字关键词后的兜底行为
const momPersona = PERSONAS.find((p) => p.id === 'mom')!;
const momContact: Contact = {
  id: 'mom',
  name: momPersona.name,
  avatar: momPersona.avatar,
  wechatId: momPersona.wechatId,
  region: momPersona.region,
  signature: momPersona.signature,
  tags: momPersona.tags,
  isOnline: true,
  persona: momPersona,
};

function makeUserMessage(content: string): Message {
  return {
    id: `msg-${content}`,
    conversationId: 'conv-mom',
    senderId: 'me',
    type: 'text',
    content,
    status: 'read',
    createdAt: new Date(2026, 6, 14, 12, 0).getTime(),
  };
}

// 中午 12 点（afternoon），避开 morning/night 时段规则干扰
const NOON = new Date(2026, 6, 14, 12, 0).getTime();

describe('人设兜底：收窄高频单字关键词，降低答非所问', () => {
  it('含“想”但非“想你/想家”的输入不再误命中 mom-miss，走承接式 default', () => {
    const plan = generateReply({
      contact: momContact,
      userMessage: makeUserMessage('我在想一个哲学问题'),
      recentMessages: [],
      options: { timeScale: 0, forceReply: true, now: NOON },
    });
    expect(plan.usedRuleId).toBe('mom-default');
  });

  it('“我想你了”仍能命中 mom-miss（收窄未误伤正常命中）', () => {
    const plan = generateReply({
      contact: momContact,
      userMessage: makeUserMessage('我想你了'),
      recentMessages: [],
      options: { timeScale: 0, forceReply: true, now: NOON },
    });
    expect(plan.usedRuleId).toBe('mom-miss');
  });
});
