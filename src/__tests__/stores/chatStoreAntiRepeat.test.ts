import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useChatStore, __resetSessionState } from '../../stores/useChatStore';
import { useAppStore } from '../../stores/useAppStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

// 连线验证: store 确实把 session 防重复状态接进了引擎调用
// (防重复逻辑本身的严格测试在 agents/antiRepeat.test.ts)
describe('chatStore session 防重复接线', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    await db.delete();
    await db.open();
    await initializeDatabase();
    // 钉死概率: 必回且单条回复, 消除随机干扰(交接单既有手法)
    await db.contacts.toCollection().modify((contact) => {
      contact.persona.behavior.readButNoReplyChance = 0;
      contact.persona.behavior.multiMessageChance = 0;
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    useChatStore.setState({
      conversations: [],
      messages: {},
      loaded: false,
      replyTimeScale: 0,
      typingConversations: {},
    });
    useAppStore.setState({
      currentTab: 'chats',
      pageStack: [{ type: 'tabs' }],
    });
    __resetSessionState();
    await useChatStore.getState().loadChats();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const buddyReplies = (conversationId: string): string[] =>
    (useChatStore.getState().messages[conversationId] ?? [])
      .filter((m) => m.senderId === 'buddy')
      .map((m) => m.content);

  it('单聊: 台词池内连续回复不重复(3 轮验证, 每轮 reset 后发 3 条)', async () => {
    const conversation = useChatStore
      .getState()
      .conversations.find((c) => c.contactId === 'buddy')!;

    // buddy-game 规则 3 条台词: 每轮前 3 条回复在防重复下必然互不相同
    for (let round = 0; round < 3; round++) {
      __resetSessionState();
      const before = buddyReplies(conversation.id).length;
      for (let i = 0; i < 3; i++) {
        await useChatStore.getState().sendMessage(conversation.id, '晚上开黑吗');
        await vi.runAllTimersAsync();
      }
      const slice = buddyReplies(conversation.id).slice(before);
      expect(slice).toHaveLength(3);
      expect(new Set(slice).size).toBe(3);
    }
  });

  it('群聊: 两条命中同一规则的 @消息, 回复参与 session 防重复', async () => {
    const work = useChatStore.getState().conversations.find((c) => c.name === '产品研发群')!;
    // 群聊种子含阿杰历史消息, 只统计本次发送后的增量
    const before = buddyReplies(work.id).length;

    // 两条都命中 buddy-game 规则, 防重复下阿杰两次回复不同
    await useChatStore.getState().sendMessage(work.id, '@阿杰 开黑吗');
    await vi.runAllTimersAsync();
    await useChatStore.getState().sendMessage(work.id, '@阿杰 继续开黑');
    await vi.runAllTimersAsync();

    const replies = buddyReplies(work.id).slice(before);
    expect(replies).toHaveLength(2);
    expect(replies[0]).not.toBe(replies[1]);
  });
});
