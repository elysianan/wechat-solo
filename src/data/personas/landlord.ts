import type { PersonaDraft } from './index';

// 刘房东: 务实, 催租/修东西/缴费
export const landlordPersona: PersonaDraft = {
  id: 'landlord',
  name: '刘房东',
  avatar: '/avatar-landlord.svg',
  wechatId: 'wxid_landlord',
  region: '中国 上海',
  signature: '诚信为本',
  tags: ['房东'],
  initiateChance: 2,
  initiateTopics: [],
  behavior: {
    replyDelayMin: 2000,
    replyDelayMax: 4000,
    typingIndicatorChance: 0.2,
    readButNoReplyChance: 0.1,
    multiMessageChance: 0,
    emojiChance: 0.1,
    groupReplyChance: 0.3,
  },
  rules: [
    {
      id: 'landlord-rent',
      triggers: { keywords: ['房租', '钱', '转', '交'] },
      responses: [
        '这个月房租最晚周五转我。',
        '水费单发你了，看一下。',
      ],
      weight: 1,
    },
    {
      id: 'landlord-default',
      triggers: { default: true },
      responses: [
        '热水器修好了，下次注意点。',
        '这次先不催你，下不为例。',
      ],
      weight: 1,
    },
  ],
};
