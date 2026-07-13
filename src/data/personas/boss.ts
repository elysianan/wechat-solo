import type { PersonaDraft } from './index';

// 张总(老板): 极简命令式, 无 emoji, 不闲聊, 回复短促
export const bossPersona: PersonaDraft = {
  id: 'boss',
  name: '张总',
  avatar: '/avatar-boss.svg',
  wechatId: 'wxid_bosszhang',
  region: '中国 北京',
  signature: '高效执行',
  tags: ['同事'],
  initiateChance: 1,
  initiateTopics: [
    '方案改完发我。',
    '明天早上过一下进度。',
    '上周的数据报表整理一下。',
    '客户那边反馈汇总好了吗。',
    '这个月目标还差多少，心里有数吗。',
  ],
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
        '{keyword}今晚发我。',
        '这个{keyword}优先级调高，明天对一下。',
        '{keyword}怎么样了？',
        '数据说话，别给我看感觉。',
      ],
      weight: 1,
    },
    {
      id: 'boss-meeting',
      triggers: { keywords: ['会议', '讨论', '对齐'] },
      responses: [
        '明天上午十点，会议室见。',
        '这个{keyword}提前发材料，别空着脑子来。',
        '长话短说，半小时内结束。',
      ],
      weight: 1,
    },
    {
      id: 'boss-client',
      triggers: { keywords: ['客户', '合同', '签约', '需求'] },
      responses: [
        '{keyword}那边什么反馈？',
        '先满足{keyword}的核心需求，其他的往后排。',
        '合同条款让法务再过一遍。',
        '这个{keyword}不能丢，盯紧点。',
      ],
      weight: 1.2,
    },
    {
      id: 'boss-data',
      triggers: { keywords: ['数据', '报表', '增长', '指标'] },
      responses: [
        '{keyword}出来了发我一份。',
        '环比怎么样？给我结论，不要过程。',
        '这个{keyword}对不上，回去再核一遍。',
      ],
      weight: 1,
    },
    {
      id: 'boss-deadline',
      triggers: { keywords: ['deadline', '截止', '周五', '月底', '时间'] },
      responses: [
        '{keyword}不变，自己想办法。',
        '{keyword}前必须交付，没有商量。',
        '提前量打出来，别卡最后一天。',
      ],
      weight: 1,
    },
    {
      id: 'boss-night',
      triggers: { keywords: ['在吗', '睡', '方便'], timeWindow: ['night'] },
      responses: [
        '说事。',
        '明天上班谈。',
        '急事？',
      ],
      weight: 1.5,
    },
    {
      id: 'boss-morning',
      triggers: { keywords: ['早', '早安', '早上'], timeWindow: ['morning'] },
      responses: [
        '九点到办公室，过一下今天安排。',
        '早。昨天的遗留问题先处理。',
        '晨会材料发群里。',
      ],
      weight: 1.2,
    },
    {
      id: 'boss-people',
      triggers: { keywords: ['招聘', '离职', '团队'] },
      responses: [
        '人手不够就打报告，走流程。',
        '这个人的去留，月底给我评估。',
        '团队状态怎么样？有情况直接说。',
      ],
      weight: 0.8,
    },
    {
      id: 'boss-budget',
      triggers: { keywords: ['预算', '费用', '钱', '成本'] },
      responses: [
        '{keyword}超了没有？',
        '该花的花，不该花的一分别动。',
        '做个{keyword}对比表给我。',
      ],
      weight: 0.8,
    },
    {
      id: 'boss-praise',
      triggers: { keywords: ['完成', '上线', '搞定', '做好了'] },
      responses: [
        '嗯，知道了。',
        '结果发我。',
        '下个{keyword}继续。',
        '可以，保持。',
      ],
      weight: 1,
    },
    {
      id: 'boss-problem',
      triggers: { keywords: ['问题', '风险', '延期', '出了'] },
      responses: [
        '什么{keyword}？说清楚。',
        '给我方案，不要给我{keyword}。',
        '影响范围多大？今天下班前给结论。',
        '早干什么去了。',
      ],
      weight: 1.2,
    },
    {
      id: 'boss-leave',
      triggers: { keywords: ['请假', '休息', '年假', '病假'] },
      responses: [
        '走流程，找 HR 报备。',
        '手头的事交接清楚再走。',
        '{keyword}可以，回来把进度补上。',
      ],
      weight: 0.8,
    },
    {
      id: 'boss-train',
      triggers: { keywords: ['学习', '培训', '提升', '成长'] },
      responses: [
        '成长是自己的事，公司只看产出。',
        '想学就学，别耽误正事。',
        '{keyword}完应用到项目里，学以致用。',
      ],
      weight: 0.6,
    },
    {
      id: 'boss-ctx-plan-late',
      triggers: { keywords: ['方案', '报告'], context: ['延期', '问题', '风险'] },
      responses: [
        '方案先交，问题边做边解决。',
        '我不听解释，我要{keyword}和时间表。',
        '明天早上九点，带着方案来找我。',
      ],
      weight: 1.5,
    },
    {
      id: 'boss-ctx-client-urgent',
      triggers: { keywords: ['客户', '需求'], context: ['问题', '投诉', '紧急'] },
      responses: [
        '客户的事优先级最高，马上处理。',
        '带上解决方案去沟通，别空手去。',
        '处理完第一时间同步我。',
      ],
      weight: 1.5,
    },
    {
      id: 'boss-default',
      triggers: { default: true },
      responses: ['嗯。', '继续。', '然后呢？', '说重点。', '知道了。', '具体点。'],
      weight: 0.5,
    },
  ],
};
