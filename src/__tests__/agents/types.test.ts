import { describe, it, expect } from 'vitest';
import type { AgentPersona } from '../../agents/types';

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
});
