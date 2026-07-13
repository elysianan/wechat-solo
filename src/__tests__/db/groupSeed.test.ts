import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import {
  seedMe,
  seedContacts,
  seedConversations,
  seedMessages,
  seedMoments,
} from '../../data/seed';

describe('群聊种子与幂等补种', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('全新初始化包含 2 个群会话、群消息与 4 个预置标签', async () => {
    await initializeDatabase();

    const groups = await db.conversations.filter((c) => c.type === 'group').toArray();
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.name).sort()).toEqual(['产品研发群', '幸福一家人']);

    const family = groups.find((g) => g.name === '幸福一家人')!;
    expect(family.memberIds).toEqual(['mom']);

    const groupMessages = await db.messages
      .filter((m) => m.conversationId.startsWith('conv-group-'))
      .toArray();
    expect(groupMessages.length).toBeGreaterThan(0);
    expect(family.lastMessageId).not.toBe('');

    const tags = await db.tags.toArray();
    expect(tags.map((t) => t.name).sort()).toEqual(['同事', '家人', '房东', '朋友']);
  });

  it('人设包含群内回复概率 groupReplyChance', async () => {
    await initializeDatabase();
    const contacts = await db.contacts.toArray();
    const chanceOf = (id: string) =>
      contacts.find((c) => c.id === id)?.persona.behavior.groupReplyChance;

    expect(chanceOf('buddy')).toBe(0.85);
    expect(chanceOf('mom')).toBe(0.7);
    expect(chanceOf('lisa')).toBe(0.25);
    expect(chanceOf('boss')).toBe(0.15);
  });

  it('重复初始化幂等：群与标签不重复插入', async () => {
    await initializeDatabase();
    await initializeDatabase();

    const groups = await db.conversations.filter((c) => c.type === 'group').toArray();
    expect(groups).toHaveLength(2);
    expect(await db.tags.count()).toBe(4);
  });

  it('旧数据升级：仅有单聊数据时补种群与标签，已有数据不动', async () => {
    // 模拟 Sprint 4 时代的旧数据库：无群会话、无 tags 表数据
    await db.transaction(
      'rw',
      [db.me, db.contacts, db.conversations, db.messages, db.moments, db.settings],
      async () => {
        await db.me.add(seedMe);
        await db.contacts.bulkAdd(seedContacts);
        await db.conversations.bulkAdd(seedConversations);
        await db.messages.bulkAdd(seedMessages);
        await db.moments.bulkAdd(seedMoments);
        await db.settings.add({
          id: 'app',
          darkMode: false,
          soundEnabled: true,
          vibrationEnabled: true,
          version: '1.4.0-Sprint4',
        });
      }
    );

    await initializeDatabase();

    // 补种群数据
    const groups = await db.conversations.filter((c) => c.type === 'group').toArray();
    expect(groups).toHaveLength(2);
    expect(await db.tags.count()).toBe(4);

    // 旧单聊会话与消息保持不变
    const singles = await db.conversations.filter((c) => c.type === 'single').toArray();
    expect(singles).toHaveLength(5);
    const singleMessages = await db.messages
      .filter((m) => !m.conversationId.startsWith('conv-group-'))
      .toArray();
    expect(singleMessages).toHaveLength(seedMessages.length);
  });
});
