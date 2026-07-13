import Dexie, { type Table } from 'dexie';
import type { Contact, Conversation, Message, Moment, AppSettings, Me, Tag } from '../types';

export class WeChatSoloDB extends Dexie {
  me!: Table<Me>;
  contacts!: Table<Contact>;
  conversations!: Table<Conversation>;
  messages!: Table<Message>;
  moments!: Table<Moment>;
  settings!: Table<AppSettings & { id: string }>;
  tags!: Table<Tag>;

  constructor() {
    super('WeChatSoloDB');
    this.version(1).stores({
      me: 'id',
      contacts: 'id',
      conversations: 'id, updatedAt',
      messages: 'id, conversationId, createdAt',
      moments: 'id, createdAt',
      settings: 'id',
    });
    // v2：新增联系人标签表（允许空标签）
    this.version(2).stores({
      tags: 'id, name',
    });
  }
}

export const db = new WeChatSoloDB();
