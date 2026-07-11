import { describe, it, expect } from 'vitest';
import type { Me, Contact, AgentPersona, Conversation, Message, Moment, AppSettings } from '../types';

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
      behavior: {
        replyDelayMin: 1000,
        replyDelayMax: 3000,
        typingIndicatorChance: 0.7,
        readButNoReplyChance: 0.05,
        multiMessageChance: 0.3,
        emojiChance: 0.6,
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
        behavior: {
          replyDelayMin: 1000,
          replyDelayMax: 3000,
          typingIndicatorChance: 0.7,
          readButNoReplyChance: 0.05,
          multiMessageChance: 0.3,
          emojiChance: 0.6,
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
});
