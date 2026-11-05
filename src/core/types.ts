export type Lang = 'zh' | 'en';
export type L10n = { zh: string; en: string };

/** Build a bilingual string. */
export const L = (zh: string, en: string): L10n => ({ zh, en });

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type CategoryId =
  | 'arrays-hashing'
  | 'two-pointers'
  | 'sliding-window'
  | 'stack'
  | 'binary-search'
  | 'linked-list'
  | 'trees'
  | 'tries'
  | 'heap'
  | 'backtracking'
  | 'graphs'
  | 'advanced-graphs'
  | 'dp-1d'
  | 'dp-2d'
  | 'greedy'
  | 'intervals'
  | 'math-geometry'
  | 'bit-manipulation';

// ---------- Scene (what the visualizer draws) ----------

export type CellMark = 'good' | 'bad' | 'focus' | 'done';
export type PointerColor = 'a' | 'b' | 'c';

export interface ArrayLayer {
  kind: 'array';
  id: string;
  label: L10n;
  values: (string | number)[];
  /** Pointer labels drawn above cells. Index may equal values.length (one-past-end). */
  pointers?: { name: string; index: number; color?: PointerColor }[];
  /** Cells outside [lo, hi] are dimmed (e.g. binary search range). */
  active?: [number, number] | null;
  /** Highlighted band (e.g. sliding window). */
  window?: [number, number] | null;
  marks?: Record<number, CellMark>;
  /** Draw values as vertical bars (heights / prices). */
  bars?: boolean;
}

export interface StackLayer {
  kind: 'stack';
  id: string;
  label: L10n;
  items: (string | number)[];
}

export interface SetLayer {
  kind: 'set';
  id: string;
  label: L10n;
  items: (string | number)[];
}

export interface VarsLayer {
  kind: 'vars';
  id: string;
  vars: { name: string; value: string | number | boolean; highlight?: boolean }[];
}

export type Layer = ArrayLayer | StackLayer | SetLayer | VarsLayer;

// ---------- Problem definition ----------

export interface ActionOption {
  id: string;
  label: L10n;
}

/**
 * A problem is a small state machine:
 *   init(input) -> state
 *   correct(state) -> the action ids that are valid next steps
 *   apply(state, action) -> next state
 * Learn mode replays correct(state)[0] automatically;
 * Practice mode lets the learner pick from options(state) and checks against correct(state).
 */
export interface Problem<I = any, S = any> {
  id: string;
  number: number;
  category: CategoryId;
  difficulty: Difficulty;
  title: L10n;
  /** Our own short rewrite of the task (not the official statement). */
  description: L10n;
  /** The key idea behind the approach. */
  insight: L10n;
  examples: I[];
  random(): I;
  /** Returns an error message when a custom input is invalid. */
  validate(input: unknown): L10n | null;
  formatInput(input: I): string;

  init(input: I): S;
  isDone(state: S): boolean;
  options(state: S): ActionOption[];
  correct(state: S): string[];
  apply(state: S, action: string): S;
  /** Narration for a correct action taken from `state`. */
  explain(state: S, action: string): L10n;
  /** Why `action` is wrong in `state`; null falls back to a generic message. */
  whyWrong(state: S, action: string): L10n | null;
  /** Progressive hints (the engine appends a final "reveal" level). */
  hints(state: S): L10n[];
  scene(state: S): Layer[];
  result(state: S): L10n;

  /** Python reference solution; lineOf maps action id -> 1-based line. */
  code: string;
  lineOf: Record<string, number>;

  /** Final answer extracted from a finished state. */
  answer(state: S): unknown;
  /** Independent brute-force check used by tests. */
  verify(input: I, answer: unknown): boolean;
}
