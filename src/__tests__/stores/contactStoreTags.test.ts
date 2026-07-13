import { describe, it, expect, beforeEach } from 'vitest';
import { useContactStore, selectTagCounts } from '../../stores/useContactStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('useContactStore 标签管理', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useContactStore.setState({ me: null, contacts: [], tags: [], loaded: false, searchKeyword: '' });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useContactStore.getState().loadTags();
  });

  it('加载 4 个预置标签', () => {
    const names = useContactStore.getState().tags.map((t) => t.name);
    expect(names).toEqual(['家人', '同事', '朋友', '房东']);
  });

  it('标签成员计数聚合', () => {
    const counts = selectTagCounts(
      useContactStore.getState().tags,
      useContactStore.getState().contacts
    );
    const countOf = (name: string) => counts.find((c) => c.name === name)?.count;
    expect(countOf('家人')).toBe(1);
    expect(countOf('同事')).toBe(2);
    expect(countOf('朋友')).toBe(1);
    expect(countOf('房东')).toBe(1);
  });

  it('新建标签写入 tags 表；空标签允许存在', async () => {
    const ok = await useContactStore.getState().createTag('闺蜜');
    expect(ok).toBe(true);
    expect(useContactStore.getState().tags.some((t) => t.name === '闺蜜')).toBe(true);

    const saved = await db.tags.where('name').equals('闺蜜').first();
    expect(saved).toBeTruthy();
    // 空标签计数为 0
    const counts = selectTagCounts(
      useContactStore.getState().tags,
      useContactStore.getState().contacts
    );
    expect(counts.find((c) => c.name === '闺蜜')?.count).toBe(0);
  });

  it('重名标签被拒绝', async () => {
    const before = useContactStore.getState().tags.length;
    const ok = await useContactStore.getState().createTag('家人');
    expect(ok).toBe(false);
    expect(useContactStore.getState().tags.length).toBe(before);
  });

  it('setContactTags 覆盖更新联系人标签并持久化', async () => {
    await useContactStore.getState().setContactTags('mom', ['家人', '闺蜜']);
    expect(useContactStore.getState().contacts.find((c) => c.id === 'mom')?.tags).toEqual([
      '家人',
      '闺蜜',
    ]);

    const saved = await db.contacts.get('mom');
    expect(saved?.tags).toEqual(['家人', '闺蜜']);
  });

  it('重命名标签：tags 表与所有联系人同步更新', async () => {
    const ok = await useContactStore.getState().renameTag('同事', '工作伙伴');
    expect(ok).toBe(true);
    expect(useContactStore.getState().tags.some((t) => t.name === '工作伙伴')).toBe(true);
    expect(useContactStore.getState().tags.some((t) => t.name === '同事')).toBe(false);

    const boss = useContactStore.getState().contacts.find((c) => c.id === 'boss')!;
    expect(boss.tags).toContain('工作伙伴');
    expect(boss.tags).not.toContain('同事');

    const saved = await db.contacts.get('lisa');
    expect(saved?.tags).toContain('工作伙伴');
  });

  it('重命名为已存在的标签被拒绝', async () => {
    const ok = await useContactStore.getState().renameTag('同事', '家人');
    expect(ok).toBe(false);
    expect(useContactStore.getState().tags.some((t) => t.name === '同事')).toBe(true);
  });

  it('删除标签：tags 表移除且所有联系人 tags 清理', async () => {
    await useContactStore.getState().deleteTag('房东');
    expect(useContactStore.getState().tags.some((t) => t.name === '房东')).toBe(false);

    const landlord = useContactStore.getState().contacts.find((c) => c.id === 'landlord')!;
    expect(landlord.tags).not.toContain('房东');

    const saved = await db.contacts.get('landlord');
    expect(saved?.tags).not.toContain('房东');
  });
});
