import { describe, it, expect } from 'vitest';
import { generateReply } from '../../agents/engine';
import type { Contact, LocationMessage, Message, TransferMessage } from '../../types';

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
        groupReplyChance: 0,
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

  it('收到位置消息按 messageType 规则回复', () => {
    const contact = createContact({
      persona: {
        ...createContact().persona,
        rules: [
          {
            id: 'location-rule',
            triggers: { messageType: 'location' },
            responses: ['收到，到时候见'],
            weight: 1,
          },
          { id: 'default', triggers: { default: true }, responses: ['好的'], weight: 1 },
        ],
      },
    });
    const userMessage: LocationMessage = {
      id: 'm1',
      conversationId: 'c1',
      senderId: 'me',
      type: 'location',
      name: '腾讯大厦',
      address: '深圳',
      status: 'sent',
      createdAt: Date.now(),
    };
    const plan = generateReply({
      contact,
      userMessage,
      recentMessages: [userMessage],
      options: { timeScale: 0 },
    });
    expect(plan.replyMessages).toEqual([{ content: '收到，到时候见' }]);
    expect(plan.usedRuleId).toBe('location-rule');
  });

  it('收到转账消息按 messageType 规则回复', () => {
    const contact = createContact({
      persona: {
        ...createContact().persona,
        rules: [
          {
            id: 'transfer-rule',
            triggers: { messageType: 'transfer' },
            responses: ['怎么突然给我转钱？'],
            weight: 1,
          },
          { id: 'default', triggers: { default: true }, responses: ['好的'], weight: 1 },
        ],
      },
    });
    const userMessage: TransferMessage = {
      id: 'm2',
      conversationId: 'c1',
      senderId: 'me',
      type: 'transfer',
      amount: 100,
      note: '零花钱',
      transferStatus: 'pending',
      status: 'sent',
      createdAt: Date.now(),
    };
    const plan = generateReply({
      contact,
      userMessage,
      recentMessages: [userMessage],
      options: { timeScale: 0 },
    });
    expect(plan.replyMessages).toEqual([{ content: '怎么突然给我转钱？' }]);
    expect(plan.usedRuleId).toBe('transfer-rule');
  });

  it('非文本消息不会误触发文本关键词规则', () => {
    const contact = createContact({
      persona: {
        ...createContact().persona,
        rules: [
          { id: 'food', triggers: { keywords: ['吃'] }, responses: ['吃了吗？'], weight: 1 },
          { id: 'default', triggers: { default: true }, responses: ['默认回复'], weight: 1 },
        ],
      },
    });
    const userMessage: LocationMessage = {
      id: 'm3',
      conversationId: 'c1',
      senderId: 'me',
      type: 'location',
      name: '吃饭的地方',
      address: '某街道',
      status: 'sent',
      createdAt: Date.now(),
    };
    const plan = generateReply({
      contact,
      userMessage,
      recentMessages: [userMessage],
      options: { timeScale: 0 },
    });
    expect(plan.replyMessages[0].content).toBe('默认回复');
    expect(plan.usedRuleId).not.toBe('food');
  });

  it('非文本消息无 messageType 规则时走 default 规则', () => {
    const contact = createContact({
      persona: {
        ...createContact().persona,
        rules: [{ id: 'default', triggers: { default: true }, responses: ['收到'], weight: 1 }],
      },
    });
    const userMessage: LocationMessage = {
      id: 'm4',
      conversationId: 'c1',
      senderId: 'me',
      type: 'location',
      name: '某地',
      address: '某地址',
      status: 'sent',
      createdAt: Date.now(),
    };
    const plan = generateReply({
      contact,
      userMessage,
      recentMessages: [userMessage],
      options: { timeScale: 0 },
    });
    expect(plan.replyMessages).toEqual([{ content: '收到' }]);
  });

  it('非文本消息保留已读不回判定', () => {
    const contact = createContact({
      persona: {
        ...createContact().persona,
        behavior: { ...createContact().persona.behavior, readButNoReplyChance: 1 },
        rules: [
          {
            id: 'location-rule',
            triggers: { messageType: 'location' },
            responses: ['收到'],
            weight: 1,
          },
        ],
      },
    });
    const userMessage: LocationMessage = {
      id: 'm5',
      conversationId: 'c1',
      senderId: 'me',
      type: 'location',
      name: '某地',
      address: '某地址',
      status: 'sent',
      createdAt: Date.now(),
    };
    const plan = generateReply({
      contact,
      userMessage,
      recentMessages: [userMessage],
      options: { timeScale: 0 },
    });
    expect(plan.replyMessages).toHaveLength(0);
    expect(plan.readUserMessageIds).toContain(userMessage.id);
  });
});
