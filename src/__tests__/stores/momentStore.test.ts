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

    expect(useMomentStore.getState().moments).toHaveLength(6);
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

  it('点赞持久化：重置 store 后重新加载，likes 仍然存在', async () => {
    await initializeDatabase();
    await useMomentStore.getState().loadMoments();
    const momentId = useMomentStore.getState().moments[0].id;

    await useMomentStore.getState().toggleLike(momentId);
    expect(useMomentStore.getState().moments[0].likes.some((l) => l.contactId === 'me')).toBe(true);

    useMomentStore.setState({ moments: [], loaded: false });
    await useMomentStore.getState().loadMoments();

    expect(useMomentStore.getState().moments[0].likes.some((l) => l.contactId === 'me')).toBe(true);
  });

  it('评论后 comments 追加', async () => {
    await initializeDatabase();
    await useMomentStore.getState().loadMoments();
    const momentId = useMomentStore.getState().moments[0].id;
    // 注意：seed 动态 id 含随机后缀，toArray 排序后 moments[0] 可能自带评论，用基线断言
    const initialCount = useMomentStore.getState().moments[0].comments.length;

    await useMomentStore.getState().addComment(momentId, '测试评论');
    const comments = useMomentStore.getState().moments[0].comments;
    expect(comments).toHaveLength(initialCount + 1);
    expect(comments[comments.length - 1].content).toBe('测试评论');
    expect(comments[comments.length - 1].contactId).toBe('me');
  });

  it('评论持久化：重置 store 后重新加载，comments 仍然存在', async () => {
    await initializeDatabase();
    await useMomentStore.getState().loadMoments();
    const momentId = useMomentStore.getState().moments[0].id;
    const initialCount = useMomentStore.getState().moments[0].comments.length;

    await useMomentStore.getState().addComment(momentId, '持久化测试评论');
    expect(useMomentStore.getState().moments[0].comments).toHaveLength(initialCount + 1);

    useMomentStore.setState({ moments: [], loaded: false });
    await useMomentStore.getState().loadMoments();

    const comments = useMomentStore.getState().moments[0].comments;
    expect(comments).toHaveLength(initialCount + 1);
    expect(comments.some((c) => c.content === '持久化测试评论')).toBe(true);
  });

  it('删除评论后 comments 移除该条', async () => {
    await initializeDatabase();
    await useMomentStore.getState().loadMoments();
    const momentId = useMomentStore.getState().moments[0].id;
    const initialCount = useMomentStore.getState().moments[0].comments.length;

    await useMomentStore.getState().addComment(momentId, '待删除评论');
    const added = useMomentStore
      .getState()
      .moments[0].comments.find((c) => c.content === '待删除评论')!;

    await useMomentStore.getState().deleteComment(momentId, added.id);
    const comments = useMomentStore.getState().moments[0].comments;
    expect(comments).toHaveLength(initialCount);
    expect(comments.some((c) => c.content === '待删除评论')).toBe(false);
  });

  it('删除评论持久化：重置 store 重新加载后评论不恢复', async () => {
    await initializeDatabase();
    await useMomentStore.getState().loadMoments();
    const momentId = useMomentStore.getState().moments[0].id;
    const initialCount = useMomentStore.getState().moments[0].comments.length;

    await useMomentStore.getState().addComment(momentId, '待删除评论');
    const added = useMomentStore
      .getState()
      .moments[0].comments.find((c) => c.content === '待删除评论')!;
    await useMomentStore.getState().deleteComment(momentId, added.id);

    useMomentStore.setState({ moments: [], loaded: false });
    await useMomentStore.getState().loadMoments();

    const comments = useMomentStore.getState().moments[0].comments;
    expect(comments).toHaveLength(initialCount);
    expect(comments.some((c) => c.content === '待删除评论')).toBe(false);
  });

  it('删除不存在的评论不影响其他评论', async () => {
    await initializeDatabase();
    await useMomentStore.getState().loadMoments();
    const momentId = useMomentStore.getState().moments[0].id;
    const initialCount = useMomentStore.getState().moments[0].comments.length;

    await useMomentStore.getState().addComment(momentId, '保留评论');
    await useMomentStore.getState().deleteComment(momentId, 'comment-not-exist');

    expect(useMomentStore.getState().moments[0].comments).toHaveLength(initialCount + 1);
  });
});
