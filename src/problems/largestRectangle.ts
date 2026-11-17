import { randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';

type I = { heights: number[] };
/**
 * i = next bar; start = how far left the current bar can extend (carried from popped bars);
 * stack holds [start, height] pairs with increasing heights; last = rectangle just computed (for display).
 */
type S = { h: number[]; i: number; start: number; stack: [number, number][]; best: number; last: [number, number, number] | null };

const top = <T,>(a: T[]) => a[a.length - 1];

export const largestRectangle: Problem<I, S> = {
  id: 'largest-rectangle-in-histogram',
  number: 84,
  category: 'stack',
  difficulty: 'Hard',
  title: L('柱狀圖中最大的矩形', 'Largest Rectangle in Histogram'),
  description: L('柱子寬度都是 1，找出柱狀圖裡面積最大的矩形。', 'Bars have width 1. Find the area of the largest rectangle in the histogram.'),
  insight: L(
    '用單調遞增的堆疊存 (起點, 高度)。今天的柱子比頂端矮時，頂端那根高柱「往右延伸到這裡就斷了」，可以結算它的面積 = 高度 × (今天位置 − 起點)；被結算的柱子把起點留給今天，因為今天這根較矮的柱子可以往左延伸到那裡。掃完後，堆疊裡剩下的柱子都能延伸到最右邊。',
    "Keep an increasing stack of (start, height). When today's bar is shorter than the top, the taller top bar can't extend any further right: settle its area = height × (today − start). Today's shorter bar inherits that start, since it can extend left that far. After the scan, every bar left in the stack extends to the right edge.",
  ),
  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    why: L(
      '每根柱子最多 push 一次、pop 一次，總共 O(n)。堆疊最多存 n 根柱子。暴力解對每一根柱子往左右找邊界，是 O(n²)。',
      'Each bar is pushed once and popped once: O(n) total. The stack holds up to n bars. Expanding left and right from every bar is O(n²).',
    ),
  },
  examples: [{ heights: [2, 1, 5, 6, 2, 3] }, { heights: [2, 4] }, { heights: [3, 1, 3, 2, 2] }],
  random: () => ({ heights: Array.from({ length: randInt(5, 8) }, () => randInt(1, 6)) }),
  validate(x) {
    if (!isObj(x) || !isIntArray(x.heights, 1, 14) || x.heights.some((v) => v < 0 || v > 20))
      return err('需要 {"heights": [0–20 的整數...]}，長度 1–14', 'Expected {"heights": [ints 0–20]}, length 1–14');
    return null;
  },
  formatInput: (i) => `heights = [${i.heights.join(', ')}]`,

  init: ({ heights }) => ({ h: heights, i: 0, start: 0, stack: [], best: 0, last: null }),
  isDone: (st) => st.i >= st.h.length && st.stack.length === 0,
  options: () => [
    { id: 'pop', label: L('結算頂端的面積（pop）', 'Settle the top (pop)') },
    { id: 'push', label: L('今天的柱子入堆疊（push）', "Push today's bar") },
  ],
  correct: ({ h, i, stack }) => (i >= h.length || (stack.length > 0 && top(stack)[1] > h[i]) ? ['pop'] : ['push']),
  apply(st, act) {
    if (act === 'push') return { ...st, stack: [...st.stack, [st.start, st.h[st.i]]], i: st.i + 1, start: st.i + 1 };
    const [s, height] = top(st.stack);
    const right = Math.min(st.i, st.h.length);
    const area = height * (right - s);
    return { ...st, stack: st.stack.slice(0, -1), start: s, best: Math.max(st.best, area), last: [s, right - 1, area] };
  },
  explain(st, act) {
    const { h, i } = st;
    if (act === 'push')
      return L(
        `今天的柱子高 ${h[i]}，沒有比頂端矮，入堆疊；它的起點是 ${st.start}${st.start < i ? '（繼承被結算的高柱）' : ''}。`,
        `Today's bar (${h[i]}) isn't shorter than the top, so push it with start ${st.start}${st.start < i ? ' (inherited from settled taller bars)' : ''}.`,
      );
    const [s, height] = top(st.stack);
    const right = Math.min(i, h.length);
    const area = height * (right - s);
    const reason = i >= h.length
      ? L('已經掃到最右邊，堆疊裡剩下的柱子都能延伸到底。', 'The scan reached the right edge; bars left in the stack extend to the end.')
      : L(`今天的柱子高 ${h[i]}，比頂端的 ${height} 矮，高柱往右延伸到這裡就斷了。`, `Today's bar (${h[i]}) is shorter than the top (${height}), so the taller bar stops here.`);
    return L(
      `${reason.zh}結算：高 ${height} × 寬 (${right} − ${s}) = ${area}${area > st.best ? '，刷新最大面積！' : '。'}`,
      `${reason.en} Settle: height ${height} × width (${right} − ${s}) = ${area}${area > st.best ? ', a new best!' : '.'}`,
    );
  },
  whyWrong({ h, i, stack }, act) {
    if (i >= h.length) return L('柱子都掃完了，把堆疊裡剩下的一根一根結算。', 'All bars are scanned; settle the remaining bars one by one.');
    if (act === 'push') return L(`頂端的柱子高 ${top(stack)[1]}，比今天的 ${h[i]} 高，它往右延伸到這裡就斷了，要先結算。`, `The top bar (${top(stack)[1]}) is taller than today's (${h[i]}); it can't extend past here, so settle it first.`);
    return stack.length
      ? L(`頂端的柱子高 ${top(stack)[1]}，沒有比今天的 ${h[i]} 高，它還能繼續往右延伸，不用結算。`, `The top bar (${top(stack)[1]}) isn't taller than today's (${h[i]}); it can still extend right. No need to settle.`)
      : L('堆疊是空的，沒有東西可以結算。', 'The stack is empty; nothing to settle.');
  },
  hints: ({ h, i, stack }) => [
    i >= h.length ? L('掃完了，堆疊裡還有柱子嗎？', 'The scan is done. Any bars left in the stack?') : L('今天的柱子比堆疊頂端矮嗎？', "Is today's bar shorter than the stack top?"),
    L(`今天 ${i < h.length ? h[i] : '（掃完）'}，頂端 ${stack.length ? top(stack)[1] : '（空）'}。`, `Today ${i < h.length ? h[i] : '(done)'}, top ${stack.length ? top(stack)[1] : '(empty)'}.`),
  ],
  scene(st) {
    const { h, i, stack, best, last } = st;
    const done = i >= h.length && stack.length === 0;
    const marks: Record<number, CellMark> = {};
    h.forEach((_, k) => {
      if (k < i) marks[k] = 'done';
    });
    if (i < h.length) marks[i] = 'focus';
    return [
      {
        kind: 'array',
        id: 'h',
        label: L('heights（藍色區塊是剛結算的矩形）', 'heights (blue band = rectangle just settled)'),
        values: h,
        bars: true,
        pointers: i < h.length ? [{ name: 'i', index: i, color: 'a' }] : [],
        window: last ? [last[0], last[1]] : null,
        marks,
        dragPrefix: done ? undefined : 'b',
        dragMask: h.map((_, k) => k >= i),
      },
      {
        kind: 'stack',
        id: 'stack',
        label: L('stack（高度遞增）', 'stack (increasing heights)'),
        items: stack.map(([, ht]) => ht),
        itemSub: stack.map(([s]) => L(`高度・起點 ${s}`, `height · start ${s}`)),
        dragPrefix: done ? undefined : 'k',
        dropId: done ? undefined : 'stack',
      },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'last area', value: last ? last[2] : '—' },
          { name: 'maxArea', value: best, highlight: true },
        ],
      },
      { kind: 'zones', id: 'zones', zones: [{ id: 'calc', label: L('📐 結算面積（pop）', '📐 Settle area (pop)'), tone: 'info' }] },
    ];
  },
  drag: {
    instructions: L(
      '今天的柱子比堆疊頂端矮，就把頂端拖到 📐 結算面積；否則把今天的柱子拖進 stack。全部掃完後，把堆疊剩下的柱子一根一根拖去結算。',
      "If today's bar is shorter than the stack top, drag the top to 📐 Settle; otherwise drag today's bar into the stack. After the scan, settle the remaining bars one by one.",
    ),
    moves(st) {
      const [a] = largestRectangle.correct(st);
      return a === 'pop' ? [{ action: a, from: `k:${st.stack.length - 1}`, to: 'calc' }] : [{ action: a, from: `b:${st.i}`, to: 'stack' }];
    },
    whyWrong(st, from, to) {
      const [kind, idxS] = from.split(':');
      const k = Number(idxS);
      if (kind === 'b') {
        if (k !== st.i) return st.i >= st.h.length ? L('柱子都掃完了。', 'All bars are scanned.') : L(`現在處理的是第 ${st.i} 根柱子（高 ${st.h[st.i]}）。`, `The current bar is #${st.i} (height ${st.h[st.i]}).`);
        if (to === 'calc') return L('今天的柱子還沒入堆疊，不能結算。要結算的是堆疊頂端。', "Today's bar isn't in the stack yet; settle the stack top instead.");
        return largestRectangle.whyWrong(st, 'push') ?? L('這一步不對。', 'Not quite.');
      }
      if (k !== st.stack.length - 1) return L('只能拿堆疊頂端。', 'Only the stack top can be taken.');
      return largestRectangle.whyWrong(st, 'pop') ?? L('這一步不對。', 'Not quite.');
    },
  },
  result: (st) => L(`最大面積 = ${st.best}`, `Largest area = ${st.best}`),
  code: `def largestRectangleArea(self, heights: List[int]) -> int:
    maxArea = 0
    stack = []  # pair: (start index, height)
    for i, h in enumerate(heights):
        start = i
        while stack and stack[-1][1] > h:
            index, height = stack.pop()
            maxArea = max(maxArea, height * (i - index))
            start = index
        stack.append((start, h))
    for i, h in stack:
        maxArea = max(maxArea, h * (len(heights) - i))
    return maxArea`,
  lineOf: { init: 2, pop: 8, push: 10 },
  answer: (st) => st.best,
  verify({ heights }, ans) {
    let best = 0;
    for (let a = 0; a < heights.length; a++) {
      let m = Infinity;
      for (let b = a; b < heights.length; b++) {
        m = Math.min(m, heights[b]);
        best = Math.max(best, m * (b - a + 1));
      }
    }
    return ans === best;
  },
};
