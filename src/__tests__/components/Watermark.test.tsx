import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Watermark } from '../../components/common/Watermark';

describe('水印', () => {
  it('渲染演示水印文案', () => {
    render(<Watermark />);
    expect(screen.getByTestId('watermark')).toHaveTextContent('WeChat Solo Demo · 仅供演示');
  });

  it('不拦截点击事件', () => {
    render(<Watermark />);
    expect(screen.getByTestId('watermark').className).toContain('pointer-events-none');
  });
});
