import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MomentsPage } from '../../pages/MomentsPage';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { useContactStore } from '../../stores/useContactStore';
import { useMomentStore } from '../../stores/useMomentStore';
import { useAppStore } from '../../stores/useAppStore';

describe('朋友圈页面', () => {
  // 每个测试前重置数据库与 store，加载联系人、朋友圈初始数据
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useContactStore.setState({ me: null, contacts: [], loaded: false, searchKeyword: '' });
    useMomentStore.setState({ moments: [], loaded: false });
    useAppStore.setState({ currentTab: 'discover', pageStack: [{ type: 'tabs' }, { type: 'moments' }] });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useMomentStore.getState().loadMoments();
  });

  it('渲染朋友圈动态', async () => {
    render(<MomentsPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('moment-card').length).toBeGreaterThan(0);
    });
  });

  it('点赞后显示红心', async () => {
    render(<MomentsPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('moment-like-button')[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('moment-like-button')[0]);
    await waitFor(() => {
      expect(screen.getAllByTestId('moment-likes')[0]).toHaveTextContent('我');
    });
  });

  it('评论后显示评论内容', async () => {
    render(<MomentsPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('moment-comment-button')[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('moment-comment-button')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('bottom-input-sheet')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId('bottom-input'), { target: { value: '测试评论' } });
    fireEvent.click(screen.getByTestId('bottom-input-submit'));
    await waitFor(() => {
      // 评论文本与评论者名称一起渲染，使用包含匹配
      expect(screen.getByText((content) => content.includes('测试评论'))).toBeInTheDocument();
    });
  });

  it('点击图片打开 Lightbox', async () => {
    render(<MomentsPage />);
    await waitFor(() => {
      expect(screen.queryAllByTestId(/^moment-image-\d+$/).length).toBeGreaterThan(0);
    });

    const firstImage = screen.queryAllByTestId(/^moment-image-\d+$/)[0];
    fireEvent.click(firstImage);

    expect(await screen.findByTestId('image-lightbox')).toBeInTheDocument();
  });
});
