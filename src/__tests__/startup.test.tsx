import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { db } from '../db/database';

describe('App startup', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('boots and shows tab bar', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-chats')).toBeInTheDocument();
    });
  });
});
