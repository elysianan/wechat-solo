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

  it('updateMe 写库并刷新内存态，重新加载后保留', async () => {
    await initializeDatabase();
    await useContactStore.getState().loadContacts();

    await useContactStore.getState().updateMe({ nickname: '改名后的我', region: '中国 北京' });
    expect(useContactStore.getState().me?.nickname).toBe('改名后的我');
    expect(useContactStore.getState().me?.region).toBe('中国 北京');

    // 重置内存态后重新加载，验证持久化
    useContactStore.setState({ me: null, loaded: false });
    await useContactStore.getState().loadContacts();
    expect(useContactStore.getState().me?.nickname).toBe('改名后的我');
  });
});
