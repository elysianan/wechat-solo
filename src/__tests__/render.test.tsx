import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders default chat page and TabBar', () => {
    render(<App />);
    expect(screen.getByText('聊天列表将在这里显示')).toBeInTheDocument();
    expect(screen.getByTestId('tab-chats')).toBeInTheDocument();
    expect(screen.getByTestId('tab-contacts')).toBeInTheDocument();
  });
});
