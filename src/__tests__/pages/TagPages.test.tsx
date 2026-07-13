import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TagListPage } from '../../pages/TagListPage';
import { TagDetailPage } from '../../pages/TagDetailPage';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { useContactStore } from '../../stores/useContactStore';
import { useAppStore } from '../../stores/useAppStore';

describe('标签管理页面', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await initializeDatabase();
    useContactStore.setState({ me: null, contacts: [], tags: [], loaded: false, searchKeyword: '' });
    useAppStore.setState({ currentTab: 'contacts', pageStack: [{ type: 'tabs' }] });
    await useContactStore.getState().loadContacts();
    await useContactStore.getState().loadTags();
  });

  it('标签列表展示名称与成员计数', async () => {
    useAppStore.setState({ pageStack: [{ type: 'tabs' }, { type: 'tag-list' }] });
    render(<TagListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('tag-row-家人')).toBeInTheDocument();
    });
    expect(screen.getByTestId('tag-count-同事')).toHaveTextContent('2');
    expect(screen.getByTestId('tag-count-家人')).toHaveTextContent('1');
  });

  it('点击标签进入标签详情', async () => {
    useAppStore.setState({ pageStack: [{ type: 'tabs' }, { type: 'tag-list' }] });
    render(<TagListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('tag-row-同事')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('tag-row-同事'));
    expect(useAppStore.getState().pageStack.at(-1)).toEqual({
      type: 'tag-detail',
      tag: '同事',
    });
  });

  it('新建标签后出现在列表', async () => {
    useAppStore.setState({ pageStack: [{ type: 'tabs' }, { type: 'tag-list' }] });
    render(<TagListPage />);

    fireEvent.click(screen.getByTestId('tag-create-button'));
    fireEvent.change(screen.getByTestId('tag-create-input'), { target: { value: '闺蜜' } });
    fireEvent.click(screen.getByTestId('tag-create-confirm'));

    await waitFor(() => {
      expect(screen.getByTestId('tag-row-闺蜜')).toBeInTheDocument();
    });
  });

  it('标签详情展示成员，移除后成员消失', async () => {
    useAppStore.setState({ pageStack: [{ type: 'tabs' }, { type: 'tag-detail', tag: '同事' }] });
    render(<TagDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('tag-member-boss')).toBeInTheDocument();
    });
    expect(screen.getByTestId('tag-member-lisa')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tag-member-remove-boss'));
    await waitFor(() => {
      expect(screen.queryByTestId('tag-member-boss')).not.toBeInTheDocument();
    });
  });

  it('添加成员：候选列表中选择后成为成员', async () => {
    useAppStore.setState({ pageStack: [{ type: 'tabs' }, { type: 'tag-detail', tag: '同事' }] });
    render(<TagDetailPage />);

    fireEvent.click(screen.getByTestId('tag-add-member-button'));
    await waitFor(() => {
      expect(screen.getByTestId('tag-candidate-mom')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('tag-candidate-mom'));

    await waitFor(() => {
      expect(screen.getByTestId('tag-member-mom')).toBeInTheDocument();
    });
  });

  it('重命名标签后标题与数据同步更新', async () => {
    useAppStore.setState({ pageStack: [{ type: 'tabs' }, { type: 'tag-detail', tag: '同事' }] });
    render(<TagDetailPage />);

    fireEvent.click(screen.getByTestId('tag-rename-button'));
    fireEvent.change(screen.getByTestId('tag-rename-input'), { target: { value: '工作伙伴' } });
    fireEvent.click(screen.getByTestId('tag-rename-confirm'));

    await waitFor(() => {
      expect(useContactStore.getState().tags.some((t) => t.name === '工作伙伴')).toBe(true);
    });
    expect(useAppStore.getState().pageStack.at(-1)).toEqual({
      type: 'tag-detail',
      tag: '工作伙伴',
    });
  });

  it('删除标签后返回列表且标签消失', async () => {
    useAppStore.setState({
      pageStack: [{ type: 'tabs' }, { type: 'tag-list' }, { type: 'tag-detail', tag: '房东' }],
    });
    render(<TagDetailPage />);

    fireEvent.click(screen.getByTestId('tag-delete-button'));

    await waitFor(() => {
      expect(useContactStore.getState().tags.some((t) => t.name === '房东')).toBe(false);
    });
    expect(useAppStore.getState().pageStack.at(-1)?.type).toBe('tag-list');
  });
});
