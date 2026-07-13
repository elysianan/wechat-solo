import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db/database';
import { initializeDatabase } from '../../db/init';
import { PERSONA_VERSION } from '../../data/personas';

describe('persona 版本升级', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('全新初始化写入当前版本 persona', async () => {
    await initializeDatabase();
    const contacts = await db.contacts.toArray();
    expect(contacts.every((c) => c.persona.version === PERSONA_VERSION)).toBe(true);
  });

  it('旧版本 persona 升级: 规则刷新且消息/会话不动', async () => {
    await initializeDatabase();
    const messagesBefore = await db.messages.count();
    const conversationsBefore = await db.conversations.count();

    // 模拟旧数据: persona 回退到旧版本, 并塞入旧规则标记
    await db.contacts.toCollection().modify((contact) => {
      contact.persona = {
        ...contact.persona,
        version: 1,
        rules: [
          {
            id: 'old-marker-rule',
            triggers: { default: true },
            responses: ['旧版台词标记'],
            weight: 1,
          },
        ],
      };
    });

    await initializeDatabase();

    const contacts = await db.contacts.toArray();
    // persona 被重写: 版本刷新, 旧标记规则消失
    expect(contacts.every((c) => c.persona.version === PERSONA_VERSION)).toBe(true);
    expect(
      contacts.every((c) => !c.persona.rules.some((rule) => rule.id === 'old-marker-rule'))
    ).toBe(true);
    // 消息与会话数据不受影响
    expect(await db.messages.count()).toBe(messagesBefore);
    expect(await db.conversations.count()).toBe(conversationsBefore);
  });

  it('缺失 version 字段的远古数据视为旧版并升级', async () => {
    await initializeDatabase();
    await db.contacts.toCollection().modify((contact) => {
      delete (contact.persona as unknown as Record<string, unknown>).version;
    });

    await initializeDatabase();

    const contacts = await db.contacts.toArray();
    expect(contacts.every((c) => c.persona.version === PERSONA_VERSION)).toBe(true);
  });

  it('升级幂等: 当前版本数据重复初始化无副作用', async () => {
    await initializeDatabase();
    await initializeDatabase();
    const contacts = await db.contacts.toArray();
    expect(contacts).toHaveLength(5);
    expect(contacts.every((c) => c.persona.version === PERSONA_VERSION)).toBe(true);
  });
});
