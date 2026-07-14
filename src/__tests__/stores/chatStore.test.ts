import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useChatStore } from '../../stores/useChatStore';
import { useAppStore } from '../../stores/useAppStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import type { TextMessage } from '../../types';

describe('useChatStore agent flow', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    // 数据库初始化在真实定时器下完成，避免 fake-indexeddb 与 fake timers 冲突
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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends message and transitions status to read', async () => {
    await useChatStore.getState().loadChats();
    const conversation = useChatStore.getState().conversations[0];
    await useChatStore.getState().sendMessage(conversation.id, { type: 'text', content: '测试消息' });

    const userMessage = useChatStore
      .getState()
      .messages[conversation.id]
      .find((m) => m.senderId === 'me' && m.type === 'text' && m.content === '测试消息')!;
    expect(userMessage.status).toBe('sending');

    await vi.runAllTimersAsync();
    const updated = useChatStore
      .getState()
      .messages[conversation.id]
      .find((m) => m.id === userMessage.id)!;
    expect(updated.status).toBe('read');
  });

  it('receives agent reply after user message', async () => {
    // 把 mom 的已读不回概率设为 0，避免测试随机失败
    await db.contacts.where('id').equals('mom').modify((contact) => {
      contact.persona.behavior.readButNoReplyChance = 0;
    });

    await useChatStore.getState().loadChats();
    const conversation = useChatStore.getState().conversations.find((c) => c.contactId === 'mom')!;
    await useChatStore.getState().sendMessage(conversation.id, { type: 'text', content: '吃了吗' });
    await vi.runAllTimersAsync();

    const messages = useChatStore.getState().messages[conversation.id];
    const lastMessage = messages[messages.length - 1];
    expect(lastMessage.senderId).toBe('mom');
  });

  it('shows typing indicator then hides', async () => {
    await db.contacts.where('id').equals('mom').modify((contact) => {
      contact.persona.behavior.readButNoReplyChance = 0;
      contact.persona.behavior.typingIndicatorChance = 1;
      contact.persona.behavior.replyDelayMin = 1000;
      contact.persona.behavior.replyDelayMax = 1000;
    });

    await useChatStore.getState().loadChats();
    useChatStore.setState({ replyTimeScale: 1 });
    const conversation = useChatStore.getState().conversations.find((c) => c.contactId === 'mom')!;
    await useChatStore.getState().sendMessage(conversation.id, { type: 'text', content: '吃了吗' });

    // readDelay 之前不应出现"正在输入"
    expect(useChatStore.getState().typingConversations[conversation.id]).toBeFalsy();

    // 推进到 readDelay 之后、typing 结束之前，"正在输入"应出现
    await vi.advanceTimersByTimeAsync(500);
    expect(useChatStore.getState().typingConversations[conversation.id]).toBe(true);

    await vi.runAllTimersAsync();
    expect(useChatStore.getState().typingConversations[conversation.id]).toBeFalsy();
  });

  it('increments unread count when user is not in conversation', async () => {
    await db.contacts.where('id').equals('mom').modify((contact) => {
      contact.persona.behavior.readButNoReplyChance = 0;
    });

    await useChatStore.getState().loadChats();
    const conversation = useChatStore.getState().conversations.find((c) => c.contactId === 'mom')!;
    useAppStore.setState({ pageStack: [{ type: 'chat-detail', conversationId: 'other-conv' }] });

    await useChatStore.getState().sendMessage(conversation.id, { type: 'text', content: '吃了吗' });
    await vi.runAllTimersAsync();

    const updated = useChatStore.getState().conversations.find((c) => c.id === conversation.id);
    expect(updated?.unreadCount).toBeGreaterThan(0);
  });

  it('deletes message and updates lastMessageId', async () => {
    await db.contacts.where('id').equals('mom').modify((contact) => {
      contact.persona.behavior.readButNoReplyChance = 0;
    });
    await useChatStore.getState().loadChats();
    const conversation = useChatStore.getState().conversations.find((c) => c.contactId === 'mom')!;

    await useChatStore.getState().sendMessage(conversation.id, { type: 'text', content: '第一条' });
    await useChatStore.getState().sendMessage(conversation.id, { type: 'text', content: '第二条' });
    await vi.runAllTimersAsync();

    const messages = useChatStore.getState().messages[conversation.id];
    const secondMessage = messages.find(
      (m) => m.type === 'text' && (m as TextMessage).content === '第二条'
    ) as TextMessage;
    const lastMessage = messages[messages.length - 1];
    expect(lastMessage.id).not.toBe(secondMessage.id);

    await useChatStore.getState().deleteMessage(conversation.id, lastMessage.id);

    const updatedMessages = useChatStore.getState().messages[conversation.id];
    expect(updatedMessages.find((m) => m.id === lastMessage.id)).toBeUndefined();
    const updatedConversation = useChatStore
      .getState()
      .conversations.find((c) => c.id === conversation.id)!;
    expect(updatedConversation.lastMessageId).toBe(updatedMessages[updatedMessages.length - 1].id);

    const dbMessage = await db.messages.get(lastMessage.id);
    expect(dbMessage).toBeUndefined();
  });

  it('retries failed message with new id', async () => {
    await useChatStore.getState().loadChats();
    const conversation = useChatStore.getState().conversations[0];

    // 构造一条失败消息直接写入 Dexie
    const failedMessage = {
      id: 'failed-msg-id',
      conversationId: conversation.id,
      senderId: 'me' as const,
      type: 'text' as const,
      content: '失败消息',
      status: 'failed' as const,
      createdAt: Date.now(),
    };
    await db.messages.add(failedMessage);
    await db.conversations.update(conversation.id, {
      lastMessageId: failedMessage.id,
      updatedAt: failedMessage.createdAt,
    });
    useChatStore.setState((state) => ({
      messages: {
        ...state.messages,
        [conversation.id]: [...(state.messages[conversation.id] || []), failedMessage],
      },
      conversations: state.conversations.map((c) =>
        c.id === conversation.id
          ? { ...c, lastMessageId: failedMessage.id, updatedAt: failedMessage.createdAt }
          : c
      ),
    }));

    await useChatStore.getState().retryMessage(conversation.id, failedMessage.id);
    await vi.runAllTimersAsync();

    const messages = useChatStore.getState().messages[conversation.id];
    expect(messages.find((m) => m.id === failedMessage.id)).toBeUndefined();
    const retried = messages.find(
      (m) => m.type === 'text' && (m as TextMessage).content === '失败消息'
    ) as TextMessage | undefined;
    expect(retried).toBeDefined();
    expect(retried!.id).not.toBe(failedMessage.id);
    expect(retried!.status).toBe('read');
  });
});
