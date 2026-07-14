import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageLightbox } from '../../../components/common/ImageLightbox';

describe('ImageLightbox', () => {
  it('renders image and close button when visible', () => {
    render(
      <ImageLightbox
        src="/avatar-mom.svg"
        alt="测试图片"
        visible={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('image-lightbox')).toBeInTheDocument();
    expect(screen.getByAltText('测试图片')).toBeInTheDocument();
    expect(screen.getByTestId('image-lightbox-close')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    const { container } = render(
      <ImageLightbox src="/avatar-mom.svg" visible={false} onClose={vi.fn()} />
    );

    expect(container.querySelector('[data-testid="image-lightbox"]')).not.toBeInTheDocument();
  });

  it('calls onClose when clicking background', () => {
    const onClose = vi.fn();
    render(
      <ImageLightbox src="/avatar-mom.svg" visible={true} onClose={onClose} />
    );

    fireEvent.click(screen.getByTestId('image-lightbox'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking close button', () => {
    const onClose = vi.fn();
    render(
      <ImageLightbox src="/avatar-mom.svg" visible={true} onClose={onClose} />
    );

    fireEvent.click(screen.getByTestId('image-lightbox-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking image', () => {
    const onClose = vi.fn();
    render(
      <ImageLightbox src="/avatar-mom.svg" visible={true} onClose={onClose} />
    );

    fireEvent.click(screen.getByAltText('图片'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
