import { describe, it, expect } from 'vitest';
import { PERSONAS } from '../../data/personas';

// 规则库内容基线(Sprint 6 T6 验收标准):
// 只断言量级与结构下限, 不断言具体台词内容(交接单决策 5)
describe('规则库内容基线', () => {
  it('每人设规则数 >= 15', () => {
    for (const persona of PERSONAS) {
      expect(persona.rules.length, `${persona.id} 规则数`).toBeGreaterThanOrEqual(15);
    }
  });

  it('每条规则 3~6 句台词', () => {
    for (const persona of PERSONAS) {
      for (const rule of persona.rules) {
        expect(rule.responses.length, `${persona.id}/${rule.id} 台词数`).toBeGreaterThanOrEqual(3);
        expect(rule.responses.length, `${persona.id}/${rule.id} 台词数`).toBeLessThanOrEqual(6);
      }
    }
  });

  it('每人设至少 1/3 的台词含 {keyword} 回引模板', () => {
    for (const persona of PERSONAS) {
      const allResponses = persona.rules.flatMap((rule) => rule.responses);
      const templated = allResponses.filter((response) => response.includes('{keyword}'));
      expect(templated.length / allResponses.length, `${persona.id} 模板占比`).toBeGreaterThanOrEqual(1 / 3);
    }
  });

  it('每人设至少 2 条时段规则, 且至少 1 条覆盖深夜档', () => {
    for (const persona of PERSONAS) {
      const timed = persona.rules.filter((rule) => rule.triggers.timeWindow);
      expect(timed.length, `${persona.id} 时段规则数`).toBeGreaterThanOrEqual(2);
      expect(
        timed.some((rule) => rule.triggers.timeWindow?.includes('night')),
        `${persona.id} 深夜档规则`
      ).toBe(true);
    }
  });

  it('每人设至少 2 条 context 规则', () => {
    for (const persona of PERSONAS) {
      const contextual = persona.rules.filter(
        (rule) => rule.triggers.context && rule.triggers.context.length > 0
      );
      expect(contextual.length, `${persona.id} context 规则数`).toBeGreaterThanOrEqual(2);
    }
  });

  it('每人设主动话题池 >= 5 条', () => {
    for (const persona of PERSONAS) {
      expect(persona.initiateTopics.length, `${persona.id} 话题池`).toBeGreaterThanOrEqual(5);
    }
  });

  it('规则 id 全局唯一', () => {
    const ids = PERSONAS.flatMap((persona) => persona.rules.map((rule) => rule.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('每人设仍有 default 兜底规则', () => {
    for (const persona of PERSONAS) {
      expect(persona.rules.some((rule) => rule.triggers.default), `${persona.id} default`).toBe(true);
    }
  });
});
