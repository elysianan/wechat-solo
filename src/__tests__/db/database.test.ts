import { describe, it, expect, beforeEach } from 'vitest';
import Dexie from 'dexie';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('WeChatSoloDB', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('initializes with seed data on first launch', async () => {
    await initializeDatabase();
    const contacts = await db.contacts.toArray();
    const messages = await db.messages.toArray();
    const moments = await db.moments.toArray();

    expect(contacts).toHaveLength(5);
    expect(messages.length).toBeGreaterThan(0);
    expect(moments.length).toBeGreaterThan(0);
  });

  it('does not duplicate seed data on subsequent launches', async () => {
    await initializeDatabase();
    await initializeDatabase();
    const contacts = await db.contacts.toArray();

    expect(contacts).toHaveLength(5);
  });

  it('migrates old transfer messages to v4 schema', async () => {
    const dbName = 'MigrationTestDB';
    await Dexie.delete(dbName);

    // 用 v3 数据库写入旧版 transfer/location 消息
    const oldDb = new Dexie(dbName);
    oldDb.version(3).stores({
      messages: 'id, conversationId, createdAt',
    });
    const now = Date.now();
    await oldDb.table('messages').bulkPut([
      {
        id: 'old-transfer',
        conversationId: 'conv-landlord',
        senderId: 'me',
        type: 'transfer',
        amount: 1000,
        createdAt: now,
        status: 'read',
      },
      {
        id: 'old-location',
        conversationId: 'conv-buddy',
        senderId: 'buddy',
        type: 'location',
        address: '某个地址',
        createdAt: now,
        status: 'read',
      },
    ]);
    await oldDb.close();

    // 用当前 WeChatSoloDB 打开，触发 v4 迁移
    const migratedDb = new (await import('../../db/database')).WeChatSoloDB();
    migratedDb.name = dbName;
    await migratedDb.open();

    const transfer = await migratedDb.messages.get('old-transfer');
    const location = await migratedDb.messages.get('old-location');

    expect(transfer?.transferStatus).toBe('pending');
    expect(typeof transfer?.transferCreatedAt).toBe('number');
    expect(location?.name).toBe('某个地址');

    await migratedDb.delete();
  });
});
