import { randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
import { err, isIntArray, isObj, isSorted } from './helpers';

type I = { nums1: number[]; nums2: number[] };
/** A is the shorter array. i = how many of A go to the left half (searched in [lo, hi]). */
type S = { A: number[]; B: number[]; lo: number; hi: number; done: boolean; median: number | null };

const half = (st: S) => Math.floor((st.A.length + st.B.length + 1) / 2);
const cut = (st: S) => {
  const i = Math.floor((st.lo + st.hi) / 2);
  const j = half(st) - i;
  const { A, B } = st;
  return {
    i,
    j,
    Al: i > 0 ? A[i - 1] : -Infinity,
    Ar: i < A.length ? A[i] : Infinity,
    Bl: j > 0 ? B[j - 1] : -Infinity,
    Br: j < B.length ? B[j] : Infinity,
  };
};
const show = (v: number) => (v === Infinity ? '+∞' : v === -Infinity ? '−∞' : String(v));
const medianOf = (st: S) => {
  const { Al, Ar, Bl, Br } = cut(st);
  const total = st.A.length + st.B.length;
  return total % 2 ? Math.max(Al, Bl) : (Math.max(Al, Bl) + Math.min(Ar, Br)) / 2;
};

export const medianTwoArrays: Problem<I, S> = {
  id: 'median-of-two-sorted-arrays',
  number: 4,
  category: 'binary-search',
  difficulty: 'Hard',
  title: L('尋找兩個正序陣列的中位數', 'Median of Two Sorted Arrays'),
  description: L('兩個已排序的陣列，用 O(log(m+n)) 找出合併後的中位數。', 'Given two sorted arrays, find the median of their union in O(log(m+n)).'),
  insight: L(
    '把兩個陣列各切一刀，讓「左半」剛好有一半的數。只要 A 左邊最大 ≤ B 右邊最小，而且 B 左邊最大 ≤ A 右邊最小，左半就全部 ≤ 右半，中位數就在切口旁邊。A 切幾個決定了 B 切幾個，所以只要對 A 的切點做二分搜尋。',
    "Cut each array once so the left side holds exactly half the numbers. If A's left max ≤ B's right min and B's left max ≤ A's right min, the whole left side is ≤ the right side and the median sits at the cut. A's cut determines B's, so binary-search only A's cut.",
  ),
  complexity: {
    time: 'O(log(min(m, n)))',
    space: 'O(1)',
    why: L(
      '只在較短的陣列上對切點做二分搜尋，每一步砍半。直接合併兩個陣列再取中間是 O(m + n)。',
      'Binary search runs over cut positions of the shorter array only, halving each step. Merging both arrays and taking the middle is O(m + n).',
    ),
  },
  examples: [
    { nums1: [1, 3], nums2: [2] },
    { nums1: [1, 2], nums2: [3, 4] },
    { nums1: [1, 3, 8, 9, 15], nums2: [7, 11, 18, 19, 21, 25] },
  ],
  random() {
    const mk = (n: number) => Array.from({ length: n }, () => randInt(0, 25)).sort((a, b) => a - b);
    return { nums1: mk(randInt(1, 5)), nums2: mk(randInt(1, 6)) };
  },
  validate(x) {
    if (!isObj(x) || !isIntArray(x.nums1, 0, 10) || !isIntArray(x.nums2, 0, 10)) return err('需要 {"nums1": [...], "nums2": [...]}，各 0–10 個', 'Expected {"nums1": [...], "nums2": [...]}, 0–10 each');
    if (x.nums1.length + x.nums2.length === 0) return err('至少要有一個數字', 'At least one number is required');
    if (!isSorted(x.nums1) || !isSorted(x.nums2)) return err('兩個陣列都必須由小到大排序', 'Both arrays must be sorted ascending');
    return null;
  },
  formatInput: (i) => `nums1 = [${i.nums1.join(', ')}], nums2 = [${i.nums2.join(', ')}]`,

  init({ nums1, nums2 }) {
    const [A, B] = nums1.length <= nums2.length ? [nums1, nums2] : [nums2, nums1];
    return { A, B, lo: 0, hi: A.length, done: false, median: null };
  },
  isDone: (st) => st.done,
  options: () => [
    { id: 'left', label: L('A 的切點往左', "Move A's cut left") },
    { id: 'right', label: L('A 的切點往右', "Move A's cut right") },
    { id: 'found', label: L('切對了，算中位數', 'Cut is right: compute the median') },
  ],
  correct(st) {
    const { Al, Ar, Bl, Br } = cut(st);
    if (Al > Br) return ['left'];
    if (Bl > Ar) return ['right'];
    return ['found'];
  },
  apply(st, a) {
    const { i } = cut(st);
    if (a === 'left') return { ...st, hi: i - 1 };
    if (a === 'right') return { ...st, lo: i + 1 };
    return { ...st, done: true, median: medianOf(st) };
  },
  explain(st, a) {
    const { i, j, Al, Ar, Bl, Br } = cut(st);
    if (a === 'left')
      return L(`A 左邊最大 ${show(Al)} > B 右邊最小 ${show(Br)}：A 拿太多了，切點往左（hi = ${i - 1}）。`, `A's left max ${show(Al)} > B's right min ${show(Br)}: A gave too many. Move the cut left (hi = ${i - 1}).`);
    if (a === 'right')
      return L(`B 左邊最大 ${show(Bl)} > A 右邊最小 ${show(Ar)}：A 拿太少了，切點往右（lo = ${i + 1}）。`, `B's left max ${show(Bl)} > A's right min ${show(Ar)}: A gave too few. Move the cut right (lo = ${i + 1}).`);
    const total = st.A.length + st.B.length;
    return total % 2
      ? L(`A 切 ${i} 個、B 切 ${j} 個，左半全部 ≤ 右半。總數是奇數，中位數 = 左半最大 = max(${show(Al)}, ${show(Bl)}) = ${medianOf(st)}。`, `A gives ${i}, B gives ${j}; the left side is all ≤ the right. Odd total: median = left max = max(${show(Al)}, ${show(Bl)}) = ${medianOf(st)}.`)
      : L(
          `A 切 ${i} 個、B 切 ${j} 個，左半全部 ≤ 右半。總數是偶數，中位數 = (max(${show(Al)}, ${show(Bl)}) + min(${show(Ar)}, ${show(Br)})) / 2 = ${medianOf(st)}。`,
          `A gives ${i}, B gives ${j}; the left side is all ≤ the right. Even total: median = (max(${show(Al)}, ${show(Bl)}) + min(${show(Ar)}, ${show(Br)})) / 2 = ${medianOf(st)}.`,
        );
  },
  whyWrong(st, a) {
    const { Al, Ar, Bl, Br } = cut(st);
    const ok = L(`A 左邊 ${show(Al)} ≤ B 右邊 ${show(Br)}，B 左邊 ${show(Bl)} ≤ A 右邊 ${show(Ar)}：已經切對了！`, `A-left ${show(Al)} ≤ B-right ${show(Br)} and B-left ${show(Bl)} ≤ A-right ${show(Ar)}: the cut is already right!`);
    const want = medianTwoArrays.correct(st)[0];
    if (want === 'found') return ok;
    if (a === 'found')
      return want === 'left' ? L(`A 左邊最大 ${show(Al)} > B 右邊最小 ${show(Br)}，左半還有比右半大的數。`, `A's left max ${show(Al)} > B's right min ${show(Br)}: the left side still has a number bigger than the right.`) : L(`B 左邊最大 ${show(Bl)} > A 右邊最小 ${show(Ar)}，左半還有比右半大的數。`, `B's left max ${show(Bl)} > A's right min ${show(Ar)}: the left side still has a number bigger than the right.`);
    return a === 'right'
      ? L(`A 左邊最大 ${show(Al)} 已經比 B 右邊最小 ${show(Br)} 大了，A 給太多，再往右只會更糟。`, `A's left max ${show(Al)} already exceeds B's right min ${show(Br)}; A gives too many, moving right makes it worse.`)
      : L(`B 左邊最大 ${show(Bl)} 比 A 右邊最小 ${show(Ar)} 大，A 給太少，往左只會更少。`, `B's left max ${show(Bl)} exceeds A's right min ${show(Ar)}; A gives too few, moving left gives even fewer.`);
  },
  hints: (st) => {
    const { Al, Ar, Bl, Br } = cut(st);
    return [
      L('檢查切口兩側：A 左邊 ≤ B 右邊？B 左邊 ≤ A 右邊？', 'Check across the cut: A-left ≤ B-right? B-left ≤ A-right?'),
      L(`A 左 ${show(Al)}、A 右 ${show(Ar)}、B 左 ${show(Bl)}、B 右 ${show(Br)}。`, `A-left ${show(Al)}, A-right ${show(Ar)}, B-left ${show(Bl)}, B-right ${show(Br)}.`),
    ];
  },
  scene(st) {
    const { A, B, lo, hi, done } = st;
    const { i, j, Al, Ar, Bl, Br } = cut(st);
    const mk = (arr: number[], c: number): Record<number, CellMark> => {
      const m: Record<number, CellMark> = {};
      if (c > 0) m[c - 1] = 'focus';
      if (c < arr.length) m[c] = 'focus';
      return m;
    };
    return [
      { kind: 'array', id: 'A', label: L(`A（較短）：左半拿 ${i} 個（藍色）`, `A (shorter): ${i} go left (blue)`), values: A.length ? A : ['·'], window: i > 0 ? [0, i - 1] : null, marks: mk(A, i), pointers: [{ name: '✂', index: i, color: 'c' }] },
      { kind: 'array', id: 'B', label: L(`B：左半拿 ${j} 個（藍色）`, `B: ${j} go left (blue)`), values: B, window: j > 0 ? [0, j - 1] : null, marks: mk(B, j), pointers: [{ name: '✂', index: j, color: 'c' }] },
      { kind: 'array', id: 'cut', label: L(`A 的切點（搜尋範圍 ${lo} … ${hi}）`, `A's cut (search range ${lo} … ${hi})`), values: [`✂ ${i}`], dragPrefix: done ? undefined : 'x', dragLabels: [`✂ ${i}`] },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'Aleft', value: show(Al), highlight: Al > Br },
          { name: 'Aright', value: show(Ar), highlight: Bl > Ar },
          { name: 'Bleft', value: show(Bl), highlight: Bl > Ar },
          { name: 'Bright', value: show(Br), highlight: Al > Br },
        ],
      },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'left', label: L('⬅ A 的切點往左', "⬅ Move A's cut left"), tone: 'info' },
          { id: 'right', label: L('A 的切點往右 ➡', "Move A's cut right ➡"), tone: 'info' },
          { id: 'ok', label: L('✓ 切對了，算中位數', '✓ Cut is right: median'), tone: 'good' },
        ],
      },
    ];
  },
  drag: {
    instructions: L(
      '檢查切口兩側：A 左邊比 B 右邊大，就把 ✂ 拖到「往左」；B 左邊比 A 右邊大，就拖到「往右」；兩個條件都成立，拖到 ✓ 算中位數。',
      'Check across the cut: if A-left > B-right, drag ✂ to "left"; if B-left > A-right, drag it to "right"; if both conditions hold, drag it to ✓ to compute the median.',
    ),
    moves: (st) => {
      const [a] = medianTwoArrays.correct(st);
      return [{ action: a, from: 'x:0', to: a === 'found' ? 'ok' : a }];
    },
    whyWrong: (st, _from, to) => medianTwoArrays.whyWrong(st, to === 'ok' ? 'found' : to) ?? L('這一步不對。', 'Not quite.'),
  },
  result: (st) => L(`中位數 = ${st.median}`, `Median = ${st.median}`),
  code: `def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
    A, B = nums1, nums2
    if len(A) > len(B):
        A, B = B, A
    total = len(A) + len(B)
    half = (total + 1) // 2
    lo, hi = 0, len(A)
    while lo <= hi:
        i = (lo + hi) // 2      # taken from A
        j = half - i            # taken from B
        Aleft = A[i - 1] if i > 0 else float("-inf")
        Aright = A[i] if i < len(A) else float("inf")
        Bleft = B[j - 1] if j > 0 else float("-inf")
        Bright = B[j] if j < len(B) else float("inf")
        if Aleft > Bright:
            hi = i - 1
        elif Bleft > Aright:
            lo = i + 1
        else:
            if total % 2:
                return max(Aleft, Bleft)
            return (max(Aleft, Bleft) + min(Aright, Bright)) / 2`,
  lineOf: { init: 7, left: 16, right: 18, found: 22 },
  answer: (st) => st.median,
  verify({ nums1, nums2 }, ans) {
    const all = [...nums1, ...nums2].sort((a, b) => a - b);
    const n = all.length;
    const exp = n % 2 ? all[(n - 1) / 2] : (all[n / 2 - 1] + all[n / 2]) / 2;
    return ans === exp;
  },
};
