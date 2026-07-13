import { create } from 'zustand';
import type { Contact, Me, Tag } from '../types';
import { db } from '../db/database';
import { pinyin } from 'pinyin-pro';
import { makeId } from '../utils/id';

interface ContactState {
  me: Me | null;
  contacts: Contact[];
  tags: Tag[];
  loaded: boolean;
  searchKeyword: string;
  loadContacts: () => Promise<void>;
  loadTags: () => Promise<void>;
  updateMe: (patch: Partial<Omit<Me, 'id'>>) => Promise<void>;
  createTag: (name: string) => Promise<boolean>;
  setContactTags: (contactId: string, tags: string[]) => Promise<void>;
  renameTag: (oldName: string, newName: string) => Promise<boolean>;
  deleteTag: (name: string) => Promise<void>;
  setSearchKeyword: (keyword: string) => void;
}

// 判断联系人是否匹配搜索关键词：支持中文包含、拼音首字母、全拼
function contactMatches(contact: Contact, keyword: string): boolean {
  if (!keyword) return true;
  const lowerKeyword = keyword.toLowerCase();
  const name = contact.name;

  if (name.toLowerCase().includes(lowerKeyword)) return true;

  const firstLetters = pinyin(name, { pattern: 'first', toneType: 'none', type: 'string' });
  if (firstLetters.toLowerCase().includes(lowerKeyword)) return true;

  const fullPinyin = pinyin(name, { toneType: 'none', type: 'string' });
  if (fullPinyin.toLowerCase().includes(lowerKeyword)) return true;

  return false;
}

// 联系人状态：从 IndexedDB 加载当前用户与联系人列表，支持搜索与标签管理
export const useContactStore = create<ContactState>((set) => ({
  me: null,
  contacts: [],
  tags: [],
  loaded: false,
  searchKeyword: '',

  loadContacts: async () => {
    const me = await db.me.get('me');
    const contacts = await db.contacts.toArray();
    set({ me: me ?? null, contacts, loaded: true });
  },

  loadTags: async () => {
    // 按创建时间排序：toArray 默认按主键排序会打乱定义顺序
    const tags = (await db.tags.toArray()).sort((a, b) => a.createdAt - b.createdAt);
    set({ tags });
  },

  // 更新当前用户信息：写库并同步内存态
  updateMe: async (patch) => {
    await db.me.update('me', patch);
    set((state) => ({ me: state.me ? { ...state.me, ...patch } : state.me }));
  },

  // 新建标签：重名（去空白后）拒绝；空标签允许存在
  createTag: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    const existing = await db.tags.where('name').equals(trimmed).first();
    if (existing) return false;

    const tag: Tag = { id: makeId('tag'), name: trimmed, createdAt: Date.now() };
    await db.tags.add(tag);
    set((state) => ({ tags: [...state.tags, tag] }));
    return true;
  },

  // 覆盖式更新单个联系人的标签
  setContactTags: async (contactId, tags) => {
    await db.contacts.update(contactId, { tags });
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === contactId ? { ...c, tags } : c)),
    }));
  },

  // 重命名标签：tags 表与所有联系人的 tags 同步替换
  renameTag: async (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return false;

    const duplicate = await db.tags.where('name').equals(trimmed).first();
    if (duplicate) return false;

    await db.transaction('rw', [db.tags, db.contacts], async () => {
      await db.tags.where('name').equals(oldName).modify((tag) => {
        tag.name = trimmed;
      });
      await db.contacts
        .filter((c) => c.tags.includes(oldName))
        .modify((contact) => {
          contact.tags = contact.tags.map((t) => (t === oldName ? trimmed : t));
        });
    });

    set((state) => ({
      tags: state.tags.map((t) => (t.name === oldName ? { ...t, name: trimmed } : t)),
      contacts: state.contacts.map((c) =>
        c.tags.includes(oldName)
          ? { ...c, tags: c.tags.map((t) => (t === oldName ? trimmed : t)) }
          : c
      ),
    }));
    return true;
  },

  // 删除标签：tags 表移除 + 所有联系人 tags 清理
  deleteTag: async (name) => {
    await db.transaction('rw', [db.tags, db.contacts], async () => {
      await db.tags.where('name').equals(name).delete();
      await db.contacts
        .filter((c) => c.tags.includes(name))
        .modify((contact) => {
          contact.tags = contact.tags.filter((t) => t !== name);
        });
    });

    set((state) => ({
      tags: state.tags.filter((t) => t.name !== name),
      contacts: state.contacts.map((c) =>
        c.tags.includes(name) ? { ...c, tags: c.tags.filter((t) => t !== name) } : c
      ),
    }));
  },

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
}));

// 按搜索关键词过滤后的联系人列表
export function selectFilteredContacts(
  state: Pick<ContactState, 'contacts' | 'searchKeyword'>
): Contact[] {
  const keyword = state.searchKeyword.trim();
  if (!keyword) return state.contacts;
  return state.contacts.filter((contact) => contactMatches(contact, keyword));
}

// 标签成员计数聚合：保持 tags 表顺序，空标签计数为 0
export function selectTagCounts(tags: Tag[], contacts: Contact[]): Array<{ name: string; count: number }> {
  return tags.map((tag) => ({
    name: tag.name,
    count: contacts.filter((c) => c.tags.includes(tag.name)).length,
  }));
}
