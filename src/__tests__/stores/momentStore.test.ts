import { describe, it, expect, beforeEach } from 'vitest';
import { useMomentStore } from '../../stores/useMomentStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('useMomentStore', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useMomentStore.setState({ moments: [], loaded: false });
  });

  it('从数据库加载朋友圈动态', async () => {
    await initializeDatabase();
    await useMomentStore.getState().loadMoments();

    expect(useMomentStore.getState().moments).toHaveLength(3);
    expect(useMomentStore.getState().loaded).toBe(true);
  });
});
