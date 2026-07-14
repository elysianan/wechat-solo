import type { Me, Contact, Conversation, Message, Moment, Tag } from '../types';
import { makeId } from '../utils/id';
import { PERSONAS } from './personas';

export const seedMe: Me = {
  id: 'me',
  nickname: '我',
  avatar: '/avatar-me.svg',
  wechatId: 'wxid_me_2026',
  region: '中国 上海',
  signature: '保持热爱，奔赴山海',
};

const BASE_TIME = Date.now();

const contactOnlineMap: Record<string, boolean> = {
  mom: true,
  boss: false,
  buddy: true,
  lisa: false,
  landlord: false,
};


export const seedContacts: Contact[] = PERSONAS.map((persona) => ({
  id: persona.id,
  name: persona.name,
  avatar: persona.avatar,
  wechatId: persona.wechatId,
  region: persona.region,
  signature: persona.signature,
  tags: persona.tags,
  persona,
  isOnline: contactOnlineMap[persona.id] ?? false,
}));

function assignLastMessageIds(conversations: Conversation[], messages: Message[]): void {
  const messagesByConversation = new Map<string, Message[]>();
  for (const message of messages) {
    const list = messagesByConversation.get(message.conversationId) ?? [];
    list.push(message);
    messagesByConversation.set(message.conversationId, list);
  }

  for (const conversation of conversations) {
    const list = messagesByConversation.get(conversation.id) ?? [];
    list.sort((a, b) => a.createdAt - b.createdAt);
    conversation.lastMessageId = list[list.length - 1]?.id ?? '';
  }
}

export const seedConversations: Conversation[] = seedContacts.map((contact, index) => ({
  id: `conv-${contact.id}`,
  type: 'single',
  contactId: contact.id,
  lastMessageId: '',
  unreadCount: contact.id === 'boss' ? 1 : 0,
  isPinned: contact.id === 'mom',
  isMuted: false,
  updatedAt: BASE_TIME - index * 60 * 60 * 1000,
}));

const RED_DOT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export const seedMessages: Message[] = seedContacts.flatMap((contact) => {
  const conversationId = `conv-${contact.id}`;
  const now = BASE_TIME;
  const baseMessages: Message[] = [
    {
      id: makeId('msg'),
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
        ? '今天午饭一起吃吗？'
        : '这个月房租记得按时转。',
      status: 'read',
      createdAt: now - 1000 * 60 * 60 * 2,
    },
    {
      id: makeId('msg'),
      conversationId,
      senderId: 'me',
      type: 'text',
      content: '好的，知道了。',
      status: 'read',
      createdAt: now - 1000 * 60 * 30,
    },
  ];

  // Sprint7：为 Demo 增加图片 / 语音 / 红包样例消息
  if (contact.id === 'mom') {
    baseMessages.push({
      id: makeId('msg'),
      conversationId,
      senderId: contact.id,
      type: 'image',
      url: RED_DOT_PNG,
      status: 'read',
      createdAt: now - 1000 * 60 * 20,
    });
  }
  if (contact.id === 'buddy') {
    baseMessages.push({
      id: makeId('msg'),
      conversationId,
      senderId: contact.id,
      type: 'voice',
      url: 'voice://demo',
      duration: 4,
      status: 'read',
      createdAt: now - 1000 * 60 * 18,
    });
  }
  if (contact.id === 'lisa') {
    baseMessages.push({
      id: makeId('msg'),
      conversationId,
      senderId: contact.id,
      type: 'redpacket',
      amount: 6.66,
      title: '请你喝奶茶',
      packetStatus: 'opened',
      status: 'read',
      createdAt: now - 1000 * 60 * 16,
    });
  }

  return baseMessages;
});

assignLastMessageIds(seedConversations, seedMessages);

// 群聊会话种子：幸福一家人（我 + 王阿姨）、产品研发群（我 + 张总 + Lisa + 阿杰）
export const seedGroupConversations: Conversation[] = [
  {
    id: 'conv-group-family',
    type: 'group',
    name: '幸福一家人',
    avatar: '/avatar-group-family.svg',
    memberIds: ['mom'],
    lastMessageId: '',
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    updatedAt: BASE_TIME - 1000 * 60 * 20,
  },
  {
    id: 'conv-group-work',
    type: 'group',
    name: '产品研发群',
    avatar: '/avatar-group-work.svg',
    memberIds: ['boss', 'lisa', 'buddy'],
    lastMessageId: '',
    unreadCount: 1,
    isPinned: false,
    isMuted: false,
    updatedAt: BASE_TIME - 1000 * 60 * 5,
  },
];

