import type { StoryChain } from '../../types';

// 剧情链种子数据: 多轮剧本对话, 让高频话题(催婚/约饭/催租)有连续感
// 设计要点:
// - triggerKeywords 避开泛词(如「吃」), 用明确场景词, 避免与普通规则过度竞争
// - advanceKeywords 缺省的步骤: 任意回复都推进(寒暄/收尾阶段)
// - 设了 advanceKeywords 的步骤: 用户接话才推进, 跑题时引擎按概率拉回或脱离

export const STORY_CHAINS: StoryChain[] = [
  // 妈妈 · 催婚链: 寒暄 → 旁敲侧击 → 直接催 → 举例子 → 收尾
  {
    id: 'mom-marriage',
    contactId: 'mom',
    triggerKeywords: ['对象', '相亲', '结婚', '单身'],
    triggerChance: 0.8,
    steps: [
      {
        replies: [
          '最近一个人在外面，吃饭睡觉都还好吗？',
          '{nickname}啊，最近过得怎么样？',
        ],
      },
      {
        replies: [
          '你王叔叔家的女儿，上次还问起你呢。',
          '对了，你王阿姨想给你介绍个对象。',
        ],
      },
      {
        replies: [
          '妈也不绕弯子了，你打算什么时候找对象？',
          '说正事，个人问题该考虑考虑了。',
        ],
        advanceKeywords: ['找', '谈', '相亲', '见', '嗯', '好'],
      },
      {
        replies: [
          '你看隔壁小李，比你还小两岁，孩子都会叫奶奶了。',
          '你表姐去年结婚的，现在过得多好。',
        ],
        advanceKeywords: ['找', '谈', '相亲', '见', '嗯', '好', '知道'],
      },
      {
        replies: [
          '行了行了，妈不逼你，但你自己要放在心上。❤️',
          '好了不说了，你自己上心，妈妈爱你。',
        ],
      },
    ],
  },

  // 阿杰 · 约饭链: 提议 → 定时间 → 改期波折 → 成行
  {
    id: 'buddy-dinner',
    contactId: 'buddy',
    triggerKeywords: ['火锅', '烧烤', '聚餐', '约饭'],
    triggerChance: 0.6,
    steps: [
      {
        replies: [
          '说到吃，周末火锅走起？老地方。',
          '兄弟，这周末搓一顿？我馋火锅了。',
        ],
      },
      {
        replies: ['周六晚上七点，我订位子。', '那就周六，老时间老地点。'],
        advanceKeywords: ['好', '行', '可以', '没问题', '妥'],
      },
      {
        replies: [
          '卧槽，周六临时加班，改周日行不？',
          '等下，周六可能要加班……周日行吗？',
        ],
        advanceKeywords: ['行', '可以', '好', '没问题', '周日'],
      },
      {
        replies: ['妥了，周日晚上七点，不来是狗。', '完美，周日见，我先把位子订了。'],
      },
    ],
  },

  // 房东 · 催租链: 提醒 → 宽限商量 → 到账确认
  {
    id: 'landlord-rent',
    contactId: 'landlord',
    triggerKeywords: ['房租', '租金', '宽限'],
    triggerChance: 0.7,
    steps: [
      {
        replies: ['{nickname}啊，这个月房租记得按时交哈。', '提醒一下，房租该交了。'],
      },
      {
        replies: [
          '有困难就跟叔说，最多宽限你三天。',
          '手头紧？那宽限三天，不能再多了。',
        ],
        advanceKeywords: ['宽限', '困难', '紧', '晚', '等'],
      },
      {
        replies: ['收到了，下次按时点，大家都不容易。', '嗯，这次就这样，下不为例。'],
      },
    ],
  },
];
