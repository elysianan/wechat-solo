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

  it('从数据库加载会话和消息', async () => {
    await initializeDatabase();
    await useChatStore.getState().loadChats();

    const { conversations, messages, loaded } = useChatStore.getState();
    expect(loaded).toBe(true);
    expect(conversations).toHaveLength(5);

    // 每个会话都有对应的两条消息，并按 createdAt 升序排列
    for (const conversation of conversations) {
      const conversationMessages = messages[conversation.id];
      expect(conversationMessages).toHaveLength(2);
      expect(conversationMessages[0].createdAt).toBeLessThanOrEqual(
        conversationMessages[1].createdAt,
      );
    }
  });
});
