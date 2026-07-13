import { db } from './database';
import {
  seedMe,
  seedContacts,
  seedConversations,
  seedMessages,
  seedMoments,
  seedGroupConversations,
  seedGroupMessages,
  seedTags,
} from '../data/seed';

export async function initializeDatabase(): Promise<void> {
  const contactCount = await db.contacts.count();

  if (contactCount === 0) {
    // 全新初始化：一次性写入全部种子数据
    await db.transaction(
      'rw',
      [db.me, db.contacts, db.conversations, db.messages, db.moments, db.settings, db.tags],
      async () => {
        await db.me.add(seedMe);
        await db.contacts.bulkAdd(seedContacts);
        await db.conversations.bulkAdd([...seedConversations, ...seedGroupConversations]);
        await db.messages.bulkAdd([...seedMessages, ...seedGroupMessages]);
        await db.moments.bulkAdd(seedMoments);
        await db.settings.add({
          id: 'app',
          darkMode: false,
          soundEnabled: true,
          vibrationEnabled: true,
          version: '1.5.0-Sprint5',
        });
        await db.tags.bulkAdd(seedTags);
      }
    );
    return;
  }

  // 幂等补种：老数据升级时追加群聊与标签，不触碰已有数据
  const groupCount = await db.conversations.filter((c) => c.type === 'group').count();
  if (groupCount === 0) {
    await db.transaction('rw', [db.conversations, db.messages], async () => {
      await db.conversations.bulkAdd(seedGroupConversations);
      await db.messages.bulkAdd(seedGroupMessages);
    });
  }

  const tagCount = await db.tags.count();
  if (tagCount === 0) {
    await db.tags.bulkAdd(seedTags);
  }
}
