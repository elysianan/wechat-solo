import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomInputSheet } from '../../../components/moments/BottomInputSheet';

describe('BottomInputSheet', () => {
  it('renders input and submit button when visible', () => {
    render(<BottomInputSheet visible={true} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByTestId('bottom-input-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-input')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-input-submit')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    const { container } = render(
      <BottomInputSheet visible={false} onSubmit={vi.fn()} onCancel={vi.fn()} />
    );

    expect(container.querySelector('[data-testid="bottom-input-sheet"]')).not.toBeInTheDocument();
  });

  it('calls onCancel when clicking backdrop', () => {
    const onCancel = vi.fn();
    render(<BottomInputSheet visible={true} onSubmit={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByTestId('bottom-input-sheet').firstChild!);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not submit empty content', () => {
    const onSubmit = vi.fn();
    render(<BottomInputSheet visible={true} onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByTestId('bottom-input-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits content and clears input', () => {
    const onSubmit = vi.fn();
    render(<BottomInputSheet visible={true} onSubmit={onSubmit} onCancel={vi.fn()} />);

    const input = screen.getByTestId('bottom-input');
    fireEvent.change(input, { target: { value: '不错' } });
    fireEvent.click(screen.getByTestId('bottom-input-submit'));

    expect(onSubmit).toHaveBeenCalledWith('不错');
    expect(input).toHaveValue('');
  });
});
