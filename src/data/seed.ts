import type { Me, Contact, Conversation, Message, Moment, AgentPersona } from '../types';

export const seedMe: Me = {
  id: 'me',
  nickname: '我',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
  wechatId: 'wxid_me_2026',
  region: '中国 上海',
  signature: '保持热爱，奔赴山海',
};

export const seedPersonas: AgentPersona[] = [
  {
    id: 'mom',
    name: '王阿姨',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mom',
    wechatId: 'wxid_wangayi',
    region: '中国 杭州',
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
  },
  {
    id: 'boss',
    name: '张总',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=boss',
    wechatId: 'wxid_bosszhang',
    region: '中国 北京',
    signature: '高效执行',
    tags: ['同事'],
    behavior: {
      replyDelayMin: 2000,
      replyDelayMax: 5000,
      typingIndicatorChance: 0,
      readButNoReplyChance: 0.1,
      multiMessageChance: 0,
      emojiChance: 0,
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
  },
  {
    id: 'buddy',
    name: '阿杰',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=buddy',
    wechatId: 'wxid_ajie',
    region: '中国 上海',
    signature: '及时行乐',
    tags: ['朋友'],
    behavior: {
      replyDelayMin: 500,
      replyDelayMax: 2000,
      typingIndicatorChance: 0.4,
      readButNoReplyChance: 0.05,
      multiMessageChance: 0.4,
      emojiChance: 0.7,
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
  },
  {
    id: 'lisa',
    name: 'Lisa',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
    wechatId: 'wxid_lisa',
    region: '中国 上海',
    signature: '慢慢来',
    tags: ['同事'],
    behavior: {
      replyDelayMin: 3000,
      replyDelayMax: 6000,
      typingIndicatorChance: 0.8,
      readButNoReplyChance: 0.15,
      multiMessageChance: 0.1,
      emojiChance: 0.4,
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
  },
  {
    id: 'landlord',
    name: '刘房东',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=landlord',
    wechatId: 'wxid_landlord',
    region: '中国 上海',
    signature: '诚信为本',
    tags: ['房东'],
    behavior: {
      replyDelayMin: 2000,
      replyDelayMax: 4000,
      typingIndicatorChance: 0.2,
      readButNoReplyChance: 0.1,
      multiMessageChance: 0,
      emojiChance: 0.1,
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
  },
];

export const seedContacts: Contact[] = seedPersonas.map((persona) => ({
  id: persona.id,
  name: persona.name,
  avatar: persona.avatar,
  wechatId: persona.wechatId,
  region: persona.region,
  signature: persona.signature,
  tags: persona.tags,
  persona,
  isOnline: Math.random() > 0.5,
}));

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const seedConversations: Conversation[] = seedContacts.map((contact) => ({
  id: `conv-${contact.id}`,
  type: 'single',
  contactId: contact.id,
  lastMessageId: '',
  unreadCount: contact.id === 'boss' ? 1 : 0,
  isPinned: contact.id === 'mom',
  isMuted: false,
  updatedAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
}));

export const seedMessages: Message[] = seedContacts.flatMap((contact) => {
  const conversationId = `conv-${contact.id}`;
  const now = Date.now();
  const baseMessages: Message[] = [
    {
      id: generateId('msg'),
      conversationId,
      senderId: contact.id,
      type: 'text',
      content: contact.id === 'mom'
        ? '最近天气凉了，记得多穿点。'
        : contact.id === 'boss'
        ? '方案今天下班前发我。'
        : contact.id === 'buddy'
        ? '晚上开黑吗？'
        : contact.id === 'lisa'
        ? '今天 lunch 一起吗？'
        : '这个月房租记得按时转。',
      status: 'read',
      createdAt: now - 1000 * 60 * 60 * 2,
    },
    {
      id: generateId('msg'),
      conversationId,
      senderId: 'me',
      type: 'text',
      content: '好的，知道了。',
      status: 'read',
      createdAt: now - 1000 * 60 * 30,
    },
  ];

  // 更新会话的最后一条消息 ID
  const conversation = seedConversations.find((c) => c.id === conversationId)!;
  conversation.lastMessageId = baseMessages[baseMessages.length - 1].id;

  return baseMessages;
});

export const seedMoments: Moment[] = [
  {
    id: generateId('moment'),
    authorId: 'mom',
    content: '今天的阳光真好，适合晒被子。☀️',
    images: [],
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    likes: [{ contactId: 'lisa', createdAt: Date.now() - 1000 * 60 * 30 }],
    comments: [],
  },
  {
    id: generateId('moment'),
    authorId: 'buddy',
    content: '又双叒叕加班了，资本家看了都流泪。',
    images: [],
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    likes: [{ contactId: 'lisa', createdAt: Date.now() - 1000 * 60 * 45 }],
    comments: [
      { id: generateId('comment'), contactId: 'mom', content: '年轻人要注意身体', createdAt: Date.now() - 1000 * 60 * 30 },
    ],
  },
  {
    id: generateId('moment'),
    authorId: 'lisa',
    content: '周末看了部电影，还不错~ 🎬',
    images: [],
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    likes: [{ contactId: 'buddy', createdAt: Date.now() - 1000 * 60 * 60 * 20 }],
    comments: [],
  },
];
