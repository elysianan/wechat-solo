import { describe, it, expect } from 'vitest';
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

  it('指定 duration 后自动触发 onClose', async () => {
    const onClose = vi.fn();
    render(<WeChatToast message="演示模式" visible duration={100} onClose={onClose} />);
    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 500 });
  });
});
