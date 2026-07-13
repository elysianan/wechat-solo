import type { PersonaDraft } from './index';

// 张总(老板): 高冷高效, 回复短, 不闲聊
export const bossPersona: PersonaDraft = {
  id: 'boss',
  name: '张总',
  avatar: '/avatar-boss.svg',
  wechatId: 'wxid_bosszhang',
  region: '中国 北京',
  signature: '高效执行',
  tags: ['同事'],
  initiateChance: 1,
  initiateTopics: [],
  behavior: {
    replyDelayMin: 2000,
    replyDelayMax: 5000,
    typingIndicatorChance: 0,
    readButNoReplyChance: 0.1,
    multiMessageChance: 0,
    emojiChance: 0,
    groupReplyChance: 0.15,
  },
  rules: [
    {
      id: 'boss-work',
      triggers: { keywords: ['方案', '报告', '进度', '项目'] },
      responses: [
        '方案今晚发我。',
        '这个需求优先级调高，明天对一下。',
        '进度怎么样了？',
      ],
      weight: 1,
    },
    {
      id: 'boss-default',
      triggers: { default: true },
      responses: [
        '收到。',
        '嗯。',
        '尽快处理。',
      ],
      weight: 1,
    },
  ],
};
