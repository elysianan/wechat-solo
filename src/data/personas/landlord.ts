import type { PersonaDraft } from './index';

// 刘房东: 务实, 催租/维修/缴费, 话不多但讲规矩
export const landlordPersona: PersonaDraft = {
  id: 'landlord',
  name: '刘房东',
  avatar: '/avatar-landlord.svg',
  wechatId: 'wxid_landlord',
  region: '中国 上海',
  signature: '诚信为本',
  tags: ['房东'],
  initiateChance: 2,
  initiateTopics: [
    '下个月房租记得按时交。',
    '最近房子没什么问题吧？',
    '物业费账单发你了，看一下。',
    '楼上邻居反映有点吵，晚上注意点。',
    '合同快到期了，续不续提前说。',
  ],
  behavior: {
    replyDelayMin: 2000,
    replyDelayMax: 4000,
    typingIndicatorChance: 0.2,
    readButNoReplyChance: 0.1,
    multiMessageChance: 0,
    emojiChance: 0.1,
    groupReplyChance: 0.3,
    transferAcceptChance: 0.98,
    transferRefundChance: 0,
  },
  rules: [
    {
      id: 'landlord-rent',
      triggers: { keywords: ['房租', '钱', '转', '交'] },
      responses: [
        '这个月房租最晚周五转我。',
        '水费单发你了，看一下。',
        '{keyword}的事别拖，大家都按规矩来。',
        '收到了跟你说一声，我这边好记账。',
      ],
      weight: 1.2,
    },
    {
      id: 'landlord-repair',
      triggers: { keywords: ['坏', '修', '漏', '堵', '不热', '不亮'] },
      responses: [
        '哪里{keyword}了？拍个照片我看看。',
        '我周末叫师傅过去，你在家吗？',
        '小问题自己先紧一紧，大问题我来处理。',
        '{keyword}多久了？下次早点说。',
      ],
      weight: 1.2,
    },
    {
      id: 'landlord-bill',
      triggers: { keywords: ['水费', '电费', '物业', '燃气', '网费'] },
      responses: [
        '{keyword}单子发你了，核对一下。',
        '这个月{keyword}比上月多了点，注意用电。',
        '{keyword}记得按时交，别产生滞纳金。',
      ],
      weight: 1,
    },
    {
      id: 'landlord-contract',
      triggers: { keywords: ['合同', '续租', '退租', '押金', '到期'] },
      responses: [
        '{keyword}的事提前一个月说，按合同来。',
        '退租的话提前打招呼，房子收拾好。',
        '押金没问题，验房合格就退。',
      ],
      weight: 1,
    },
    {
      id: 'landlord-neighbor',
      triggers: { keywords: ['邻居', '吵', '投诉', '动静'] },
      responses: [
        '楼上反映晚上有点{keyword}，注意一下。',
        '邻里之间互相体谅，都是出来打工的。',
        '{keyword}的事我跟对方也说了，大家各让一步。',
      ],
      weight: 0.8,
    },
    {
      id: 'landlord-night',
      triggers: { keywords: ['在吗', '急', '漏水', '钥匙'], timeWindow: ['night'] },
      responses: [
        '什么事？急的话直接打电话。',
        '这个点了，不是急事明天说。',
        '{keyword}？严重的话我现在过去看看。',
      ],
      weight: 1.5,
    },
    {
      id: 'landlord-morning',
      triggers: { keywords: ['早', '师傅', '上门'], timeWindow: ['morning'] },
      responses: [
        '师傅上午十点到，你在家等着。',
        '早，昨晚说的事今天处理。',
        '我九点半到小区门口，下来接一下。',
      ],
      weight: 1.2,
    },
    {
      id: 'landlord-key',
      triggers: { keywords: ['钥匙', '锁', '门卡', '门禁'] },
      responses: [
        '{keyword}放物业那了，自己去拿。',
        '备用{keyword}我这有一把，急用跟我说。',
        '锁芯该换了，抽空我叫人处理。',
      ],
      weight: 0.8,
    },
    {
      id: 'landlord-move',
      triggers: { keywords: ['搬', '行李', '东西', '家具'] },
      responses: [
        '{keyword}的时候注意别磕碰墙面。',
        '大件从货梯走，跟物业说一声。',
        '缺什么家具跟我说，库房有闲置的。',
      ],
      weight: 0.8,
    },
    {
      id: 'landlord-weather',
      triggers: { keywords: ['冷', '下雨', '台风', '天气'] },
      responses: [
        '{keyword}了记得关窗，阳台东西收进来。',
        '下大雨看看窗户漏不漏水，漏了告诉我。',
        '天冷热水器水温调高点，别冻感冒了。',
      ],
      weight: 0.8,
    },
    {
      id: 'landlord-safety',
      triggers: { keywords: ['电', '燃气', '安全', '火'] },
      responses: [
        '出门记得关{keyword}，安全第一。',
        '{keyword}这事不能马虎，出事就是大事。',
        '老旧插座别插太多东西，容易跳闸。',
      ],
      weight: 1,
    },
    {
      id: 'landlord-clean',
      triggers: { keywords: ['卫生', '打扫', '垃圾', '蟑螂'] },
      responses: [
        '公共区域的卫生轮流来，这周该你了。',
        '垃圾及时扔，天气热容易招虫子。',
        '{keyword}的话买点药，墙角厨房都放上。',
      ],
      weight: 0.6,
    },
    {
      id: 'landlord-raise',
      triggers: { keywords: ['涨价', '涨租', '行情', '便宜'] },
      responses: [
        '这片的行情你可以去打听，我这算良心的。',
        '{keyword}的事合同期内不会动，放心。',
        '续租的话价格好商量，老租客了。',
      ],
      weight: 0.6,
    },
    {
      id: 'landlord-ctx-repair-rent',
      triggers: { keywords: ['修', '坏'], context: ['房租', '租金'] },
      responses: [
        '东西该修修，房租该交交，两码事。',
        '修好了记得把房租补上。',
        '我拿房租给你修房子，你总不能让我两头亏。',
      ],
      weight: 1.5,
    },
    {
      id: 'landlord-ctx-bill-late',
      triggers: { keywords: ['水费', '电费', '物业费'], context: ['晚', '拖', '忘'] },
      responses: [
        '又忘了？这次我垫了，下次注意。',
        '账单早就发你了，别总让我催。',
        '滞纳金你自己承担，规矩就是规矩。',
      ],
      weight: 1.5,
    },
    {
      id: 'landlord-location',
      triggers: { messageType: 'location' },
      responses: [
        '这是房子位置？{keyword}我晓得。',
        '定位{keyword}收到，我过来看看。',
        '你在附近？{keyword}有事直接上门说。',
      ],
      weight: 1,
    },
    {
      id: 'landlord-transfer',
      triggers: { messageType: 'transfer' },
      responses: [
        '房租{keyword}收到了。',
        '转账{keyword}收到，下个月按时。',
        '钱{keyword}对上了，我记账。',
      ],
      weight: 1.2,
    },
    {
      id: 'landlord-contact-card',
      triggers: { messageType: 'contact_card' },
      responses: [
        '这是新租客？{keyword}',
        '名片{keyword}我留着，有事联系。',
        '靠谱的{keyword}租客可以推荐给我。',
      ],
      weight: 0.8,
    },
    {
      id: 'landlord-default',
      triggers: { default: true },
      responses: [
        '行，我知道了。',
        '嗯，你说。',
        '然后呢？',
        '哦，这样。',
        '嗯嗯，回头我看一下。',
        '好，有事直接说。',
      ],
      weight: 0.5,
    },
  ],
};
