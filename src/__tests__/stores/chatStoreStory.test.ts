import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useChatStore, __resetSessionState } from '../../stores/useChatStore';
import { useAppStore } from '../../stores/useAppStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('chatStore 剧情链持久化', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    await db.delete();
    await db.open();
    await initializeDatabase();
    // 钉死已读不回, 消除干扰
    await db.contacts.toCollection().modify((contact) => {
      contact.persona.behavior.readButNoReplyChance = 0;
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
    vi.restoreAllMocks();
  });

  const momConversation = () =>
    useChatStore.getState().conversations.find((c) => c.contactId === 'mom')!;

  it('触发剧情后 storyProgress 持久化到 IndexedDB 与 store', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // 必触发剧情

    await useChatStore.getState().sendMessage(momConversation().id, { type: 'text', content: '我想去相亲看看' });
    await vi.runAllTimersAsync();

    const expected = { chainId: 'mom-marriage', step: 0 };
    const fromDb = await db.conversations.get(momConversation().id);
    expect(fromDb?.storyProgress).toEqual(expected);
    expect(momConversation().storyProgress).toEqual(expected);
  });

  it('剧情推进后 step 更新持久化', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    await useChatStore.getState().sendMessage(momConversation().id, { type: 'text', content: '我想去相亲看看' });
    await vi.runAllTimersAsync();
    await useChatStore.getState().sendMessage(momConversation().id, { type: 'text', content: '还行吧' });
    await vi.runAllTimersAsync();

    const fromDb = await db.conversations.get(momConversation().id);
    expect(fromDb?.storyProgress).toEqual({ chainId: 'mom-marriage', step: 1 });
  });

  it('剧情走完后 storyProgress 从 IndexedDB 与 store 清除', async () => {
    // 直接把进度改到最后一步(db 是 sendMessage 的真相源)
    await db.conversations.update(momConversation().id, {
      storyProgress: { chainId: 'mom-marriage', step: 4 },
    });

    await useChatStore.getState().sendMessage(momConversation().id, { type: 'text', content: '好的妈' });
    await vi.runAllTimersAsync();

    const fromDb = await db.conversations.get(momConversation().id);
    expect(fromDb?.storyProgress).toBeUndefined();
    expect(momConversation().storyProgress).toBeUndefined();
  });
});
