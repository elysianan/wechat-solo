import type { PersonaDraft } from './index';

// Lisa(同事/暧昧对象): 慢热含蓄, 省略号多, 欲言又止, 回复慢
export const lisaPersona: PersonaDraft = {
  id: 'lisa',
  name: 'Lisa',
  avatar: '/avatar-lisa.svg',
  wechatId: 'wxid_lisa',
  region: '中国 上海',
  signature: '慢慢来',
  tags: ['同事'],
  initiateChance: 1.5,
  initiateTopics: [
    '在忙吗……',
    '最近有没有看到什么好看的电影？',
    '楼下新开了家咖啡店，还不错',
    '那个方案……你有空帮我看下吗',
    '周末有什么安排吗？',
  ],
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
        '中午要一起吃{keyword}吗？😊',
        '我知道楼下新开了一家店……',
        '{keyword}呀……我还没想好去哪',
        '如果你不忙的话……一起？',
      ],
      weight: 1,
    },
    {
      id: 'lisa-movie',
      triggers: { keywords: ['电影', '周末', '看'] },
      responses: [
        '周末那部电影好像还不错……',
        '你想{keyword}什么类型的？',
        '一个人看有点无聊，不过也习惯了',
        '{keyword}的话……我有点兴趣',
      ],
      weight: 1,
    },
    {
      id: 'lisa-work',
      triggers: { keywords: ['方案', '工作', '加班', '项目'] },
      responses: [
        '那个{keyword}……我改了一版，你帮我把把关？',
        '别太累了，{keyword}做不完明天再说',
        '张总又在催了……😅',
        '你的{keyword}写得真好，能教教我吗',
      ],
      weight: 1,
    },
    {
      id: 'lisa-weather',
      triggers: { keywords: ['冷', '热', '下雨', '天气'] },
      responses: [
        '变{keyword}了，你衣服够吗？',
        '下雨了……我没带伞',
        '这种天气，适合喝点热的',
      ],
      weight: 0.8,
    },
    {
      id: 'lisa-night',
      triggers: { keywords: ['睡', '晚安', '困', '在吗'], timeWindow: ['night'] },
      responses: [
        '还没睡呀……我也睡不着',
        '这么晚了，{keyword}之前喝点热牛奶',
        '晚安……🌙',
        '其实我也经常这个点还醒着',
      ],
      weight: 1.5,
    },
    {
      id: 'lisa-morning',
      triggers: { keywords: ['早安', '早上', '起床'], timeWindow: ['morning'] },
      responses: [
        '早安呀☀️',
        '这么早……你吃早餐了吗',
        '早上好，今天天气不错呢',
      ],
      weight: 1.2,
    },
    {
      id: 'lisa-book',
      triggers: { keywords: ['书', '看', '推荐', '剧'] },
      responses: [
        '最近在看一本书，挺适合你的',
        '{keyword}吗？我有几部私藏的',
        '你喜欢什么类型的？我找找看',
      ],
      weight: 0.8,
    },
    {
      id: 'lisa-coffee',
      triggers: { keywords: ['咖啡', '奶茶', '喝', '下午茶'] },
      responses: [
        '我知道一家{keyword}店，豆子是自己烘的',
        '要不要……一起去买？',
        '{keyword}啊，我都可以，听你的',
      ],
      weight: 0.8,
    },
    {
      id: 'lisa-sick',
      triggers: { keywords: ['感冒', '生病', '发烧', '难受'] },
      responses: [
        '啊……严重吗？有没有吃药',
        '你{keyword}了还回消息，快休息',
        '需要帮你买点什么吗？我下班可以带过去',
        '多喝热水……虽然这句话很俗，但真的有用',
      ],
      weight: 1.2,
    },
    {
      id: 'lisa-birthday',
      triggers: { keywords: ['生日', '礼物', '惊喜'] },
      responses: [
        '{keyword}？是哪天呀，我记一下',
        '你喜欢什么？我……随便问问',
        '其实准备了一个小东西，不知道你会不会喜欢',
      ],
      weight: 0.8,
    },
    {
      id: 'lisa-travel',
      triggers: { keywords: ['旅游', '旅行', '玩', '去哪'] },
      responses: [
        '我一直想去{keyword}来着……',
        '一个人去有点怕，不过你可以给我推荐路线吗',
        '回来之后给我讲讲？我想听',
      ],
      weight: 0.6,
    },
    {
      id: 'lisa-cat',
      triggers: { keywords: ['猫', '狗', '宠物'] },
      responses: [
        '我楼下有只流浪{keyword}，每天等我下班',
        '你也喜欢{keyword}吗？',
        '以后……想养一只',
      ],
      weight: 0.6,
    },
    {
      id: 'lisa-music',
      triggers: { keywords: ['歌', '音乐', '听'] },
      responses: [
        '最近在循环一首歌，发给你听听？',
        '{keyword}的话，我喜欢安静一点的',
        '这首歌……让我想到一些事',
      ],
      weight: 0.6,
    },
    {
      id: 'lisa-ctx-work-late',
      triggers: { keywords: ['加班', '忙'], context: ['方案', '项目', '张总'] },
      responses: [
        '又是张总的活……辛苦了',
        '要不要我帮你分担一点？反正我也没事',
        '{keyword}到几点？别太晚回去',
      ],
      weight: 1.5,
    },
    {
      id: 'lisa-ctx-movie-weekend',
      triggers: { keywords: ['电影', '看'], context: ['周末', '休息', '放假'] },
      responses: [
        '周末去看电影的话……可以叫上我吗',
        '一个人去有点尴尬，两个人就刚刚好',
        '{keyword}完还可以顺便吃个饭',
      ],
      weight: 1.5,
    },
    {
      id: 'lisa-default',
      triggers: { default: true },
      responses: [
        '嗯……那个方案我再想想',
        '哈哈，没有啦',
        '好呀~',
        '是吗……',
        '你先忙，不用管我',
      ],
      weight: 0.5,
    },
  ],
};
