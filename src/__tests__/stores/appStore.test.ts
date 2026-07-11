import { describe, it, expect } from 'vitest';
import { useAppStore } from '../../stores/useAppStore';

describe('useAppStore', () => {
  it('默认显示 chats tab', () => {
    expect(useAppStore.getState().currentTab).toBe('chats');
  });

  it('可以切换 tab', () => {
    useAppStore.getState().setCurrentTab('contacts');
    expect(useAppStore.getState().currentTab).toBe('contacts');
  });
});
