import { create } from 'zustand';
import type { Contact, Me } from '../types';
import { db } from '../db/database';

interface ContactState {
  me: Me | null;
  contacts: Contact[];
  loaded: boolean;
  loadContacts: () => Promise<void>;
}

// 联系人状态：从 IndexedDB 加载当前用户与联系人列表
export const useContactStore = create<ContactState>((set) => ({
  me: null,
  contacts: [],
  loaded: false,
  loadContacts: async () => {
    const me = await db.me.get('me');
    const contacts = await db.contacts.toArray();
    set({ me: me ?? null, contacts, loaded: true });
  },
}));
