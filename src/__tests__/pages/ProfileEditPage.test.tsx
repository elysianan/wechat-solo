import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileEditPage } from '../../pages/ProfileEditPage';
import { useAppStore } from '../../stores/useAppStore';
import { useContactStore } from '../../stores/useContactStore';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';

describe('个人信息编辑页', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    useAppStore.setState({
      currentTab: 'me',
      pageStack: [{ type: 'tabs' }, { type: 'profile-edit' }],
    });
  });

  it('展示当前昵称与微信号', () => {
    render(<ProfileEditPage />);
    expect(screen.getByText('昵称')).toBeInTheDocument();
    expect(screen.getByText('wxid_me_2026')).toBeInTheDocument();
  });

  it('编辑昵称并保存后更新 store 与数据库', async () => {
    render(<ProfileEditPage />);

    fireEvent.click(screen.getByTestId('profile-field-nickname'));
    const input = screen.getByTestId('profile-edit-input');
    fireEvent.change(input, { target: { value: '新昵称' } });
    fireEvent.click(screen.getByTestId('profile-edit-save'));

    await waitFor(() => {
      expect(useContactStore.getState().me?.nickname).toBe('新昵称');
    });

    const saved = await db.me.get('me');
    expect(saved?.nickname).toBe('新昵称');
  });

  it('编辑签名为空白时不写入', async () => {
    render(<ProfileEditPage />);

    fireEvent.click(screen.getByTestId('profile-field-signature'));
    fireEvent.change(screen.getByTestId('profile-edit-input'), { target: { value: '   ' } });
    fireEvent.click(screen.getByTestId('profile-edit-save'));

    await waitFor(() => {
      expect(screen.queryByTestId('profile-edit-input')).not.toBeInTheDocument();
    });
    expect(useContactStore.getState().me?.signature).toBe('保持热爱，奔赴山海');
  });

  it('点击返回回到 tab 层', () => {
    render(<ProfileEditPage />);
    fireEvent.click(screen.getByTestId('header-back'));
    expect(useAppStore.getState().pageStack.at(-1)?.type).toBe('tabs');
  });
});
