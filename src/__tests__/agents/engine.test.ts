import { describe, it, expect } from 'vitest';
import { generateReply } from '../../agents/engine';
import type { Contact, Message } from '../../types';

function createContact(overrides?: Partial<Contact>): Contact {
  return {
    id: 'test-contact',
    name: '测试联系人',
    avatar: '/avatar.svg',
    wechatId: 'wxid_test',
    region: '中国',
    signature: '',
    tags: [],
    isOnline: true,
    persona: {
      id: 'test',
      name: '测试',
      avatar: '/avatar.svg',
      wechatId: 'wxid_test',
      region: '中国',
      signature: '',
      tags: [],
      behavior: {
        replyDelayMin: 1000,
        replyDelayMax: 1000,
        typingIndicatorChance: 0,
        readButNoReplyChance: 0,
        multiMessageChance: 0,
        emojiChance: 0,
      },
      rules: [],
    },
    ...overrides,
  } as Contact;
}

function createUserMessage(content: string): Message {
  return {
    id: 'msg-user-1',
    conversationId: 'conv-1',
    senderId: 'me',
    type: 'text',
    content,
    status: 'sent',
    createdAt: Date.now(),
  };
}

describe('AgentEngine', () => {
  it('matches keyword rule', () => {
    const contact = createContact({
      persona: {
        ...createContact().persona,
        rules: [
          { id: 'food', triggers: { keywords: ['吃'] }, responses: ['吃了吗？'], weight: 1 },
          { id: 'default', triggers: { default: true }, responses: ['好的'], weight: 1 },
        ],
      },
    });
    const plan = generateReply({
      contact,
      userMessage: createUserMessage('吃了吗'),
      recentMessages: [],
      options: { timeScale: 0 },
    });
    expect(plan.replyMessages).toHaveLength(1);
    expect(plan.replyMessages[0].content).toBe('吃了吗？');
  });

  it('falls back to default rule', () => {
    const contact = createContact({
      persona: {
        ...createContact().persona,
        rules: [
          { id: 'food', triggers: { keywords: ['吃'] }, responses: ['吃了吗？'], weight: 1 },
          { id: 'default', triggers: { default: true }, responses: ['收到', '尽快'], weight: 1 },
        ],
      },
    });
    const plan = generateReply({
      contact,
      userMessage: createUserMessage('天气不错'),
      recentMessages: [],
      options: { timeScale: 0 },
    });
    expect(['收到', '尽快']).toContain(plan.replyMessages[0].content);
  });

  it('returns empty reply when read but no reply', () => {
    const contact = createContact({
      persona: {
        ...createContact().persona,
        behavior: { ...createContact().persona.behavior, readButNoReplyChance: 1 },
      },
    });
    const userMessage = createUserMessage('hello');
    const plan = generateReply({
      contact,
      userMessage,
      recentMessages: [userMessage],
      options: { timeScale: 0 },
    });
    expect(plan.replyMessages).toHaveLength(0);
    expect(plan.readUserMessageIds).toContain(userMessage.id);
  });

  it('scales time to zero', () => {
    const contact = createContact();
    const plan = generateReply({
      contact,
      userMessage: createUserMessage('hi'),
      recentMessages: [],
      options: { timeScale: 0 },
    });
    expect(plan.replyDelayMs).toBe(0);
    expect(plan.readDelayMs).toBe(0);
  });

  it('returns empty reply when persona rules is empty', () => {
    const contact = createContact();
    const plan = generateReply({
      contact,
      userMessage: createUserMessage('hi'),
      recentMessages: [],
      options: { timeScale: 0 },
    });
    expect(plan.replyMessages).toHaveLength(0);
  });

  it('produces multiple messages when multiMessageChance is 1', () => {
    const contact = createContact({
      persona: {
        ...createContact().persona,
        behavior: { ...createContact().persona.behavior, multiMessageChance: 1 },
        rules: [{ id: 'default', triggers: { default: true }, responses: ['a', 'b', 'c'], weight: 1 }],
      },
    });
    const plan = generateReply({
      contact,
      userMessage: createUserMessage('hi'),
      recentMessages: [],
      options: { timeScale: 0 },
    });
    expect(plan.replyMessages.length).toBeGreaterThanOrEqual(2);
  });
});
