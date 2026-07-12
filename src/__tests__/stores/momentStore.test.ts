import { describe, it, expect, beforeEach } from 'vitest';
import { useMomentStore } from '../../stores/useMomentStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('useMomentStore', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useMomentStore.setState({ moments: [], loaded: false });
  });

  it('从数据库加载朋友圈动态', async () => {
    await initializeDatabase();
    await useMomentStore.getState().loadMoments();

    expect(useMomentStore.getState().moments).toHaveLength(3);
    expect(useMomentStore.getState().loaded).toBe(true);
  });

  it('点赞后 likes 包含 me，再点取消', async () => {
    await initializeDatabase();
    await useMomentStore.getState().loadMoments();
    const momentId = useMomentStore.getState().moments[0].id;

    await useMomentStore.getState().toggleLike(momentId);
    expect(useMomentStore.getState().moments[0].likes.some((l) => l.contactId === 'me')).toBe(true);

    await useMomentStore.getState().toggleLike(momentId);
    expect(useMomentStore.getState().moments[0].likes.some((l) => l.contactId === 'me')).toBe(false);
  });

  it('评论后 comments 追加', async () => {
    await initializeDatabase();
    await useMomentStore.getState().loadMoments();
    const momentId = useMomentStore.getState().moments[0].id;

    await useMomentStore.getState().addComment(momentId, '测试评论');
    const comments = useMomentStore.getState().moments[0].comments;
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe('测试评论');
    expect(comments[0].contactId).toBe('me');
  });
});
