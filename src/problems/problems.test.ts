import { describe, expect, it } from 'vitest';
import { buildTrace, hintsFor, judge, MAX_STEPS } from '../core/engine';
import { CATEGORIES } from '../core/categories';
import { PROBLEMS } from './index';

const RUNS = 300;

describe('catalog', () => {
  it('NeetCode category totals sum to 150', () => {
    expect(CATEGORIES.reduce((s, c) => s + c.total, 0)).toBe(150);
  });
  it('problem ids are unique', () => {
    expect(new Set(PROBLEMS.map((p) => p.id)).size).toBe(PROBLEMS.length);
  });
});

describe.each(PROBLEMS.map((p) => [p.id, p] as const))('%s', (_id, p) => {
  const inputs = () => [...p.examples, ...Array.from({ length: RUNS }, () => p.random())];

  it('examples and random inputs pass validation', () => {
    for (const input of inputs()) expect(p.validate(JSON.parse(JSON.stringify(input))), JSON.stringify(input)).toBeNull();
  });

  it('reference trace produces a correct answer', () => {
    for (const input of inputs()) {
      const trace = buildTrace(p, input);
      const last = trace[trace.length - 1].state;
      expect(p.isDone(last), JSON.stringify(input)).toBe(true);
      expect(p.verify(input, p.answer(last)), JSON.stringify(input)).toBe(true);
    }
  });

  it('any path through accepted actions is correct; every action renders feedback', () => {
    for (const input of inputs()) {
      let s = p.init(input);
      for (let k = 0; k < MAX_STEPS && !p.isDone(s); k++) {
        const ids = p.options(s).map((o) => o.id);
        const ok = p.correct(s);
        expect(ok.length).toBeGreaterThan(0);
        for (const a of ok) expect(ids).toContain(a);
        for (const a of ids) {
          const j = judge(p, s, a);
          expect(j.message.zh.length).toBeGreaterThan(0);
          expect(j.message.en.length).toBeGreaterThan(0);
          expect(j.message.zh).not.toMatch(/undefined|NaN/);
          if (!j.ok) expect(j.next).toBe(s);
        }
        expect(hintsFor(p, s).length).toBeGreaterThan(1);
        expect(p.scene(s).length).toBeGreaterThan(0);
        s = p.apply(s, ok[Math.floor(Math.random() * ok.length)]);
      }
      expect(p.isDone(s)).toBe(true);
      expect(p.verify(input, p.answer(s)), JSON.stringify(input)).toBe(true);
    }
  });

  it('code lines referenced by actions exist', () => {
    const n = p.code.split('\n').length;
    for (const line of Object.values(p.lineOf)) expect(line).toBeLessThanOrEqual(n);
  });

  it('rejects malformed input', () => {
    expect(p.validate(null)).not.toBeNull();
    expect(p.validate({})).not.toBeNull();
  });
});
