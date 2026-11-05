import { L, type L10n } from '../core/types';

export const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

export const isIntArray = (x: unknown, min = 0, max = 50): x is number[] =>
  Array.isArray(x) &&
  x.length >= min &&
  x.length <= max &&
  x.every((v) => typeof v === 'number' && Number.isInteger(v) && Math.abs(v) <= 1e6);

export const isSorted = (a: number[]) => a.every((v, i) => i === 0 || a[i - 1] <= v);

export const err = (zh: string, en: string): L10n => L(zh, en);

/** Display a character inside an array cell (spaces become visible). */
export const showChar = (c: string) => (c === ' ' ? '␣' : c);
