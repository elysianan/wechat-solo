import { describe, it, expect, beforeEach } from 'vitest';
import { useContactStore, selectFilteredContacts } from '../../stores/useContactStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('useContactStore', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useContactStore.setState({ me: null, contacts: [], loaded: false, searchKeyword: '' });
  });

  it('从数据库加载联系人', async () => {
    await initializeDatabase();
    await useContactStore.getState().loadContacts();

    expect(useContactStore.getState().contacts).toHaveLength(5);
    expect(useContactStore.getState().loaded).toBe(true);
    expect(useContactStore.getState().me).not.toBeNull();
  });

  it('搜索中文名字', async () => {
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    useContactStore.setState({ searchKeyword: '王' });
    const filtered = selectFilteredContacts(useContactStore.getState());
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('王阿姨');
  });

  it('搜索拼音首字母', async () => {
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    useContactStore.setState({ searchKeyword: 'wa' });
    const filtered = selectFilteredContacts(useContactStore.getState());
    expect(filtered.some((c) => c.name === '王阿姨')).toBe(true);
  });
});
