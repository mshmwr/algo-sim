import { randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';

type I = { height: number[] };
type S = { h: number[]; l: number; r: number; best: number };

const area = (h: number[], l: number, r: number) => Math.min(h[l], h[r]) * (r - l);

export const containerWater: Problem<I, S> = {
  id: 'container-with-most-water',
  number: 11,
  category: 'two-pointers',
  difficulty: 'Medium',
  title: L('盛最多水的容器', 'Container With Most Water'),
  description: L(
    '每個數字是一面牆的高度，選兩面牆和 x 軸組成容器，求能裝的最大水量。',
    'Each number is a wall height. Pick two walls that, together with the x-axis, hold the most water.',
  ),
  insight: L(
    '面積 = 較矮的牆 × 寬度。從最寬開始，每次移動較矮的那面牆。移動較高的牆時寬度變小，高度又被較矮的牆限制，面積不可能變大。',
    'Area = shorter wall × width. Start at the widest pair and always move the shorter wall. Moving the taller wall shrinks the width while the shorter wall still caps the height, so the area cannot grow.',
  ),
  complexity: { time: 'O(n)', space: 'O(1)', why: L('每一步移動較矮的牆，L 和 R 合起來最多走 n 步。暴力解要算每一對牆的面積，是 O(n²)。', 'Each step moves the shorter wall, so L and R take at most n steps in total. Checking every pair of walls is O(n²).') },
  examples: [{ height: [1, 8, 6, 2, 5, 4, 8, 3, 7] }, { height: [4, 3, 2, 1, 4] }, { height: [2, 3, 10, 5, 7, 8, 9] }],
  random: () => ({ height: Array.from({ length: randInt(6, 10) }, () => randInt(1, 9)) }),
  validate(x) {
    if (!isObj(x) || !isIntArray(x.height, 2, 20) || x.height.some((v) => v < 0 || v > 30))
      return err('需要 {"height": [0–30 的整數...]}，長度 2–20', 'Expected {"height": [ints 0–30]}, length 2–20');
    return null;
  },
  formatInput: (i) => `height = [${i.height.join(', ')}]`,

  init: ({ height }) => ({ h: height, l: 0, r: height.length - 1, best: area(height, 0, height.length - 1) }),
  isDone: (st) => st.l >= st.r,
  options: () => [
    { id: 'moveL', label: L('L 右移', 'Move L →') },
    { id: 'moveR', label: L('R 左移', 'Move R ←') },
  ],
  correct({ h, l, r }) {
    if (h[l] < h[r]) return ['moveL'];
    if (h[l] > h[r]) return ['moveR'];
    return ['moveR', 'moveL'];
  },
  apply(st, a) {
    const l = a === 'moveL' ? st.l + 1 : st.l;
    const r = a === 'moveR' ? st.r - 1 : st.r;
    const best = l < r ? Math.max(st.best, area(st.h, l, r)) : st.best;
    return { ...st, l, r, best };
  },
  explain({ h, l, r, best }, a) {
    if (h[l] === h[r])
      return L(`兩面牆一樣高（${h[l]}），移動哪一邊都可以。`, `Both walls have the same height (${h[l]}), so either side can move.`);
    const nl = a === 'moveL' ? l + 1 : l;
    const nr = a === 'moveR' ? r - 1 : r;
    const next = nl < nr ? area(h, nl, nr) : 0;
    const tail =
      nl < nr
        ? next > best
          ? L(`新面積 ${next}，刷新最大值！`, `New area ${next}, a new best!`)
          : L(`新面積 ${next}。`, `New area ${next}.`)
        : L('兩指標相遇，結束。', 'The pointers meet. Done.');
    const side = a === 'moveL' ? L('左', 'left') : L('右', 'right');
    return L(
      `${side.zh}邊較矮（${Math.min(h[l], h[r])}），它限制了水位，移動它才可能找到更高的牆。${tail.zh}`,
      `The ${side.en} wall is shorter (${Math.min(h[l], h[r])}) and caps the water level, so only moving it can help. ${tail.en}`,
    );
  },
  whyWrong({ h, l, r }) {
    const short = Math.min(h[l], h[r]);
    const tall = Math.max(h[l], h[r]);
    return L(
      `${tall} 是較高的牆。移動它會讓寬度變小，而高度仍被較矮的 ${short} 限制，面積只會變小。`,
      `${tall} is the taller wall. Moving it shrinks the width while the height stays capped by the shorter ${short}, so the area can only shrink.`,
    );
  },
  hints: ({ h, l, r }) => [
    L('面積 = min(左牆, 右牆) × 寬度。是哪一面牆限制了水位？', 'Area = min(left, right) × width. Which wall limits the water level?'),
    L(`height[L] = ${h[l]}，height[R] = ${h[r]}。`, `height[L] = ${h[l]}, height[R] = ${h[r]}.`),
  ],
  scene({ h, l, r, best }) {
    const done = l >= r;
    const marks: Record<number, CellMark> = {};
    h.forEach((_, k) => {
      if (k < l || k > r) marks[k] = 'gone';
    });
    if (!done) {
      marks[l] = 'focus';
      marks[r] = 'focus';
    }
    return [
      {
        kind: 'array',
        id: 'h',
        label: L('height（拖曳兩端的牆）', 'height (drag a wall at either end)'),
        values: h,
        bars: true,
        pointers: [
          { name: 'L', index: l, color: 'a' },
          { name: 'R', index: r, color: 'b' },
        ],
        window: l < r ? [l, r] : null,
        marks,
        dragPrefix: 'h',
        dragMask: h.map((_, k) => !done && k >= l && k <= r),
      },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'r - l', value: Math.max(0, r - l) },
          { name: 'min(h[L], h[R])', value: Math.min(h[l], h[r]) },
          { name: 'area', value: l < r ? area(h, l, r) : '—' },
          { name: 'res', value: best, highlight: true },
        ],
      },
      {
        kind: 'zones',
        id: 'zones',
        zones: [{ id: 'trash', label: L('🗑️ 丟掉（不可能圍出更大面積的牆）', "🗑️ Discard (a wall that can't give a bigger area)"), tone: 'trash' }],
      },
    ];
  },
  drag: {
    instructions: L(
      '面積 = 較矮的牆 × 寬度。看兩端的牆，把「留著也不可能圍出更大面積」的那一面拖進 🗑️。每丟一面，系統會算新的面積。',
      "Area = shorter wall × width. Look at the two end walls and drag the one that can't lead to a bigger area into 🗑️. Each discard computes the new area.",
    ),
    moves({ h, l, r }) {
      const L_ = { action: 'moveL', from: `h:${l}`, to: 'trash' };
      const R_ = { action: 'moveR', from: `h:${r}`, to: 'trash' };
      if (h[l] < h[r]) return [L_];
      if (h[l] > h[r]) return [R_];
      return [R_, L_];
    },
    whyWrong({ h, l, r }, from) {
      const k = Number(from.split(':')[1]);
      if (k !== l && k !== r)
        return L(`高度 ${h[k]} 的牆不在兩端。現在只比較最左邊的 ${h[l]} 和最右邊的 ${h[r]}。`, `The wall of height ${h[k]} isn't at an end. Compare only the leftmost ${h[l]} and the rightmost ${h[r]}.`);
      const short = Math.min(h[l], h[r]);
      const tall = Math.max(h[l], h[r]);
      return L(
        `${tall} 是較高的牆，要留著。丟掉它會讓寬度變小，而高度仍被較矮的 ${short} 限制，面積只會變小。該丟的是較矮的 ${short}。`,
        `${tall} is the taller wall, so keep it. Dropping it shrinks the width while the shorter ${short} still caps the height, so the area only shrinks. Discard the shorter ${short}.`,
      );
    },
  },
  result: (st) => L(`最大面積 = ${st.best}`, `Max area = ${st.best}`),
  code: `def maxArea(self, height: List[int]) -> int:
    l, r = 0, len(height) - 1
    res = 0
    while l < r:
        res = max(res, min(height[l], height[r]) * (r - l))
        if height[l] < height[r]:
            l += 1
        else:
            r -= 1
    return res`,
  lineOf: { init: 5, moveL: 7, moveR: 9 },
  answer: (st) => st.best,
  verify({ height }, ans) {
    let m = 0;
    for (let i = 0; i < height.length; i++) for (let j = i + 1; j < height.length; j++) m = Math.max(m, area(height, i, j));
    return ans === m;
  },
};
