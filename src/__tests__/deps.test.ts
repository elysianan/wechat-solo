import { describe, it, expect } from 'vitest';

describe('runtime dependencies', () => {
  it('can import zustand', async () => {
    const zustand = await import('zustand');
    expect(zustand.create).toBeDefined();
  });

  it('can import dexie', async () => {
    const dexie = await import('dexie');
    expect(dexie.Dexie).toBeDefined();
  });

  it('can import lucide-react', async () => {
    const lucide = await import('lucide-react');
    expect(lucide.MessageCircle).toBeDefined();
  });
});
