import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MomentCard } from '../../../components/moments/MomentCard';
import { useContactStore } from '../../../stores/useContactStore';
import { useMomentStore } from '../../../stores/useMomentStore';
import { db } from '../../../db/database';
import { initializeDatabase } from '../../../db/init';
import type { Moment } from '../../../types';

// 构造一条含「我的评论 + 他人评论」的朋友圈动态
function buildMoment(): Moment {
  return {
    id: 'moment-test',
    authorId: 'mom',
    content: '测试动态',
    images: [],
    createdAt: 1700000000000,
    likes: [],
    comments: [
      { id: 'comment-mine', contactId: 'me', content: '我的评论', createdAt: 1700000001000 },
      { id: 'comment-other', contactId: 'buddy', content: '别人的评论', createdAt: 1700000002000 },
    ],
  };
}

// 包装组件：模拟 MomentsPage 订阅 store 后传入 moment 的真实用法
function MomentCardWrapper() {
  const moment = useMomentStore((state) =>
    state.moments.find((m) => m.id === 'moment-test')
  );
  if (!moment) return null;
  return <MomentCard moment={moment} onCommentClick={() => {}} />;
}

describe('MomentCard 评论删除', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useMomentStore.getState().loadMoments();
    // 用测试动态替换 store 中的第一条，保证 UI 与 store 数据一致
    const testMoment = buildMoment();
    await db.moments.put(testMoment);
    useMomentStore.setState({
      moments: [testMoment, ...useMomentStore.getState().moments.filter((m) => m.id !== testMoment.id)],
    });
  });

  it('点击自己的评论出现删除按钮，点击后评论移除', async () => {
    render(<MomentCardWrapper />);

    fireEvent.click(screen.getByTestId('moment-comment-comment-mine'));
    fireEvent.click(screen.getByTestId('comment-delete-button'));

    await waitFor(() => {
      expect(screen.queryByText(/我的评论/)).not.toBeInTheDocument();
    });
    // 他人评论不受影响
    expect(screen.getByText(/别人的评论/)).toBeInTheDocument();
  });

  it('删除持久化：store 中评论也被移除', async () => {
    render(<MomentCardWrapper />);

    fireEvent.click(screen.getByTestId('moment-comment-comment-mine'));
    fireEvent.click(screen.getByTestId('comment-delete-button'));

    await waitFor(async () => {
      const saved = await db.moments.get('moment-test');
      expect(saved?.comments.some((c) => c.id === 'comment-mine')).toBe(false);
    });
  });

  it('点击别人的评论不出现删除按钮', () => {
    render(<MomentCardWrapper />);

    fireEvent.click(screen.getByTestId('moment-comment-comment-other'));
    expect(screen.queryByTestId('comment-delete-button')).not.toBeInTheDocument();
  });
});
