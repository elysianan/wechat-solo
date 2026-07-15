import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ContactCardMessage } from '../../../components/chat/ContactCardMessage';
import type { ContactCardMessage as ContactCardMessageType } from '../../../types';

const message: ContactCardMessageType = {
  id: 'm1',
  conversationId: 'c1',
  senderId: 'me',
  type: 'contact_card',
  contactId: 'u1',
  nickname: '王小明',
  avatar: '/avatar.svg',
  region: '中国 深圳',
  signature: '保持热爱',
  status: 'sent',
  createdAt: Date.now(),
};

describe('ContactCardMessage', () => {
  it('渲染头像、昵称、地区', () => {
    render(<ContactCardMessage message={message} onClick={() => {}} />);
    expect(screen.getByText('王小明')).toBeInTheDocument();
    expect(screen.getByText('中国 深圳')).toBeInTheDocument();
    expect(screen.getByAltText('王小明')).toHaveAttribute('src', expect.stringContaining('avatar'));
  });

  it('点击触发 onClick', () => {
    const handleClick = vi.fn();
    render(<ContactCardMessage message={message} onClick={handleClick} />);
    fireEvent.click(screen.getByTestId('contact-card-message'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
