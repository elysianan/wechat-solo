import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabBar } from '../../components/common/TabBar';
import { useAppStore } from '../../stores/useAppStore';

describe('TabBar', () => {
  it('renders four tabs', () => {
    render(<TabBar />);
    expect(screen.getByTestId('tab-chats')).toBeInTheDocument();
    expect(screen.getByTestId('tab-contacts')).toBeInTheDocument();
    expect(screen.getByTestId('tab-discover')).toBeInTheDocument();
    expect(screen.getByTestId('tab-me')).toBeInTheDocument();
  });

  it('switches active tab on click', () => {
    render(<TabBar />);
    fireEvent.click(screen.getByTestId('tab-contacts'));
    expect(useAppStore.getState().currentTab).toBe('contacts');
  });
});
