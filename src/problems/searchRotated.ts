import { randInt } from '../core/engine';
import { L, TAP, type CellMark, type DragMove, type L10n, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';
import { sortedDistinct } from './binarySearch';

type I = { nums: number[]; target: number };
type S = { nums: number[]; target: number; l: number; r: number; done: boolean; ans: number | null };

const mid = (l: number, r: number) => Math.floor((l + r) / 2);

/** Which half the answer must be in, with the reason. */
function decide({ nums, target, l, r }: S): { act: 'found' | 'goLeft' | 'goRight' | 'notFound'; why: L10n } {
  if (l > r) return { act: 'notFound', why: L('L > R，範圍空了，target 不在陣列中。', 'L > R: the range is empty; target is not in the array.') };
  const m = mid(l, r);
  const v = nums[m];
  if (v === target) return { act: 'found', why: L(`nums[M] = ${v} 就是 target。`, `nums[M] = ${v} is the target.`) };
  if (nums[l] <= v) {
    const inLeft = nums[l] <= target && target < v;
    return {
      act: inLeft ? 'goLeft' : 'goRight',
      why: inLeft
        ? L(`左半 [${nums[l]} … ${v}] 是排好序的，而 ${target} 落在這個範圍內，所以答案在左半。`, `The left half [${nums[l]} … ${v}] is sorted and ${target} falls inside it, so the answer is on the left.`)
        : L(`左半 [${nums[l]} … ${v}] 是排好序的，但 ${target} 不在這個範圍內，所以答案只可能在右半。`, `The left half [${nums[l]} … ${v}] is sorted but ${target} isn't inside it, so the answer can only be on the right.`),
    };
  }
  const inRight = v < target && target <= nums[r];
  return {
    act: inRight ? 'goRight' : 'goLeft',
    why: inRight
      ? L(`右半 [${v} … ${nums[r]}] 是排好序的，而 ${target} 落在這個範圍內，所以答案在右半。`, `The right half [${v} … ${nums[r]}] is sorted and ${target} falls inside it, so the answer is on the right.`)
      : L(`右半 [${v} … ${nums[r]}] 是排好序的，但 ${target} 不在這個範圍內，所以答案只可能在左半。`, `The right half [${v} … ${nums[r]}] is sorted but ${target} isn't inside it, so the answer can only be on the left.`),
  };
}

export const searchRotated: Problem<I, S> = {
  id: 'search-in-rotated-sorted-array',
  number: 33,
  category: 'binary-search',
  difficulty: 'Medium',
  title: L('搜尋旋轉排序陣列', 'Search in Rotated Sorted Array'),
  description: L(
    '一個遞增、不重複的陣列被旋轉過（後段搬到前面）。用 O(log n) 找出 target 的索引，找不到回傳 -1。',
    'A sorted array of distinct numbers was rotated. Find the index of target in O(log n), or -1.',
  ),
  insight: L(
    '從 M 切開，左右兩半「至少有一半是排好序的」。比較 nums[L] 和 nums[M] 就知道是哪一半；再看 target 有沒有落在那一半的範圍內：有就往那邊找，沒有就往另一邊。',
    'Split at M: at least one half is always sorted. Compare nums[L] with nums[M] to see which; then check whether target falls inside that sorted range. If so search there, otherwise search the other half.',
  ),
  complexity: {
    time: 'O(log n)',
    space: 'O(1)',
    why: L(
      '每一步只多做幾次比較，就能和一般二分搜尋一樣丟掉一半。先找旋轉點再搜尋也是 O(log n)；直接掃一遍是 O(n)。',
      'Each step adds only a few comparisons and still discards half, like plain binary search. Finding the pivot first and then searching is also O(log n); a linear scan is O(n).',
    ),
  },
  examples: [
    { nums: [4, 5, 6, 7, 0, 1, 2], target: 0 },
    { nums: [4, 5, 6, 7, 0, 1, 2], target: 3 },
    { nums: [6, 7, 9, 12, 1, 3, 4, 5], target: 9 },
  ],
  random() {
    const a = sortedDistinct(randInt(6, 10), 0, 30);
    const k = randInt(0, a.length - 1);
    const nums = [...a.slice(k), ...a.slice(0, k)];
    return { nums, target: Math.random() < 0.75 ? nums[randInt(0, nums.length - 1)] : randInt(0, 30) };
  },
  validate(x) {
    if (!isObj(x) || !isIntArray(x.nums, 1, 16) || typeof x.target !== 'number') return err('需要 {"nums": [...], "target": 整數}，長度 1–16', 'Expected {"nums": [...], "target": int}, length 1–16');
    const a = x.nums;
    if (new Set(a).size !== a.length) return err('數字不能重複', 'Numbers must be distinct');
    if (a.length > 1 && a.filter((v, i) => v > a[(i + 1) % a.length]).length !== 1) return err('這不是一個旋轉過的排序陣列', 'This is not a rotated sorted array');
    return null;
  },
  formatInput: (i) => `nums = [${i.nums.join(', ')}], target = ${i.target}`,

  init: ({ nums, target }) => ({ nums, target, l: 0, r: nums.length - 1, done: false, ans: null }),
  isDone: (st) => st.done,
  options: () => [
    { id: 'goLeft', label: L('往左找：R = M - 1', 'Go left: R = M - 1') },
    { id: 'goRight', label: L('往右找：L = M + 1', 'Go right: L = M + 1') },
    { id: 'found', label: L('回傳 M', 'Return M') },
    { id: 'notFound', label: L('回傳 -1', 'Return -1') },
  ],
  correct: (st) => [decide(st).act],
  apply(st, a) {
    const m = mid(st.l, st.r);
    if (a === 'goLeft') return { ...st, r: m - 1 };
    if (a === 'goRight') return { ...st, l: m + 1 };
    return { ...st, done: true, ans: a === 'found' ? m : -1 };
  },
  explain(st, a) {
    const { why } = decide(st);
    const tail: Record<string, L10n> = {
      goLeft: L('丟掉 M 和右半，R = M - 1。', 'Drop M and the right half: R = M - 1.'),
      goRight: L('丟掉 M 和左半，L = M + 1。', 'Drop M and the left half: L = M + 1.'),
      found: L(`回傳 ${mid(st.l, st.r)}。`, `Return ${mid(st.l, st.r)}.`),
      notFound: L('回傳 -1。', 'Return -1.'),
    };
    return L(`${why.zh}${tail[a].zh}`, `${why.en} ${tail[a].en}`);
  },
  whyWrong(st, a) {
    const d = decide(st);
    if (d.act === 'notFound') return L('L > R，範圍已經空了。', 'L > R: the range is already empty.');
    if (a === 'notFound') return L('範圍還沒空。', 'The range is not empty yet.');
    if (d.act === 'found') return L(`nums[M] = ${st.nums[mid(st.l, st.r)]} 就是 target！`, `nums[M] = ${st.nums[mid(st.l, st.r)]} is the target!`);
    if (a === 'found') return L(`nums[M] = ${st.nums[mid(st.l, st.r)]} ≠ ${st.target}。`, `nums[M] = ${st.nums[mid(st.l, st.r)]} ≠ ${st.target}.`);
    return L(`方向反了。${d.why.zh}`, `Wrong side. ${d.why.en}`);
  },
  hints: (st) => {
    const { nums, l, r, target } = st;
    if (l > r) return [L('範圍還有東西嗎？', 'Is anything left in the range?'), L(`L = ${l}，R = ${r}。`, `L = ${l}, R = ${r}.`)];
    const m = mid(l, r);
    return [
      L('先判斷哪一半是排好序的（比較 nums[L] 和 nums[M]），再看 target 在不在那一半的範圍裡。', 'First find the sorted half (compare nums[L] with nums[M]), then check whether target lies in its range.'),
      L(`nums[L] = ${nums[l]}，nums[M] = ${nums[m]}，nums[R] = ${nums[r]}，target = ${target}。`, `nums[L] = ${nums[l]}, nums[M] = ${nums[m]}, nums[R] = ${nums[r]}, target = ${target}.`),
    ];
  },
  scene({ nums, target, l, r, done, ans }) {
    const m = mid(l, r);
    const marks: Record<number, CellMark> = {};
    nums.forEach((_, k) => {
      if (k < l || k > r) marks[k] = 'gone';
    });
    if (done && ans !== null && ans >= 0) marks[ans] = 'good';
    else if (l <= r) marks[m] = 'focus';
    const pointers: { name: string; index: number; color: 'a' | 'b' | 'c' }[] = [
      { name: 'L', index: l, color: 'a' },
      { name: 'R', index: r, color: 'b' },
    ];
    if (l <= r) pointers.push({ name: 'M', index: m, color: 'c' });
    const sorted = l <= r ? (nums[l] <= nums[m] ? L('左半有序', 'left half sorted') : L('右半有序', 'right half sorted')) : L('—', '—');
    return [
      { kind: 'array', id: 'nums', label: L('nums（抓住要丟的那一半裡任一格）', 'nums (grab any cell of the half to discard)'), values: nums, bars: true, pointers: done ? [] : pointers, marks, dragPrefix: 'n', dragMask: nums.map((_, k) => !done && k >= l && k <= r) },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'nums[M]', value: l <= r ? nums[m] : '—', highlight: true },
          { name: 'target', value: target },
          { name: 'sorted?', value: sorted.en },
        ],
      },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'dropLeft', label: L('🗑️⬅ 丟掉左半（L … M）', '🗑️⬅ Discard left half (L … M)'), tone: 'trash' },
          { id: 'dropRight', label: L('丟掉右半（M … R）➡🗑️', 'Discard right half (M … R) ➡🗑️'), tone: 'trash' },
          { id: 'found', label: L('🎯 找到了', '🎯 Found'), tone: 'good' },
          { id: 'none', label: L('✗ 回傳 -1', '✗ Return -1'), tone: 'bad' },
        ],
      },
    ];
  },
  drag: {
    instructions: L(
      '先看哪一半是排好序的，再判斷 target 在不在那半的範圍裡，把不可能的那一半抓起來拖進對應的 🗑️。M 就是 target 就拖到 🎯；範圍空了點 ✗。',
      "Find the sorted half, check whether target lies in its range, and drag the impossible half into its 🗑️. If M is target, drag it to 🎯; if the range is empty, tap ✗.",
    ),
    tapZones: ['none'],
    moves(st) {
      const { act } = decide(st);
      const { l, r } = st;
      const m = mid(l, r);
      if (act === 'notFound') return [{ action: act, from: TAP, to: 'none' }];
      if (act === 'found') return [{ action: act, from: `n:${m}`, to: 'found' }];
      const out: DragMove[] = [];
      if (act === 'goRight') for (let k = l; k <= m; k++) out.push({ action: act, from: `n:${k}`, to: 'dropLeft' });
      else for (let k = m; k <= r; k++) out.push({ action: act, from: `n:${k}`, to: 'dropRight' });
      return out;
    },
    whyWrong(st, from, to) {
      if (st.l > st.r || from === TAP || to === 'none') return searchRotated.whyWrong(st, 'notFound') ?? L('這一步不對。', 'Not quite.');
      const m = mid(st.l, st.r);
      const k = Number(from.split(':')[1]);
      if (to === 'found') return k !== m ? L(`要比對的是 nums[M] = ${st.nums[m]}。`, `Check nums[M] = ${st.nums[m]}.`) : (searchRotated.whyWrong(st, 'found') ?? L('', ''));
      const act = to === 'dropLeft' ? 'goRight' : 'goLeft';
      if (decide(st).act !== act) return searchRotated.whyWrong(st, act) ?? L('這一步不對。', 'Not quite.');
      return to === 'dropLeft' ? L(`${st.nums[k]} 在 M 右邊，不屬於左半。`, `${st.nums[k]} is right of M, not in the left half.`) : L(`${st.nums[k]} 在 M 左邊，不屬於右半。`, `${st.nums[k]} is left of M, not in the right half.`);
    },
  },
  result: (st) => L(`回傳 ${st.ans}`, `Returned ${st.ans}`),
  code: `def search(self, nums: List[int], target: int) -> int:
    l, r = 0, len(nums) - 1
    while l <= r:
        mid = (l + r) // 2
        if target == nums[mid]:
            return mid
        if nums[l] <= nums[mid]:  # left half sorted
            if nums[l] <= target < nums[mid]:
                r = mid - 1
            else:
                l = mid + 1
        else:                     # right half sorted
            if nums[mid] < target <= nums[r]:
                l = mid + 1
            else:
                r = mid - 1
    return -1`,
  lineOf: { init: 2, found: 6, goLeft: 9, goRight: 11, notFound: 17 },
  answer: (st) => st.ans,
  verify: ({ nums, target }, ans) => ans === nums.indexOf(target),
};
