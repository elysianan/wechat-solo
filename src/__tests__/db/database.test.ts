import { describe, it, expect, beforeEach } from 'vitest';
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
});
