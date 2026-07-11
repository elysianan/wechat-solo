import { create } from 'zustand';
import type { Moment } from '../types';
import { db } from '../db/database';

interface MomentState {
  moments: Moment[];
  loaded: boolean;
  loadMoments: () => Promise<void>;
}

// 朋友圈状态：从 IndexedDB 加载动态列表
export const useMomentStore = create<MomentState>((set) => ({
  moments: [],
  loaded: false,
  loadMoments: async () => {
    const moments = await db.moments.toArray();
    set({ moments, loaded: true });
  },
}));
