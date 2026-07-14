import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MomentImageGrid } from '../../../components/moments/MomentImageGrid';

describe('MomentImageGrid', () => {
  it('renders nothing when images is empty', () => {
    const { container } = render(<MomentImageGrid images={[]} onImageClick={vi.fn()} />);
    expect(container.querySelector('[data-testid="moment-image-grid"]')).not.toBeInTheDocument();
  });

  it('renders 1 column for single image', () => {
    render(<MomentImageGrid images={['data:image/png;base64,a']} onImageClick={vi.fn()} />);
    const grid = screen.getByTestId('moment-image-grid');
    expect(grid).toHaveStyle('grid-template-columns: repeat(1, minmax(0, 1fr))');
    expect(screen.getByTestId('moment-image-0')).toBeInTheDocument();
  });

  it('renders 2 columns for 2 images', () => {
    render(
      <MomentImageGrid images={['data:image/png;base64,a', 'data:image/png;base64,b']} onImageClick={vi.fn()} />
    );
    expect(screen.getByTestId('moment-image-grid')).toHaveStyle(
      'grid-template-columns: repeat(2, minmax(0, 1fr))'
    );
  });

  it('renders 2 columns for 4 images', () => {
    render(
      <MomentImageGrid
        images={['a', 'b', 'c', 'd'].map((c) => `data:image/png;base64,${c}`)}
        onImageClick={vi.fn()}
      />
    );
    expect(screen.getByTestId('moment-image-grid')).toHaveStyle(
      'grid-template-columns: repeat(2, minmax(0, 1fr))'
    );
  });

  it('renders 3 columns for 3 images', () => {
    render(
      <MomentImageGrid
        images={['a', 'b', 'c'].map((c) => `data:image/png;base64,${c}`)}
        onImageClick={vi.fn()}
      />
    );
    expect(screen.getByTestId('moment-image-grid')).toHaveStyle(
      'grid-template-columns: repeat(3, minmax(0, 1fr))'
    );
  });

  it('calls onImageClick with index when image clicked', () => {
    const onImageClick = vi.fn();
    render(
      <MomentImageGrid
        images={['data:image/png;base64,a', 'data:image/png;base64,b']}
        onImageClick={onImageClick}
      />
    );

    fireEvent.click(screen.getByTestId('moment-image-1'));
    expect(onImageClick).toHaveBeenCalledWith(1);
  });
});
