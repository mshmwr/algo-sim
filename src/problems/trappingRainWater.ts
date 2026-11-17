import { randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';

type I = { height: number[] };
type S = { h: number[]; l: number; r: number; lMax: number; rMax: number; water: number[]; res: number };

export const trappingRainWater: Problem<I, S> = {
  id: 'trapping-rain-water',
  number: 42,
  category: 'two-pointers',
  difficulty: 'Hard',
  title: L('接雨水', 'Trapping Rain Water'),
  description: L(
    '每個數字是一根柱子的高度，下雨後柱子之間能積多少水？',
    'Each number is the height of a bar. After it rains, how much water is trapped between the bars?',
  ),
  insight: L(
    '一格的水位 = min(左邊最高, 右邊最高) − 自己的高度。L、R 從兩端往內走，並各自記住看過的最高牆。哪一邊的最高牆比較矮，那一邊下一格的水位就已經確定（另一邊一定有更高的牆擋著），可以直接結算。',
    "A cell holds min(highest on its left, highest on its right) − its own height. Walk L and R inward, tracking the highest wall each has seen. Whichever side's max is lower, the next cell on that side is settled: the other side is guaranteed to have a taller wall.",
  ),
  complexity: {
    time: 'O(n)',
    space: 'O(1)',
    why: L(
      '每根柱子只被 L 或 R 結算一次，只記 leftMax、rightMax 兩個數。另一種做法是先算好每格的左右最高（前綴最大值），也是 O(n) 時間，但要 O(n) 空間；暴力解對每格往兩邊找最高是 O(n²)。',
      'Each bar is settled once by L or R, and only leftMax and rightMax are stored. Precomputing left/right maxima per cell is also O(n) time but O(n) space; scanning both ways from every cell is O(n²).',
    ),
  },
  examples: [{ height: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] }, { height: [4, 2, 0, 3, 2, 5] }, { height: [3, 0, 2, 0, 4] }],
  random: () => ({ height: Array.from({ length: randInt(7, 11) }, () => randInt(0, 5)) }),
  validate(x) {
    if (!isObj(x) || !isIntArray(x.height, 1, 20) || x.height.some((v) => v < 0 || v > 20))
      return err('需要 {"height": [0–20 的整數...]}，長度 1–20', 'Expected {"height": [ints 0–20]}, length 1–20');
    return null;
  },
  formatInput: (i) => `height = [${i.height.join(', ')}]`,

  init: ({ height }) => ({
    h: height,
    l: 0,
    r: height.length - 1,
    lMax: height[0] ?? 0,
    rMax: height[height.length - 1] ?? 0,
    water: height.map(() => 0),
    res: 0,
  }),
  // When L and R are adjacent no cell is left between them (the reference loop's last step adds 0).
  isDone: (st) => st.r - st.l <= 1,
  options: () => [
    { id: 'moveL', label: L('結算左邊下一格（L 右移）', 'Settle next on the left (L →)') },
    { id: 'moveR', label: L('結算右邊下一格（R 左移）', 'Settle next on the right (R ←)') },
  ],
  correct: ({ lMax, rMax }) => (lMax < rMax ? ['moveL'] : lMax > rMax ? ['moveR'] : ['moveR', 'moveL']),
  apply(st, act) {
    const water = [...st.water];
    if (act === 'moveL') {
      const l = st.l + 1;
      const lMax = Math.max(st.lMax, st.h[l]);
      water[l] = lMax - st.h[l];
      return { ...st, l, lMax, water, res: st.res + water[l] };
    }
    const r = st.r - 1;
    const rMax = Math.max(st.rMax, st.h[r]);
    water[r] = rMax - st.h[r];
    return { ...st, r, rMax, water, res: st.res + water[r] };
  },
  explain({ h, l, r, lMax, rMax }, act) {
    const left = act === 'moveL';
    const k = left ? l + 1 : r - 1;
    const m = left ? Math.max(lMax, h[k]) : Math.max(rMax, h[k]);
    const w = m - h[k];
    const why = lMax === rMax
      ? L(`兩邊最高一樣（${lMax}），結算哪一邊都可以。`, `Both maxima are equal (${lMax}), so either side works.`)
      : left
        ? L(`左邊最高 ${lMax} < 右邊最高 ${rMax}，右邊一定有更高的牆，所以左邊下一格的水位只看 leftMax。`, `leftMax ${lMax} < rightMax ${rMax}; the right side surely has a taller wall, so the next left cell depends only on leftMax.`)
        : L(`右邊最高 ${rMax} < 左邊最高 ${lMax}，左邊一定有更高的牆，所以右邊下一格的水位只看 rightMax。`, `rightMax ${rMax} < leftMax ${lMax}; the left side surely has a taller wall, so the next right cell depends only on rightMax.`);
    const fill = w > 0
      ? L(`第 ${k} 格高 ${h[k]}，水位 ${m}，積水 ${w}。`, `Cell ${k} is ${h[k]} tall with water level ${m}: ${w} unit(s) of water.`)
      : L(`第 ${k} 格高 ${h[k]}，沒有比牆矮，不積水${h[k] > (left ? lMax : rMax) ? '，而且它成為新的最高牆' : ''}。`, `Cell ${k} is ${h[k]} tall and not below the wall, so no water${h[k] > (left ? lMax : rMax) ? '; it becomes the new max' : ''}.`);
    return L(`${why.zh}${fill.zh}`, `${why.en} ${fill.en}`);
  },
  whyWrong({ lMax, rMax }, act) {
    if (act === 'moveL')
      return L(
        `左邊最高 ${lMax} 比右邊最高 ${rMax} 高。左邊下一格的水位還不確定（右邊可能沒有更高的牆），應該結算右邊。`,
        `leftMax ${lMax} is above rightMax ${rMax}. The next left cell isn't settled yet (the right side may lack a taller wall). Settle the right side.`,
      );
    return L(
      `右邊最高 ${rMax} 比左邊最高 ${lMax} 高。右邊下一格的水位還不確定，應該結算左邊。`,
      `rightMax ${rMax} is above leftMax ${lMax}. The next right cell isn't settled yet. Settle the left side.`,
    );
  },
  hints: ({ lMax, rMax }) => [
    L('比較 leftMax 和 rightMax：哪一邊的水位已經確定？', 'Compare leftMax and rightMax: which side is already settled?'),
    L(`leftMax = ${lMax}，rightMax = ${rMax}。`, `leftMax = ${lMax}, rightMax = ${rMax}.`),
  ],
  scene({ h, l, r, lMax, rMax, water, res }) {
    const done = r - l <= 1;
    const marks: Record<number, CellMark> = {};
    h.forEach((_, k) => {
      if (k < l || k > r) marks[k] = 'done';
    });
    if (!done) {
      marks[l + 1] = 'focus';
      marks[r - 1] = 'focus';
    }
    return [
      {
        kind: 'array',
        id: 'h',
        label: L('height（藍色是積水）', 'height (blue is water)'),
        values: h,
        bars: true,
        water,
        pointers: [
          { name: 'L', index: l, color: 'a' },
          { name: 'R', index: r, color: 'b' },
        ],
        marks,
        dragPrefix: 'h',
        dragMask: h.map((_, k) => !done && k > l && k < r),
      },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'leftMax', value: lMax, highlight: lMax <= rMax },
          { name: 'rightMax', value: rMax, highlight: rMax <= lMax },
          { name: 'res', value: res },
        ],
      },
      {
        kind: 'zones',
        id: 'zones',
        zones: [{ id: 'settle', label: L('💧 結算這一格的水量', '💧 Settle this cell'), tone: 'info' }],
      },
    ];
  },
  drag: {
    instructions: L(
      '看 leftMax 和 rightMax：比較矮的那一邊，下一格的水位已經確定。把那一格（緊鄰 L 或 R 的下一根柱子）拖到 💧 結算。',
      'Compare leftMax and rightMax: on the lower side, the next cell is settled. Drag that cell (the bar right next to L or R) onto 💧 Settle.',
    ),
    moves({ l, r, lMax, rMax }) {
      const mL = { action: 'moveL', from: `h:${l + 1}`, to: 'settle' };
      const mR = { action: 'moveR', from: `h:${r - 1}`, to: 'settle' };
      if (l + 1 === r - 1) {
        // the last unsettled cell is next to both pointers
        return [{ ...(lMax < rMax ? mL : mR), from: `h:${l + 1}` }, ...(lMax === rMax ? [mL] : [])];
      }
      return lMax < rMax ? [mL] : lMax > rMax ? [mR] : [mR, mL];
    },
    whyWrong({ h, l, r, lMax, rMax }, from) {
      const k = Number(from.split(':')[1]);
      if (k !== l + 1 && k !== r - 1)
        return L(`第 ${k} 格不緊鄰 L 或 R。只能結算 L 右邊或 R 左邊的下一格。`, `Cell ${k} isn't next to L or R. Only the cell right after L or right before R can be settled.`);
      if (k === l + 1)
        return L(
          `leftMax ${lMax} > rightMax ${rMax}：第 ${k} 格（高 ${h[k]}）的水位還不確定，右邊可能沒有夠高的牆。先結算右邊。`,
          `leftMax ${lMax} > rightMax ${rMax}: cell ${k} (height ${h[k]}) isn't settled; the right side may lack a tall enough wall. Settle the right side first.`,
        );
      return L(
        `rightMax ${rMax} > leftMax ${lMax}：第 ${k} 格（高 ${h[k]}）的水位還不確定。先結算左邊。`,
        `rightMax ${rMax} > leftMax ${lMax}: cell ${k} (height ${h[k]}) isn't settled. Settle the left side first.`,
      );
    },
  },
  result: (st) => L(`總共積水 ${st.res}`, `Total water: ${st.res}`),
  code: `def trap(self, height: List[int]) -> int:
    l, r = 0, len(height) - 1
    leftMax, rightMax = height[l], height[r]
    res = 0
    while l < r:
        if leftMax < rightMax:
            l += 1
            leftMax = max(leftMax, height[l])
            res += leftMax - height[l]
        else:
            r -= 1
            rightMax = max(rightMax, height[r])
            res += rightMax - height[r]
    return res`,
  lineOf: { init: 2, moveL: 9, moveR: 13 },
  answer: (st) => st.res,
  verify({ height }, ans) {
    let total = 0;
    for (let k = 0; k < height.length; k++) {
      const lm = Math.max(...height.slice(0, k + 1));
      const rm = Math.max(...height.slice(k));
      total += Math.min(lm, rm) - height[k];
    }
    return ans === total;
  },
};