// 群聊历史消息种子
export const seedGroupMessages: Message[] = [
  {
    id: makeId('msg'),
    conversationId: 'conv-group-family',
    senderId: 'mom',
    type: 'text',
    content: '晚上回家吃饭吗？',
    status: 'read',
    createdAt: BASE_TIME - 1000 * 60 * 60,
  },
  {
    id: makeId('msg'),
    conversationId: 'conv-group-family',
    senderId: 'me',
    type: 'text',
    content: '回，大概七点到。',
    status: 'read',
    createdAt: BASE_TIME - 1000 * 60 * 50,
  },
  {
    id: makeId('msg'),
    conversationId: 'conv-group-family',
    senderId: 'mom',
    type: 'text',
    content: '好，给你炖了汤，路上慢点。',
    status: 'read',
    createdAt: BASE_TIME - 1000 * 60 * 20,
  },
  {
    id: makeId('msg'),
    conversationId: 'conv-group-work',
    senderId: 'boss',
    type: 'text',
    content: '本周迭代目标已同步到文档，大家看下。',
    status: 'read',
    createdAt: BASE_TIME - 1000 * 60 * 40,
  },
  {
    id: makeId('msg'),
    conversationId: 'conv-group-work',
    senderId: 'buddy',
    type: 'text',
    content: '收到收到，冲！',
    status: 'read',
    createdAt: BASE_TIME - 1000 * 60 * 35,
  },
  {
    id: makeId('msg'),
    conversationId: 'conv-group-work',
    senderId: 'lisa',
    type: 'text',
    content: '设计稿我晚点更新一版~',
    status: 'read',
    createdAt: BASE_TIME - 1000 * 60 * 30,
  },
  {
    id: makeId('msg'),
    conversationId: 'conv-group-work',
    senderId: 'me',
    type: 'text',
    content: '好的，我先把接口对一下。',
    status: 'read',
    createdAt: BASE_TIME - 1000 * 60 * 25,
  },
  {
    id: makeId('msg'),
    conversationId: 'conv-group-work',
    senderId: 'boss',
    type: 'text',
    content: '下班前对完，有问题群里说。',
    status: 'delivered',
    createdAt: BASE_TIME - 1000 * 60 * 5,
  },
];

assignLastMessageIds(seedGroupConversations, seedGroupMessages);

// 预置联系人标签（与种子联系人的 tags 对齐）
export const seedTags: Tag[] = [
  { id: 'tag-family', name: '家人', createdAt: BASE_TIME + 1 },
  { id: 'tag-colleague', name: '同事', createdAt: BASE_TIME + 2 },
  { id: 'tag-friend', name: '朋友', createdAt: BASE_TIME + 3 },
  { id: 'tag-landlord', name: '房东', createdAt: BASE_TIME + 4 },
];

export const seedMoments: Moment[] = [
  {
    id: makeId('moment'),
    authorId: 'mom',
    content: '今天的阳光真好，适合晒被子。☀️',
    images: [],
    createdAt: BASE_TIME - 1000 * 60 * 60 * 5,
    likes: [{ contactId: 'lisa', createdAt: BASE_TIME - 1000 * 60 * 30 }],
    comments: [],
  },
  {
    id: makeId('moment'),
    authorId: 'buddy',
    content: '又双叒叕加班了，资本家看了都流泪。',
    images: [],
    createdAt: BASE_TIME - 1000 * 60 * 60 * 8,
    likes: [{ contactId: 'lisa', createdAt: BASE_TIME - 1000 * 60 * 45 }],
    comments: [
      { id: makeId('comment'), contactId: 'mom', content: '年轻人要注意身体', createdAt: BASE_TIME - 1000 * 60 * 30 },
    ],
  },
  {
    id: makeId('moment'),
    authorId: 'lisa',
    content: '周末看了部电影，还不错~ 🎬',
    images: [],
    createdAt: BASE_TIME - 1000 * 60 * 60 * 24,
    likes: [{ contactId: 'buddy', createdAt: BASE_TIME - 1000 * 60 * 60 * 20 }],
    comments: [],
  },
  // 追加带图片占位的朋友圈动态
  {
    id: makeId('moment'),
    authorId: 'mom',
    content: '周末晒晒被子，舒服。☀️',
    images: ['placeholder', 'placeholder'],
    createdAt: BASE_TIME - 1000 * 60 * 60 * 12,
    likes: [],
    comments: [],
  },
  {
    id: makeId('moment'),
    authorId: 'boss',
    content: '团队本周目标明确，高效执行。',
    images: ['placeholder'],
    createdAt: BASE_TIME - 1000 * 60 * 60 * 36,
    likes: [{ contactId: 'lisa', createdAt: BASE_TIME - 1000 * 60 * 60 * 30 }],
    comments: [],
  },
];
