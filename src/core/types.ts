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

export type CellMark = 'good' | 'bad' | 'focus' | 'done' | 'gone';
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
  /** Practice drag & drop: cells become draggable as `${dragPrefix}:${i}`. */
  dragPrefix?: string;
  /** Practice drag & drop: cells become drop targets as `${dropPrefix}:${i}`. */
  dropPrefix?: string;
  /** Text shown on the floating tile while dragging a cell. */
  dragLabels?: string[];
  /** Which cells are draggable / droppable (default: all, when a prefix is set). */
  dragMask?: boolean[];
  dropMask?: boolean[];
}

/** Named drop areas such as a discard bin or answer slots. */
export interface ZonesLayer {
  kind: 'zones';
  id: string;
  zones: { id: string; label: L10n; tone: 'trash' | 'good' | 'bad' }[];
}

export interface StackLayer {
  kind: 'stack';
  id: string;
  label: L10n;
  items: (string | number)[];
  /** Small caption under each item (e.g. "day 3"). */
  itemSub?: L10n[];
  /** Items become draggable as `${dragPrefix}:${index}` (0 = bottom). */
  dragPrefix?: string;
  /** The whole stack is a drop target with this id. */
  dropId?: string;
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

export type Layer = ArrayLayer | StackLayer | SetLayer | VarsLayer | ZonesLayer;

// ---------- Problem definition ----------

/** A correct drag & drop move: dragging `from` onto `to` performs `action`. */
export interface DragMove {
  action: string;
  from: string;
  to: string;
}

export interface DragSpec<S> {
  /** One-line rule reminder shown above the stage. */
  instructions: L10n;
  /** The moves that count as correct in this state (each maps to a correct action). */
  moves(state: S): DragMove[];
  /** Why dropping `from` onto `to` is wrong. `from` is TAP for a tap on a tap zone. */
  whyWrong(state: S, from: string, to: string): L10n;
  /** Zones that can also be activated by a plain tap (e.g. "it's a palindrome"). */
  tapZones?: string[];
}

/** `from` value used for a tap on a zone with nothing picked up. */
export const TAP = '@tap';

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

  /** When present, practice mode uses drag & drop instead of buttons. */
  drag?: DragSpec<S>;

  /** Final answer extracted from a finished state. */
  answer(state: S): unknown;
  /** Independent brute-force check used by tests. */
  verify(input: I, answer: unknown): boolean;
}
