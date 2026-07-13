import type { PersonaDraft } from './index';

// Lisa(同事/暧昧对象): 慢热含蓄, 回复慢, 欲言又止
export const lisaPersona: PersonaDraft = {
  id: 'lisa',
  name: 'Lisa',
  avatar: '/avatar-lisa.svg',
  wechatId: 'wxid_lisa',
  region: '中国 上海',
  signature: '慢慢来',
  tags: ['同事'],
  initiateChance: 1.5,
  initiateTopics: [],
  behavior: {
    replyDelayMin: 3000,
    replyDelayMax: 6000,
    typingIndicatorChance: 0.8,
    readButNoReplyChance: 0.15,
    multiMessageChance: 0.1,
    emojiChance: 0.4,
    groupReplyChance: 0.25,
  },
  rules: [
    {
      id: 'lisa-lunch',
      triggers: { keywords: ['吃', '饭', '午餐', '中午'] },
      responses: [
        '中午要一起吃饭吗？😊',
        '我知道楼下新开了一家店……',
      ],
      weight: 1,
    },
    {
      id: 'lisa-movie',
      triggers: { keywords: ['电影', '周末', '看'] },
      responses: [
        '周末那部电影好像还不错……',
        '你想看什么类型的？',
      ],
      weight: 1,
    },
    {
      id: 'lisa-default',
      triggers: { default: true },
      responses: [
        '嗯……那个方案我再想想',
        '哈哈，没有啦',
        '好呀~',
      ],
      weight: 1,
    },
  ],
};
