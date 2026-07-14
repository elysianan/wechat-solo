import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useChatStore } from '../../stores/useChatStore';
import { useAppStore } from '../../stores/useAppStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('useChatStore 群聊调度', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    await db.delete();
    await db.open();
    await initializeDatabase();
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
    await useChatStore.getState().loadChats();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const groupOf = (name: string) =>
    useChatStore.getState().conversations.find((c) => c.name === name)!;

  it('@成员必回：@王阿姨 后家庭群收到妈妈回复', async () => {
    const family = groupOf('幸福一家人');
    await useChatStore.getState().sendMessage(family.id, { type: 'text', content: '@王阿姨 晚上几点吃饭？' });
    await vi.runAllTimersAsync();

    const messages = useChatStore.getState().messages[family.id];
    const last = messages[messages.length - 1];
    expect(last.senderId).toBe('mom');
  });

  it('@多成员多人依次回复', async () => {
    const work = groupOf('产品研发群');
    await useChatStore.getState().sendMessage(work.id, { type: 'text', content: '@阿杰 @张总 这个需求看下' });
    await vi.runAllTimersAsync();

    const messages = useChatStore.getState().messages[work.id];
    const newReplies = messages.filter(
      (m) => m.senderId !== 'me' && m.createdAt >= Date.now() - 60_000 && m.status !== 'read'
    );
    const replierIds = new Set(newReplies.map((m) => m.senderId));
    expect(replierIds.has('buddy')).toBe(true);
    expect(replierIds.has('boss')).toBe(true);
  });

  it('无 @ 且成员回复概率为 0 时无人回复', async () => {
    await db.contacts.where('id').equals('mom').modify((c) => {
      c.persona.behavior.groupReplyChance = 0;
    });
    const family = groupOf('幸福一家人');
    const before = useChatStore.getState().messages[family.id].length;

    await useChatStore.getState().sendMessage(family.id, { type: 'text', content: '在忙，晚点说' });
    await vi.runAllTimersAsync();

    const after = useChatStore.getState().messages[family.id];
    expect(after.length).toBe(before + 1); // 只有用户自己的消息
  });

  it('无 @ 且成员回复概率为 1 时全员回复', async () => {
    await db.contacts.where('id').anyOf(['boss', 'lisa', 'buddy']).modify((c) => {
      c.persona.behavior.groupReplyChance = 1;
      c.persona.behavior.readButNoReplyChance = 0;
    });
    const work = groupOf('产品研发群');

    await useChatStore.getState().sendMessage(work.id, { type: 'text', content: '大家看下这个方案' });
    await vi.runAllTimersAsync();

    const messages = useChatStore.getState().messages[work.id];
    const recent = messages.filter((m) => m.createdAt >= Date.now() - 60_000);
    const replierIds = new Set(recent.filter((m) => m.senderId !== 'me').map((m) => m.senderId));
    expect(replierIds).toEqual(new Set(['boss', 'lisa', 'buddy']));
  });

  it('群聊用户消息状态流转到 delivered（群无已读回执）', async () => {
    await db.contacts.where('id').equals('mom').modify((c) => {
      c.persona.behavior.groupReplyChance = 0;
    });
    const family = groupOf('幸福一家人');
    // timeScale=1 拉开 150ms 状态窗口: timeScale=0 时 0ms 定时器可能在
    // sendMessage 的 await 链期间就触发, 中间态 sending 无法稳定观测
    useChatStore.getState().setReplyTimeScale(1);

    await useChatStore.getState().sendMessage(family.id, { type: 'text', content: '测试状态' });
    const userMessage = useChatStore
      .getState()
      .messages[family.id]
      .find((m) => m.senderId === 'me' && m.type === 'text' && m.content === '测试状态')!;
    expect(userMessage.status).toBe('sending');

    await vi.runAllTimersAsync();
    const updated = useChatStore
      .getState()
      .messages[family.id]
      .find((m) => m.id === userMessage.id)!;
    expect(updated.status).toBe('delivered');
  });

  it('群回复持久化到 IndexedDB', async () => {
    const family = groupOf('幸福一家人');
    await useChatStore.getState().sendMessage(family.id, { type: 'text', content: '@王阿姨 在吗' });
    await vi.runAllTimersAsync();

    const dbMessages = await db.messages
      .where('conversationId')
      .equals(family.id)
      .toArray();
    expect(dbMessages.some((m) => m.senderId === 'mom' && m.status === 'sent')).toBe(true);
  });
});
