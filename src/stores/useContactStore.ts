import { create } from 'zustand';
import type { Contact, Me } from '../types';
import { db } from '../db/database';
import { pinyin } from 'pinyin-pro';

interface ContactState {
  me: Me | null;
  contacts: Contact[];
  loaded: boolean;
  searchKeyword: string;
  loadContacts: () => Promise<void>;
  setSearchKeyword: (keyword: string) => void;
}

// 判断联系人是否匹配搜索关键词：支持中文包含、拼音首字母、全拼
function contactMatches(contact: Contact, keyword: string): boolean {
  if (!keyword) return true;
  const lowerKeyword = keyword.toLowerCase();
  const name = contact.name;

  if (name.includes(keyword)) return true;

  const firstLetters = pinyin(name, { pattern: 'first', toneType: 'none', type: 'string' });
  if (firstLetters.toLowerCase().includes(lowerKeyword)) return true;

  const fullPinyin = pinyin(name, { toneType: 'none', type: 'string' });
  if (fullPinyin.toLowerCase().includes(lowerKeyword)) return true;

  return false;
}

// 联系人状态：从 IndexedDB 加载当前用户与联系人列表，支持搜索
export const useContactStore = create<ContactState>((set, get) => ({
  me: null,
  contacts: [],
  loaded: false,
  searchKeyword: '',

  loadContacts: async () => {
    const me = await db.me.get('me');
    const contacts = await db.contacts.toArray();
    set({ me: me ?? null, contacts, loaded: true });
  },

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
}));

// 按搜索关键词过滤后的联系人列表
export function selectFilteredContacts(state: ContactState): Contact[] {
  const keyword = state.searchKeyword.trim();
  if (!keyword) return state.contacts;
  return state.contacts.filter((contact) => contactMatches(contact, keyword));
}
