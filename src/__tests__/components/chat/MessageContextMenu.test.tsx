import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageContextMenu } from '../../../components/chat/MessageContextMenu';

describe('MessageContextMenu', () => {
  it('renders menu items', () => {
    const items = [
      { id: 'copy', label: '复制', onClick: vi.fn() },
      { id: 'delete', label: '删除', onClick: vi.fn(), danger: true },
    ];
    render(
      <MessageContextMenu visible={true} x={100} y={100} items={items} onClose={vi.fn()} />
    );

    expect(screen.getByTestId('message-context-menu')).toBeInTheDocument();
    expect(screen.getByTestId('context-menu-item-copy')).toHaveTextContent('复制');
    expect(screen.getByTestId('context-menu-item-delete')).toHaveTextContent('删除');
  });

  it('does not render when invisible', () => {
    const { container } = render(
      <MessageContextMenu visible={false} x={100} y={100} items={[]} onClose={vi.fn()} />
    );

    expect(container.querySelector('[data-testid="message-context-menu"]')).not.toBeInTheDocument();
  });

  it('calls item onClick and onClose when clicking item', () => {
    const copyClick = vi.fn();
    const onClose = vi.fn();
    const items = [{ id: 'copy', label: '复制', onClick: copyClick }];

    render(
      <MessageContextMenu visible={true} x={100} y={100} items={items} onClose={onClose} />
    );

    fireEvent.click(screen.getByTestId('context-menu-item-copy'));
    expect(copyClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
