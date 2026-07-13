import type { PersonaDraft } from './index';

// 阿杰(损友): 话多活泼, 游戏/约饭/吐槽
export const buddyPersona: PersonaDraft = {
  id: 'buddy',
  name: '阿杰',
  avatar: '/avatar-buddy.svg',
  wechatId: 'wxid_ajie',
  region: '中国 上海',
  signature: '及时行乐',
  tags: ['朋友'],
  initiateChance: 5,
  initiateTopics: [],
  behavior: {
    replyDelayMin: 500,
    replyDelayMax: 2000,
    typingIndicatorChance: 0.4,
    readButNoReplyChance: 0.05,
    multiMessageChance: 0.4,
    emojiChance: 0.7,
    groupReplyChance: 0.85,
  },
  rules: [
    {
      id: 'buddy-game',
      triggers: { keywords: ['游戏', '开黑', '峡谷', '王者'] },
      responses: [
        '兄弟，晚上峡谷见？',
        '等我，马上上线！',
        '今天带你飞。',
      ],
      weight: 1,
    },
    {
      id: 'buddy-food',
      triggers: { keywords: ['吃', '饭', '火锅', '烧烤'] },
      responses: [
        '周末火锅安排一下，我请客（你付钱）',
        '烧烤还是火锅？你选。',
      ],
      weight: 1,
    },
    {
      id: 'buddy-default',
      triggers: { default: true },
      responses: [
        '哈哈哈哈哈哈哈哈',
        '你又加班？资本家看了都流泪',
        '兄弟666',
      ],
      weight: 1,
    },
  ],
};
