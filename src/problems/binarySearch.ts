import { randInt } from '../core/engine';
import { L, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';

type I = { nums: number[]; target: number };
type S = { nums: number[]; target: number; l: number; r: number; done: boolean; ans: number | null };

const mid = (l: number, r: number) => l + Math.floor((r - l) / 2);

export const sortedDistinct = (n: number, lo = -10, hi = 40) => {
  const set = new Set<number>();
  while (set.size < n) set.add(randInt(lo, hi));
  return [...set].sort((a, b) => a - b);
};

export const binarySearch: Problem<I, S> = {
  id: 'binary-search',
  number: 704,
  category: 'binary-search',
  difficulty: 'Easy',
  title: L('二分搜尋', 'Binary Search'),
  description: L(
    '在由小到大排序、不重複的陣列中找 target，回傳它的索引；找不到就回傳 -1。',
    'Find target in a sorted array of distinct integers and return its index, or -1 if it is not there.',
  ),
  insight: L(
    '每次看搜尋範圍正中間的 M：比 target 小就丟掉左半，比 target 大就丟掉右半。範圍每次減半，L > R 代表範圍空了。',
    'Look at the middle M of the search range: too small → drop the left half, too big → drop the right half. The range halves each step; L > R means it is empty.',
  ),
  examples: [
    { nums: [-1, 0, 3, 5, 9, 12], target: 9 },
    { nums: [-1, 0, 3, 5, 9, 12], target: 2 },
    { nums: [1, 4, 6, 8, 11, 15, 19, 23, 27, 31], target: 23 },
  ],
  random() {
    const nums = sortedDistinct(randInt(7, 12));
    const target = Math.random() < 0.7 ? nums[randInt(0, nums.length - 1)] : randInt(-10, 40);
    return { nums, target };
  },
  validate(x) {
    if (!isObj(x) || !isIntArray(x.nums, 1, 20) || typeof x.target !== 'number')
      return err('需要 {"nums": [整數...], "target": 整數}，長度 1–20', 'Expected {"nums": [ints], "target": int}, length 1–20');
    if (!x.nums.every((v, i, a) => i === 0 || a[i - 1] < v)) return err('nums 必須嚴格遞增（不重複）', 'nums must be strictly increasing');
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
  correct({ nums, target, l, r }) {
    if (l > r) return ['notFound'];
    const v = nums[mid(l, r)];
    if (v === target) return ['found'];
    return v < target ? ['goRight'] : ['goLeft'];
  },
  apply(st, a) {
    const m = mid(st.l, st.r);
    if (a === 'goLeft') return { ...st, r: m - 1 };
    if (a === 'goRight') return { ...st, l: m + 1 };
    if (a === 'found') return { ...st, done: true, ans: m };
    return { ...st, done: true, ans: -1 };
  },
  explain({ nums, target, l, r }, a) {
    const m = mid(l, r);
    const v = nums[m];
    if (a === 'goRight')
      return L(`nums[M] = ${v} < ${target}，M 和它左邊都太小，只能在右半邊。L = M + 1。`, `nums[M] = ${v} < ${target}: M and everything left of it are too small. Search right: L = M + 1.`);
    if (a === 'goLeft')
      return L(`nums[M] = ${v} > ${target}，M 和它右邊都太大，只能在左半邊。R = M - 1。`, `nums[M] = ${v} > ${target}: M and everything right of it are too big. Search left: R = M - 1.`);
    if (a === 'found') return L(`nums[M] = ${v} 正是 target，回傳 ${m}。`, `nums[M] = ${v} is the target. Return ${m}.`);
    return L('L > R，搜尋範圍已經空了，target 不在陣列中，回傳 -1。', 'L > R: the search range is empty, so target is not in the array. Return -1.');
  },
  whyWrong({ nums, target, l, r }, a) {
    if (l > r) return L('L > R，搜尋範圍已經空了。', 'L > R: the search range is already empty.');
    if (a === 'notFound') return L('L ≤ R，範圍還沒空，還不能放棄。', 'L ≤ R: the range is not empty yet, so keep searching.');
    const v = nums[mid(l, r)];
    if (v === target) return L(`nums[M] = ${v} 就是 target！`, `nums[M] = ${v} is the target!`);
    if (a === 'found') return L(`${v} ≠ ${target}。`, `${v} ≠ ${target}.`);
    if (a === 'goLeft') return L(`nums[M] = ${v} 比 target 小，左半邊的數字更小，不可能有答案。`, `nums[M] = ${v} is smaller than target. The left half is even smaller, so the answer can't be there.`);
    return L(`nums[M] = ${v} 比 target 大，右半邊的數字更大，不可能有答案。`, `nums[M] = ${v} is bigger than target. The right half is even bigger, so the answer can't be there.`);
  },
  hints: ({ nums, target, l, r }) => [
    l > r
      ? L('看看 L 和 R：搜尋範圍還有東西嗎？', 'Look at L and R: is anything left in the range?')
      : L('把 nums[M] 和 target 比大小。', 'Compare nums[M] with target.'),
    l > r
      ? L(`L = ${l}，R = ${r}。`, `L = ${l}, R = ${r}.`)
      : L(`nums[M] = ${nums[mid(l, r)]}，target = ${target}。`, `nums[M] = ${nums[mid(l, r)]}, target = ${target}.`),
  ],
  scene({ nums, target, l, r, done, ans }) {
    const m = mid(l, r);
    const pointers: { name: string; index: number; color: 'a' | 'b' | 'c' }[] = [
      { name: 'L', index: l, color: 'a' },
      { name: 'R', index: r, color: 'b' },
    ];
    if (l <= r) pointers.push({ name: 'M', index: m, color: 'c' });
    return [
      {
        kind: 'array',
        id: 'nums',
        label: L('nums', 'nums'),
        values: nums,
        pointers,
        active: l <= r ? [l, r] : null,
        marks: done && ans !== null && ans >= 0 ? { [ans]: 'good' } : l <= r ? { [m]: 'focus' } : {},
      },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'M = (L + R) // 2', value: l <= r ? m : '—' },
          { name: 'nums[M]', value: l <= r ? nums[m] : '—', highlight: true },
          { name: 'target', value: target },
        ],
      },
    ];
  },
  result: (st) => L(`回傳 ${st.ans}`, `Returned ${st.ans}`),
  code: `def search(self, nums: List[int], target: int) -> int:
    l, r = 0, len(nums) - 1
    while l <= r:
        m = l + (r - l) // 2
        if nums[m] > target:
            r = m - 1
        elif nums[m] < target:
            l = m + 1
        else:
            return m
    return -1`,
  lineOf: { init: 2, goLeft: 6, goRight: 8, found: 10, notFound: 11 },
  answer: (st) => st.ans,
  verify: ({ nums, target }, ans) => ans === nums.indexOf(target),
};
