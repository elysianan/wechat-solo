import { db } from './database';
import {
  seedMe,
  seedContacts,
  seedConversations,
  seedMessages,
  seedMoments,
} from '../data/seed';

export async function initializeDatabase(): Promise<void> {
  const contactCount = await db.contacts.count();

  if (contactCount > 0) {
    // 已经有数据，跳过初始化
    return;
  }

  await db.transaction(
    'rw',
    [db.me, db.contacts, db.conversations, db.messages, db.moments, db.settings],
    async () => {
      await db.me.add(seedMe);
      await db.contacts.bulkAdd(seedContacts);
      await db.conversations.bulkAdd(seedConversations);
      await db.messages.bulkAdd(seedMessages);
      await db.moments.bulkAdd(seedMoments);
      await db.settings.add({
        id: 'app',
        darkMode: false,
        soundEnabled: true,
        vibrationEnabled: true,
        version: '1.4.0-Sprint4',
      });
    }
  );
}
