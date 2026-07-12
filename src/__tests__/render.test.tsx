import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders default chat page and TabBar', () => {
    render(<App />);
    expect(screen.getByTestId('chat-page')).toBeInTheDocument();
    expect(screen.getByTestId('page-header')).toHaveTextContent('微信');
    expect(screen.getByTestId('tab-chats')).toBeInTheDocument();
    expect(screen.getByTestId('tab-contacts')).toBeInTheDocument();
  });
});
