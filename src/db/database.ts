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
    // v3：消息类型拆分为 discriminated union，迁移旧消息确保 type 字段
    this.version(3).stores({
      me: 'id',
      contacts: 'id',
      conversations: 'id, updatedAt',
      messages: 'id, conversationId, createdAt',
      moments: 'id, createdAt',
      settings: 'id',
      tags: 'id, name',
    }).upgrade((tx) => {
      return tx.table('messages').toCollection().modify((msg: Record<string, unknown>) => {
        if (!msg.type) {
          msg.type = 'text';
        }
        if (msg.type === 'text' && typeof msg.content !== 'string') {
          msg.content = String(msg.content ?? '');
        }
      });
    });
    // v4：Sprint10 新消息类型字段迁移
    this.version(4).stores({
      me: 'id',
      contacts: 'id',
      conversations: 'id, updatedAt',
      messages: 'id, conversationId, createdAt',
      moments: 'id, createdAt',
      settings: 'id',
      tags: 'id, name',
    }).upgrade((tx) => {
      return tx.table('messages').toCollection().modify((msg: Record<string, unknown>) => {
        // Sprint7 旧 transfer/location 结构迁移到 Sprint10 结构
        if (msg.type === 'transfer') {
          if (!msg.transferStatus) msg.transferStatus = 'pending';
          if (!msg.transferCreatedAt) msg.transferCreatedAt = msg.createdAt ?? Date.now();
        }
        if (msg.type === 'location') {
          if (!msg.name) msg.name = msg.address || '未知位置';
        }
      });
    });
  }
}

export const db = new WeChatSoloDB();
