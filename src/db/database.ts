import Dexie, { type Table } from 'dexie';
import type { Contact, Conversation, Message, Moment, AppSettings, Me } from '../types';

export class WeChatSoloDB extends Dexie {
  me!: Table<Me>;
  contacts!: Table<Contact>;
  conversations!: Table<Conversation>;
  messages!: Table<Message>;
  moments!: Table<Moment>;
  settings!: Table<AppSettings & { id: string }>;

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
  }
}

export const db = new WeChatSoloDB();
