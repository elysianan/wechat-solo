import type { PersonaDraft } from './index';

// 阿杰(损友): 话多活泼, 游戏/约饭/吐槽, 哈哈怪, emoji 多, 秒回
export const buddyPersona: PersonaDraft = {
  id: 'buddy',
  name: '阿杰',
  avatar: '/avatar-buddy.svg',
  wechatId: 'wxid_ajie',
  region: '中国 上海',
  signature: '及时行乐',
  tags: ['朋友'],
  initiateChance: 5,
  initiateTopics: [
    '晚上开黑？',
    '周末出来嗨啊！',
    '笑死，刚看到个视频必须发你。',
    '兄弟在忙啥呢？',
    '新开的烧烤店，去不去？',
    '峡谷五缺一，速来。',
  ],
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
      triggers: { keywords: ['游戏', '开黑', '峡谷', '王者', '吃鸡'] },
      responses: [
        '兄弟，晚上峡谷见？',
        '等我，马上上线！',
        '今天带你飞，躺好就行。',
        '{keyword}好啊，我这赛季还差三颗星。',
      ],
      weight: 1,
    },
    {
      id: 'buddy-food',
      triggers: { keywords: ['吃', '饭', '火锅', '烧烤'] },
      responses: [
        '周末火锅安排一下，我请客（你付钱）',
        '烧烤还是火锅？你选。',
        '{keyword}走起，我知道一家新开的。',
        '刚好我也饿了，{keyword}去？',
      ],
      weight: 1,
    },
    {
      id: 'buddy-work',
      triggers: { keywords: ['加班', '工作', '老板', '上班'] },
      responses: [
        '你又{keyword}？资本家看了都流泪',
        '兄弟，{keyword}是不可能{keyword}的，这辈子不可能准时下班的',
        '摸鱼才是打工人的本分，懂？',
        '你们老板是不是姓周？扒皮那个周',
      ],
      weight: 1,
    },
    {
      id: 'buddy-weekend',
      triggers: { keywords: ['周末', '放假', '休息', '出去'] },
      responses: [
        '{keyword}必须有安排，先开黑再烧烤。',
        '终于{keyword}了，出来浪啊！',
        '{keyword}打算干嘛？没安排我包了。',
      ],
      weight: 1,
    },
    {
      id: 'buddy-night',
      triggers: { keywords: ['睡', '晚安', '困', '在吗'], timeWindow: ['night'] },
      responses: [
        '睡什么睡，起来嗨！',
        '这个点睡？夜生活才刚开始兄弟',
        '再来一局就睡，真的，就一局',
        '{keyword}？年轻人睡什么觉，上分！',
      ],
      weight: 1.5,
    },
    {
      id: 'buddy-morning',
      triggers: { keywords: ['早安', '早上', '起床', '醒了'], timeWindow: ['morning'] },
      responses: [
        '卧槽你起这么早？被夺舍了？',
        '早个屁，我还没睡呢',
        '起这么早干嘛，{keyword}又不用打卡',
      ],
      weight: 1.2,
    },
    {
      id: 'buddy-money',
      triggers: { keywords: ['钱', '工资', '穷', '借'] },
      responses: [
        '谈{keyword}伤感情，谈感情伤{keyword}',
        '兄弟我也穷，要不一起喝西北风？',
        '发工资了？那必须你请客！',
        '{keyword}的事好说，先开黑',
      ],
      weight: 0.8,
    },
    {
      id: 'buddy-movie',
      triggers: { keywords: ['电影', '剧'] },
      responses: [
        '那部我也看了，结尾直接给我看懵了',
        '{keyword}什么类型？科幻还是动作？',
        '有资源发我一份，谢了兄弟',
      ],
      weight: 0.8,
    },
    {
      id: 'buddy-love',
      triggers: { keywords: ['对象', '女朋友', '喜欢', '表白'] },
      responses: [
        '卧槽，铁树开花了？',
        '快说说，哪个倒霉姑娘看上你了',
        '兄弟支持你！成了请吃饭！',
        '{keyword}这事急不得，先请我吃饭我教你',
      ],
      weight: 1,
    },
    {
      id: 'buddy-drink',
      triggers: { keywords: ['喝', '酒', '醉', '奶茶'] },
      responses: [
        '{keyword}可以，但先说好，喝醉了我不背你',
        '奶茶还是酒？成年人不做选择，都要',
        '上次你喝多抱着电线杆说话的事我还记得',
      ],
      weight: 0.8,
    },
    {
      id: 'buddy-travel',
      triggers: { keywords: ['旅游', '旅行', '玩', '去哪'] },
      responses: [
        '算我一个！行李都不带，蹭你的',
        '{keyword}好啊，攻略你做，我只负责玩',
        '去海边还是山里？我都可以',
      ],
      weight: 0.8,
    },
    {
      id: 'buddy-sick',
      triggers: { keywords: ['感冒', '生病', '发烧', '难受'] },
      responses: [
        '卧槽保重，多喝热水（经典发言）',
        '{keyword}了？那这周开黑取消，你养病',
        '需要我给你点外卖不？粥还是汤？',
      ],
      weight: 1,
    },
    {
      id: 'buddy-gym',
      triggers: { keywords: ['健身', '减肥', '胖', '运动'] },
      responses: [
        '{keyword}？你去年办的卡去了几次？',
        '减什么肥，烧烤不香吗',
        '行，我监督你，明天开始（明天再说）',
      ],
      weight: 0.6,
    },
    {
      id: 'buddy-ctx-game-work',
      triggers: { keywords: ['开黑', '游戏', '峡谷'], context: ['加班', '工作', '老板'] },
      responses: [
        '加什么班，先上号！老板算个球',
        '工作哪有上分重要，快快快',
        '你加班我等你，几点下班几点开',
      ],
      weight: 1.5,
    },
    {
      id: 'buddy-ctx-food-game',
      triggers: { keywords: ['吃', '饭'], context: ['开黑', '游戏', '峡谷'] },
      responses: [
        '吃饱了才有力气carry，先吃！',
        '边吃边上分，美滋滋',
        '{keyword}完直接开黑，一条龙安排',
      ],
      weight: 1.5,
    },
    {
      id: 'buddy-default',
      triggers: { default: true },
      responses: [
        '哈哈哈哈哈哈',
        '细说细说，我瓜子都备好了',
        '？？？展开讲讲',
        '然后呢然后呢',
        '有点东西',
        '嗯哼？继续',
      ],
      weight: 0.5,
    },
  ],
};
