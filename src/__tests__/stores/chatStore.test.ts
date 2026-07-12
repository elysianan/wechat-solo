import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../../stores/useChatStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('useChatStore', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useChatStore.setState({ conversations: [], messages: {}, loaded: false });
  });

  it('加载种子会话和消息', async () => {
    await initializeDatabase();
    await useChatStore.getState().loadChats();
    expect(useChatStore.getState().conversations.length).toBeGreaterThan(0);
    expect(useChatStore.getState().loaded).toBe(true);
  });

  it('发送消息后更新消息列表和会话', async () => {
    await initializeDatabase();
    await useChatStore.getState().loadChats();
    const conversation = useChatStore.getState().conversations[0];

    await useChatStore.getState().sendMessage(conversation.id, '测试消息');

    const messages = useChatStore.getState().messages[conversation.id];
    expect(messages.some((m) => m.content === '测试消息')).toBe(true);
    expect(messages[messages.length - 1].senderId).toBe('me');

    const updatedConversation = useChatStore.getState().conversations.find((c) => c.id === conversation.id);
    expect(updatedConversation?.lastMessageId).toBe(messages[messages.length - 1].id);
  });

  it('标记会话已读清零未读数', async () => {
    await initializeDatabase();
    await useChatStore.getState().loadChats();
    const conversation = useChatStore.getState().conversations.find((c) => c.unreadCount > 0);
    if (!conversation) return;

    await useChatStore.getState().markConversationRead(conversation.id);
    expect(useChatStore.getState().conversations.find((c) => c.id === conversation.id)?.unreadCount).toBe(0);
  });
});
