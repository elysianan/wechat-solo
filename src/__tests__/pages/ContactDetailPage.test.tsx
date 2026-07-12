import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ContactDetailPage } from '../../pages/ContactDetailPage';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { useContactStore } from '../../stores/useContactStore';
import { useChatStore } from '../../stores/useChatStore';
import { useAppStore } from '../../stores/useAppStore';

describe('好友资料页', () => {
  // 每个测试前重置数据库、store，并导航到王阿姨的资料页
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useContactStore.setState({ me: null, contacts: [], loaded: false, searchKeyword: '' });
    useChatStore.setState({ conversations: [], messages: {}, loaded: false });
    useAppStore.setState({ currentTab: 'contacts', pageStack: [{ type: 'tabs' }, { type: 'contact-detail', contactId: 'mom' }] });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
  });

  it('展示联系人信息', async () => {
    render(<ContactDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('王阿姨')).toBeInTheDocument();
      expect(screen.getByText('微信号：wxid_wangayi')).toBeInTheDocument();
    });
  });

  it('点击发消息进入聊天详情', async () => {
    render(<ContactDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('contact-send-message')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('contact-send-message'));
    await waitFor(() => {
      const top = useAppStore.getState().pageStack.at(-1);
      expect(top?.type).toBe('chat-detail');
    });
  });
});
