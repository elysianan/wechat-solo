import { describe, it, expect } from 'vitest';
import { PERSONAS, PERSONA_VERSION } from '../../data/personas';
import { seedContacts } from '../../data/seed';

describe('personas 规则库模块', () => {
  it('导出 5 个人设, id 集合正确', () => {
    expect(PERSONAS.map((p) => p.id).sort()).toEqual(['boss', 'buddy', 'landlord', 'lisa', 'mom']);
  });

  it('PERSONA_VERSION 是 >= 2 的数字', () => {
    expect(typeof PERSONA_VERSION).toBe('number');
    expect(PERSONA_VERSION).toBeGreaterThanOrEqual(2);
  });

  it('每个人设带版本号/主动发起权重/话题池, 且至少 1 条 default 规则', () => {
    for (const persona of PERSONAS) {
      expect(persona.version).toBe(PERSONA_VERSION);
      expect(persona.initiateChance).toBeGreaterThan(0);
      expect(Array.isArray(persona.initiateTopics)).toBe(true);
      expect(persona.rules.some((rule) => rule.triggers.default)).toBe(true);
    }
  });

  it('搬迁等价: 规则总数不低于原基线 13 条', () => {
    const total = PERSONAS.reduce((sum, persona) => sum + persona.rules.length, 0);
    expect(total).toBeGreaterThanOrEqual(13);
  });

  it('seedContacts 的 persona 与 PERSONAS 同源(引用相等, 不复制)', () => {
    for (const contact of seedContacts) {
      const persona = PERSONAS.find((p) => p.id === contact.id);
      expect(persona).toBeDefined();
      expect(contact.persona).toBe(persona);
    }
  });
});
