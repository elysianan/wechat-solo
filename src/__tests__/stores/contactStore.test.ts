import { describe, it, expect, beforeEach } from 'vitest';
import { useContactStore } from '../../stores/useContactStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('useContactStore', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useContactStore.setState({ me: null, contacts: [], loaded: false });
  });

  it('从数据库加载联系人', async () => {
    await initializeDatabase();
    await useContactStore.getState().loadContacts();

    expect(useContactStore.getState().contacts).toHaveLength(5);
    expect(useContactStore.getState().loaded).toBe(true);
    expect(useContactStore.getState().me).not.toBeNull();
  });
});
