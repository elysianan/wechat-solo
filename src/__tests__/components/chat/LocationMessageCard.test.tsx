import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LocationMessageCard } from '../../../components/chat/LocationMessageCard';
import type { LocationMessage } from '../../../types';

const message: LocationMessage = {
  id: 'm1',
  conversationId: 'c1',
  senderId: 'me',
  type: 'location',
  name: '腾讯大厦',
  address: '深圳市南山区海天二路33号',
  status: 'sent',
  createdAt: Date.now(),
};

describe('LocationMessageCard', () => {
  it('渲染地点名称和地址', () => {
    render(<LocationMessageCard message={message} />);
    expect(screen.getByText('腾讯大厦')).toBeInTheDocument();
    expect(screen.getByText('深圳市南山区海天二路33号')).toBeInTheDocument();
  });

  it('点击卡片触发 onClick', () => {
    const onClick = vi.fn();
    render(<LocationMessageCard message={message} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('location-message-card'));
    expect(onClick).toHaveBeenCalled();
  });

  it('包含地图占位区域', () => {
    render(<LocationMessageCard message={message} />);
    expect(screen.getByTestId('location-map-placeholder')).toBeInTheDocument();
  });
});
