import { L, type DragMove, type L10n, type Layer, type Problem } from './types';

export const MAX_STEPS = 1000;

export interface TraceStep<S = unknown> {
  state: S;
  note: L10n;
  action: string | null;
  line: number;
}

/** Run the reference path (always taking the first correct action). */
export function buildTrace<I, S>(p: Problem<I, S>, input: I): TraceStep<S>[] {
  let state = p.init(input);
  const trace: TraceStep<S>[] = [
    {
      state,
      note: L('初始狀態：設定好指標與變數，準備開始。', 'Initial state: pointers and variables are set up.'),
      action: null,
      line: p.lineOf.init ?? 1,
    },
  ];
  for (let i = 0; i < MAX_STEPS && !p.isDone(state); i++) {
    const action = p.correct(state)[0];
    const note = p.explain(state, action);
    state = p.apply(state, action);
    trace.push({ state, note, action, line: p.lineOf[action] ?? 1 });
  }
  return trace;
}

export interface Judgement<S> {
  ok: boolean;
  next: S;
  message: L10n;
}

/** Judge one learner action in practice mode. Wrong actions do not change the state. */
export function judge<I, S>(p: Problem<I, S>, state: S, action: string): Judgement<S> {
  const correct = p.correct(state);
  if (correct.includes(action)) {
    return { ok: true, next: p.apply(state, action), message: p.explain(state, action) };
  }
  return {
    ok: false,
    next: state,
    message:
      p.whyWrong(state, action) ??
      L('這一步不對，再想想看。可以點「提示」。', 'Not quite. Think again, or use a hint.'),
  };
}

/** Hints for the current state, ending with a reveal of the correct action. */
export function hintsFor<I, S>(p: Problem<I, S>, state: S): L10n[] {
  const reveal = p.correct(state)[0];
  const opt = p.options(state).find((o) => o.id === reveal);
  const label = opt?.label ?? L(reveal, reveal);
  return [...p.hints(state), L(`正確操作：「${label.zh}」`, `Correct move: "${label.en}"`)];
}

export function randInt(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export function pick(arr: string): string;
export function pick<T>(arr: readonly T[]): T;
export function pick<T>(arr: readonly T[] | string): T | string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface MoveJudgement<S> extends Judgement<S> {
  move: DragMove | null;
}

/** Judge a drag & drop move. Wrong moves leave the state unchanged. */
export function judgeMove<I, S>(p: Problem<I, S>, state: S, from: string, to: string): MoveJudgement<S> {
  const spec = p.drag!;
  const move = spec.moves(state).find((m) => m.from === from && m.to === to) ?? null;
  if (move) return { ok: true, move, next: p.apply(state, move.action), message: p.explain(state, move.action) };
  return { ok: false, move: null, next: state, message: spec.whyWrong(state, from, to) };
}

/** All draggable and droppable ids a scene exposes. */
export function dragIds(layers: Layer[]): { drags: string[]; drops: string[] } {
  const drags: string[] = [];
  const drops: string[] = [];
  for (const l of layers) {
    if (l.kind === 'array') {
      if (l.dragPrefix) l.values.forEach((_, i) => drags.push(`${l.dragPrefix}:${i}`));
      if (l.dropPrefix) l.values.forEach((_, i) => drops.push(`${l.dropPrefix}:${i}`));
    } else if (l.kind === 'stack') {
      if (l.dragPrefix) l.items.forEach((_, i) => drags.push(`${l.dragPrefix}:${i}`));
      if (l.dropId) drops.push(l.dropId);
    }
  }
  return { drags, drops };
}
