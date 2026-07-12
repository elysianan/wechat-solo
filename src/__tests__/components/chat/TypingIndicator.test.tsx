import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypingIndicator } from '../../../components/chat/TypingIndicator';

describe('TypingIndicator', () => {
  it('renders avatar, name and test id', () => {
    render(<TypingIndicator avatar="/avatar.svg" name="王阿姨" />);
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    expect(screen.getByText('王阿姨')).toBeInTheDocument();
    expect(screen.getByText('对方正在输入')).toBeInTheDocument();
  });
});
