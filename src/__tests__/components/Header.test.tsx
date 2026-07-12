import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../components/common/Header';

describe('Header', () => {
  it('渲染标题', () => {
    render(<Header title="微信" />);
    expect(screen.getByTestId('page-header')).toHaveTextContent('微信');
  });

  it('传入 onBack 时显示返回按钮并触发回调', () => {
    const onBack = vi.fn();
    render(<Header title="聊天" onBack={onBack} />);
    const backBtn = screen.getByTestId('header-back');
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('渲染右侧节点', () => {
    render(<Header title="微信" right={<span data-testid="right-node">···</span>} />);
    expect(screen.getByTestId('right-node')).toBeInTheDocument();
  });
});
