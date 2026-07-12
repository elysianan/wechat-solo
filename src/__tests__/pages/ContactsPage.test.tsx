import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ContactsPage } from '../../pages/ContactsPage';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { useContactStore } from '../../stores/useContactStore';
import { useAppStore } from '../../stores/useAppStore';

describe('通讯录页面', () => {
  // 每个测试前重置 IndexedDB 与相关 store，确保数据隔离
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    await db.delete();
    await db.open();
    useContactStore.setState({ me: null, contacts: [], loaded: false, searchKeyword: '' });
    useAppStore.setState({ currentTab: 'contacts', pageStack: [{ type: 'tabs' }] });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
  });

  it('渲染字母分组', async () => {
    render(<ContactsPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('section-letter').length).toBeGreaterThan(0);
    });
  });

  it('中文搜索过滤联系人', async () => {
    render(<ContactsPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('contact-list-item').length).toBeGreaterThan(1);
    });
    fireEvent.change(screen.getByTestId('contacts-search'), { target: { value: '王' } });
    await waitFor(() => {
      expect(screen.getAllByTestId('contact-list-item')).toHaveLength(1);
      expect(screen.getByText('王阿姨')).toBeInTheDocument();
    });
  });

  it('拼音首字母搜索', async () => {
    render(<ContactsPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('contact-list-item').length).toBeGreaterThan(1);
    });
    fireEvent.change(screen.getByTestId('contacts-search'), { target: { value: 'wa' } });
    await waitFor(() => {
      expect(screen.getByText('王阿姨')).toBeInTheDocument();
    });
  });

  it('点击联系人进入资料页', async () => {
    render(<ContactsPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('contact-list-item')[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('contact-list-item')[0]);
    await waitFor(() => {
      const top = useAppStore.getState().pageStack.at(-1);
      expect(top?.type).toBe('contact-detail');
    });
  });
});
