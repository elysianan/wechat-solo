import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useChatStore, __resetSessionState } from '../../stores/useChatStore';
import { useAppStore } from '../../stores/useAppStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('主动发起对话调度器', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    await db.delete();
    await db.open();
    await initializeDatabase();
    // 只给妈妈注入话题池, 清空其他联系人话题池, 确保加权选人确定落在妈妈
    await db.contacts.toCollection().modify((contact) => {
      contact.persona.initiateTopics =
        contact.id === 'mom' ? ['吃饭了吗', '天冷了多穿点'] : [];
    });
    // 只 fake setInterval/Date: setTimeout 保持真实, 测试里用它 flush 事件循环,
    // 让 db 事务(setImmediate 链)在断言前完成; setImmediate 同理不能 fake(死锁)
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      toFake: ['setInterval', 'clearInterval', 'Date'],
    });
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
    useChatStore.getState().stopInitiateScheduler();
    vi.useRealTimers();
  });

  // 推进一个检查周期(60s)并 flush 真实事件循环, 等待注入的异步链完成
  const tick = async () => {
    await vi.advanceTimersByTimeAsync(60_000);
    await new Promise((resolve) => setTimeout(resolve, 100));
  };

  const momConversation = () =>
    useChatStore.getState().conversations.find((c) => c.contactId === 'mom')!;

  const momMessages = (): string[] =>
    (useChatStore.getState().messages[momConversation().id] ?? [])
      .filter((m) => m.senderId === 'mom')
      .map((m) => (m.type === 'text' ? m.content : ''));

  it('timeScale=0(无冷却): 每次检查都注入主动消息, 未读 +1', async () => {
    useChatStore.getState().startInitiateScheduler();
    const before = momMessages().length;
    const unreadBefore = momConversation().unreadCount;

    await tick();

    expect(momMessages().length).toBe(before + 1);
    expect(momConversation().unreadCount).toBe(unreadBefore + 1);
  });

  it('话题防重复: 话题池耗尽前不重复', async () => {
    useChatStore.getState().startInitiateScheduler();
    const before = momMessages().length;

    await tick();
    await tick();

    const fresh = momMessages().slice(before);
    expect(fresh).toHaveLength(2);
    expect(fresh[0]).not.toBe(fresh[1]);
  });

  it('timeScale=1: 全局冷却 90s 内不重复注入', async () => {
    useChatStore.setState({ replyTimeScale: 1 });
    useChatStore.getState().startInitiateScheduler();
    const before = momMessages().length;

    await tick(); // 第一次注入
    expect(momMessages().length).toBe(before + 1);

    await tick(); // 距上次 60s < 90s 全局冷却
    expect(momMessages().length).toBe(before + 1);

    await tick(); // 距上次 120s > 90s, 但妈妈在 5 分钟单人冷却内
    expect(momMessages().length).toBe(before + 1);
  });

  it('stop 后不再注入', async () => {
    useChatStore.getState().startInitiateScheduler();
    await tick();
    const before = momMessages().length;

    useChatStore.getState().stopInitiateScheduler();
    await vi.advanceTimersByTimeAsync(300_000);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(momMessages().length).toBe(before);
  });

  it('lastInitiatedAt 持久化: timeScale=1 时重启调度器冷却仍有效', async () => {
    useChatStore.setState({ replyTimeScale: 1 });
    useChatStore.getState().startInitiateScheduler();
    await tick();

    // 冷却时间戳写入 IndexedDB
    const fromDb = await db.conversations.get(momConversation().id);
    expect(fromDb?.lastInitiatedAt).toBeGreaterThan(0);

    // 重启调度器(模拟页面刷新后重新挂载), 5 分钟单人冷却内不再注入
    useChatStore.getState().stopInitiateScheduler();
    const before = momMessages().length;
    useChatStore.getState().startInitiateScheduler();
    await tick();
    await tick();

    expect(momMessages().length).toBe(before);
  });
});
