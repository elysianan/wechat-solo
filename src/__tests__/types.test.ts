import { describe, it, expect } from 'vitest';
import type {
  Me,
  Contact,
  AgentPersona,
  Conversation,
  Message,
  Moment,
  AppSettings,
  MessagePayload,
  ReplyTrigger,
} from '../types';

describe('core types', () => {
  it('Me type accepts valid object', () => {
    const me: Me = {
      id: 'me',
      nickname: '我',
      avatar: '/avatar-me.png',
      wechatId: 'wxid_me',
      region: '中国',
      signature: '生活明朗，万物可爱',
    };
    expect(me.id).toBe('me');
  });

  it('AgentPersona type accepts valid object', () => {
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

  it('Message type requires status', () => {
    const message: Message = {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'me',
      type: 'text',
      content: 'hello',
      status: 'sent',
      createdAt: Date.now(),
    };
    expect(message.status).toBe('sent');
  });

  it('Contact type accepts valid object with persona', () => {
    const contact: Contact = {
      id: 'contact-mom',
      name: '王阿姨',
      avatar: '/avatar-mom.png',
      wechatId: 'wxid_mom',
      region: '中国',
      signature: '家和万事兴',
      tags: ['家人'],
      isOnline: true,
      persona: {
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
        rules: [],
      },
    };
    expect(contact.persona.id).toBe('mom');
    expect(contact.isOnline).toBe(true);
  });

  it('Conversation type accepts valid object', () => {
    const conversation: Conversation = {
      id: 'conv-1',
      type: 'single',
      contactId: 'contact-mom',
      lastMessageId: 'msg-1',
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      updatedAt: Date.now(),
    };
    expect(conversation.type).toBe('single');
    expect(conversation.unreadCount).toBe(0);
  });

  it('Moment type accepts valid object with likes and comments', () => {
    const moment: Moment = {
      id: 'moment-1',
      authorId: 'contact-mom',
      content: '今天天气真好',
      images: ['/image1.png'],
      createdAt: Date.now(),
      likes: [{ contactId: 'contact-friend', createdAt: Date.now() }],
      comments: [
        {
          id: 'comment-1',
          contactId: 'contact-friend',
          content: '是的呢',
          createdAt: Date.now(),
        },
      ],
    };
    expect(moment.likes).toHaveLength(1);
    expect(moment.comments).toHaveLength(1);
  });

  it('AppSettings type accepts valid object', () => {
    const settings: AppSettings = {
      darkMode: false,
      soundEnabled: true,
      vibrationEnabled: true,
      version: '0.0.1',
    };
    expect(settings.version).toBe('0.0.1');
  });

  it('TransferMessage accepts full status flow timestamps', () => {
    const message: Message = {
      id: 'msg-transfer',
      conversationId: 'conv-1',
      senderId: 'me',
      type: 'transfer',
      amount: 100,
      note: '吃饭报销',
      status: 'sent',
      transferStatus: 'received',
      transferCreatedAt: Date.now() - 1000,
      transferCompletedAt: Date.now(),
      createdAt: Date.now(),
    };
    expect(message.type).toBe('transfer');
    expect((message as Extract<Message, { type: 'transfer' }>).transferCompletedAt).toBeDefined();
  });

  it('LocationMessage requires name and address', () => {
    const message: Message = {
      id: 'msg-location',
      conversationId: 'conv-1',
      senderId: 'me',
      type: 'location',
      name: '公司',
      address: '科技园路 1 号',
      lat: 31.23,
      lng: 121.47,
      status: 'sent',
      createdAt: Date.now(),
    };
    expect(message.type).toBe('location');
    expect((message as Extract<Message, { type: 'location' }>).name).toBe('公司');
  });

  it('ContactCardMessage accepts required and optional fields', () => {
    const message: Message = {
      id: 'msg-card',
      conversationId: 'conv-1',
      senderId: 'me',
      type: 'contact_card',
      contactId: 'contact-friend',
      nickname: '小李',
      avatar: '/avatar-friend.png',
      region: '中国',
      signature: '你好',
      status: 'sent',
      createdAt: Date.now(),
    };
    expect(message.type).toBe('contact_card');
    expect((message as Extract<Message, { type: 'contact_card' }>).nickname).toBe('小李');
  });

  it('MessagePayload accepts new location/contact_card/transfer payloads', () => {
    const payloads: MessagePayload[] = [
      { type: 'location', name: '公司', address: '科技园路 1 号' },
      { type: 'contact_card', contactId: 'c-1', nickname: '小王', avatar: '/a.png' },
      { type: 'transfer', amount: 50, note: '咖啡' },
    ];
    expect(payloads).toHaveLength(3);
    expect(payloads[0].type).toBe('location');
    expect(payloads[1].type).toBe('contact_card');
    expect(payloads[2].type).toBe('transfer');
  });

  it('AgentPersona accepts behavior without optional transfer chances', () => {
    const persona: AgentPersona = {
      id: 'friend',
      name: '小李',
      avatar: '/avatar-friend.png',
      wechatId: 'wxid_friend',
      region: '中国',
      signature: '你好',
      tags: ['朋友'],
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
      rules: [],
    };
    expect(persona.behavior.transferAcceptChance).toBeUndefined();
  });

  it('AgentPersona accepts behavior with transfer chances', () => {
    const persona: AgentPersona = {
      id: 'friend',
      name: '小李',
      avatar: '/avatar-friend.png',
      wechatId: 'wxid_friend',
      region: '中国',
      signature: '你好',
      tags: ['朋友'],
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
        transferAcceptChance: 0.8,
        transferRefundChance: 0.1,
      },
      rules: [],
    };
    expect(persona.behavior.transferAcceptChance).toBe(0.8);
    expect(persona.behavior.transferRefundChance).toBe(0.1);
  });

  it('ReplyTrigger accepts optional messageType', () => {
    const trigger: ReplyTrigger = {
      keywords: ['转账'],
      messageType: 'transfer',
    };
    expect(trigger.messageType).toBe('transfer');
  });
});
