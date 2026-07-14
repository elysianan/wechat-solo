import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MomentCard } from '../../../components/moments/MomentCard';
import { useContactStore } from '../../../stores/useContactStore';
import { db } from '../../../db/database';
import { initializeDatabase } from '../../../db/init';
import type { Moment } from '../../../types';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await initializeDatabase();
  await useContactStore.getState().loadContacts();
});

function renderWithProviders(moment: Moment, props?: { onCommentClick?: () => void; onImageClick?: () => void }) {
  return render(
    <MomentCard
      moment={moment}
      onCommentClick={props?.onCommentClick ?? vi.fn()}
      onImageClick={props?.onImageClick ?? vi.fn()}
    />
  );
}

describe('MomentCard', () => {
  it('renders author name and content', () => {
    const moment: Moment = {
      id: 'm1',
      authorId: 'mom',
      content: '今天天气不错',
      images: [],
      createdAt: Date.now(),
      likes: [],
      comments: [],
    };
    renderWithProviders(moment);

    expect(screen.getByText('王阿姨')).toBeInTheDocument();
    expect(screen.getByText('今天天气不错')).toBeInTheDocument();
  });

  it('shows like bounce animation when liked', async () => {
    const moment: Moment = {
      id: 'm1',
      authorId: 'mom',
      content: '测试',
      images: [],
      createdAt: Date.now(),
      likes: [],
      comments: [],
    };

    renderWithProviders(moment);

    const likeButton = screen.getByTestId('moment-like-button');
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(likeButton.querySelector('svg')).toHaveClass('animate-like-bounce');
    });
  });

  it('calls onImageClick when comment button clicked', () => {
    const onCommentClick = vi.fn();
    const moment: Moment = {
      id: 'm1',
      authorId: 'mom',
      content: '测试',
      images: [],
      createdAt: Date.now(),
      likes: [],
      comments: [],
    };

    renderWithProviders(moment, { onCommentClick });

    fireEvent.click(screen.getByTestId('moment-comment-button'));
    expect(onCommentClick).toHaveBeenCalledWith('m1');
  });

  it('calls onImageClick when image clicked', () => {
    const onImageClick = vi.fn();
    const moment: Moment = {
      id: 'm1',
      authorId: 'mom',
      content: '测试',
      images: ['data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjBBNUZBIi8+PC9zdmc+'],
      createdAt: Date.now(),
      likes: [],
      comments: [],
    };

    renderWithProviders(moment, { onImageClick });

    fireEvent.click(screen.getByTestId('moment-image-0'));
    expect(onImageClick).toHaveBeenCalledWith('m1', 0);
  });
});
