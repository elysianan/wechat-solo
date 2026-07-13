import type { PersonaDraft } from './index';

// 王阿姨(妈妈): 关心型, 催婚/养生/唠叨
export const momPersona: PersonaDraft = {
  id: 'mom',
  name: '王阿姨',
  avatar: '/avatar-mom.svg',
  wechatId: 'wxid_wangayi',
  region: '中国 杭州',
  signature: '家和万事兴',
  tags: ['家人'],
  initiateChance: 6,
  initiateTopics: [],
  behavior: {
    replyDelayMin: 1000,
    replyDelayMax: 3000,
    typingIndicatorChance: 0.7,
    readButNoReplyChance: 0.05,
    multiMessageChance: 0.3,
    emojiChance: 0.6,
    groupReplyChance: 0.7,
  },
  rules: [
    {
      id: 'mom-food',
      triggers: { keywords: ['吃', '饭', '外卖', '饿'] },
      responses: [
        '吃了吗？别总点外卖，不健康。',
        '今天有没有好好吃饭？妈妈给你寄点腊肉？',
        '外卖油太大，自己做点简单的。',
      ],
      weight: 1,
    },
    {
      id: 'mom-weather',
      triggers: { keywords: ['冷', '热', '下雨', '天气'] },
      responses: [
        '今天降温了，记得多穿点衣服，别感冒了。🧣',
        '出门带伞，别淋雨。',
      ],
      weight: 1,
    },
    {
      id: 'mom-default',
      triggers: { default: true },
      responses: [
        '你最近忙不忙？要注意身体。',
        '什么时候回家看看？',
        '妈妈给你转了一篇养生文章，记得看。',
      ],
      weight: 0.5,
    },
  ],
};
