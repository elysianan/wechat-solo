import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WeChatToast } from '../../components/common/WeChatToast';

describe('WeChatToast', () => {
  it('visible 为 true 时显示文案', () => {
    render(<WeChatToast message="演示模式" visible />);
    expect(screen.getByTestId('wechat-toast')).toHaveTextContent('演示模式');
  });

  it('visible 为 false 时不渲染', () => {
    render(<WeChatToast message="演示模式" visible={false} />);
    expect(screen.queryByTestId('wechat-toast')).not.toBeInTheDocument();
  });

  it('visible 由父组件完全控制，切换 false 立即消失，再切回 true 重新显示', () => {
    const { rerender } = render(<WeChatToast message="演示模式" visible />);
    expect(screen.getByTestId('wechat-toast')).toBeInTheDocument();

    rerender(<WeChatToast message="演示模式" visible={false} />);
    expect(screen.queryByTestId('wechat-toast')).not.toBeInTheDocument();

    rerender(<WeChatToast message="演示模式" visible />);
    expect(screen.getByTestId('wechat-toast')).toBeInTheDocument();
  });

  it('指定 duration 后自动触发 onClose', async () => {
    const onClose = vi.fn();
    render(<WeChatToast message="演示模式" visible duration={100} onClose={onClose} />);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1), { timeout: 500 });
  });

  it('包含无障碍属性 role="status"、aria-live="polite" 与 aria-label', () => {
    render(<WeChatToast message="演示模式" visible />);
    const toast = screen.getByTestId('wechat-toast');
    expect(toast).toHaveAttribute('role', 'status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
    expect(toast).toHaveAttribute('aria-label', '提示');
  });
});
