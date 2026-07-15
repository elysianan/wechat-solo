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

  it('each contact persona has non-empty rules', () => {
    for (const contact of seedContacts) {
      expect(contact.persona).toBeDefined();
      expect(contact.persona.rules.length).toBeGreaterThan(0);
      for (const rule of contact.persona.rules) {
        expect(rule.responses.length).toBeGreaterThan(0);
      }
    }
  });

  it('each conversation lastMessageId points to an existing message', () => {
    const messageIds = new Set(seedMessages.map((m) => m.id));
    for (const conversation of seedConversations) {
      expect(messageIds.has(conversation.lastMessageId)).toBe(true);
    }
  });

  it('moments likes and comments authors exist in contacts', () => {
    const contactIds = new Set(seedContacts.map((c) => c.id));
    for (const moment of seedMoments) {
      for (const like of moment.likes) {
        expect(contactIds.has(like.contactId)).toBe(true);
      }
      for (const comment of moment.comments) {
        expect(contactIds.has(comment.contactId)).toBe(true);
      }
    }
  });

  it('includes Sprint10 location message for buddy', () => {
    const locationMsg = seedMessages.find(
      (m) => m.conversationId === 'conv-buddy' && m.type === 'location'
    );
    expect(locationMsg).toBeDefined();
    expect(locationMsg).toMatchObject({
      name: '老地方网咖',
      address: '上海市徐汇区漕溪北路99号',
      senderId: 'buddy',
    });
  });

  it('includes Sprint10 contact card message for lisa', () => {
    const cardMsg = seedMessages.find(
      (m) => m.conversationId === 'conv-lisa' && m.type === 'contact_card'
    );
    expect(cardMsg).toBeDefined();
    expect(cardMsg).toMatchObject({
      contactId: 'boss',
      nickname: '张总',
    });
  });

  it('includes Sprint10 transfer message for landlord', () => {
    const transferMsg = seedMessages.find(
      (m) => m.conversationId === 'conv-landlord' && m.type === 'transfer'
    );
    expect(transferMsg).toBeDefined();
    expect(transferMsg).toMatchObject({
      amount: 2500,
      note: '房租',
      transferStatus: 'pending',
      senderId: 'me',
    });
  });
});
