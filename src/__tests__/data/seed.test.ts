import { describe, it, expect } from 'vitest';
import { seedMe, seedContacts, seedConversations, seedMessages, seedMoments } from '../../data/seed';

describe('seed data', () => {
  it('has me user', () => {
    expect(seedMe.nickname).toBe('我');
  });

  it('has 5 contacts with personas', () => {
    expect(seedContacts).toHaveLength(5);
    expect(seedContacts.every((c) => c.persona)).toBe(true);
  });

  it('has conversation for each contact', () => {
    expect(seedConversations).toHaveLength(seedContacts.length);
    expect(seedConversations.every((c) => c.lastMessageId)).toBe(true);
  });

  it('has messages linked to conversations', () => {
    const conversationIds = new Set(seedConversations.map((c) => c.id));
    expect(seedMessages.every((m) => conversationIds.has(m.conversationId))).toBe(true);
  });

  it('has moments with valid authors', () => {
    const contactIds = new Set(seedContacts.map((c) => c.id));
    expect(seedMoments.length).toBeGreaterThan(0);
    expect(seedMoments.every((m) => contactIds.has(m.authorId))).toBe(true);
  });
});
