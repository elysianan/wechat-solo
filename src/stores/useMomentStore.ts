import { create } from 'zustand';
import type { Moment } from '../types';
import { db } from '../db/database';
import { makeId } from '../utils/id';

interface MomentState {
  moments: Moment[];
  loaded: boolean;
  loadMoments: () => Promise<void>;
  toggleLike: (momentId: string) => Promise<void>;
  addComment: (momentId: string, content: string) => Promise<void>;
}

// 朋友圈状态：加载动态、点赞、评论
export const useMomentStore = create<MomentState>((set) => ({
  moments: [],
  loaded: false,

  loadMoments: async () => {
    const moments = await db.moments.toArray();
    set({ moments, loaded: true });
  },

  toggleLike: async (momentId) => {
    const moment = await db.moments.get(momentId);
    if (!moment) return;

    const hasLiked = moment.likes.some((like) => like.contactId === 'me');
    const nextLikes = hasLiked
      ? moment.likes.filter((like) => like.contactId !== 'me')
      : [...moment.likes, { contactId: 'me', createdAt: Date.now() }];

    await db.moments.update(momentId, { likes: nextLikes });

    set((state) => ({
      moments: state.moments.map((m) =>
        m.id === momentId ? { ...m, likes: nextLikes } : m
      ),
    }));
  },

  addComment: async (momentId, content) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const moment = await db.moments.get(momentId);
    if (!moment) return;

    const newComment = {
      id: makeId('comment'),
      contactId: 'me',
      content: trimmed,
      createdAt: Date.now(),
    };
    const nextComments = [...moment.comments, newComment];

    await db.moments.update(momentId, { comments: nextComments });

    set((state) => ({
      moments: state.moments.map((m) =>
        m.id === momentId ? { ...m, comments: nextComments } : m
      ),
    }));
  },
}));
