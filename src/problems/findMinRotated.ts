import { randInt } from '../core/engine';
import { L, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';
import { sortedDistinct } from './binarySearch';

type I = { nums: number[] };
type S = { nums: number[]; l: number; r: number; done: boolean };

const mid = (l: number, r: number) => Math.floor((l + r) / 2);

export const findMinRotated: Problem<I, S> = {
  id: 'find-minimum-in-rotated-sorted-array',
  number: 153,
  category: 'binary-search',
  difficulty: 'Medium',
  title: L('尋找旋轉排序陣列中的最小值', 'Find Minimum in Rotated Sorted Array'),
  description: L(
    '一個遞增且不重複的陣列被「旋轉」過（後段搬到前面），用 O(log n) 找出最小值。',
    'A sorted array of distinct numbers was rotated (a suffix moved to the front). Find the minimum in O(log n).',
  ),
  insight: L(
    '把 nums[M] 和 nums[R] 比：nums[M] > nums[R] 代表 M 在前面那段較大的區塊，最小值在 M 右邊；否則 M 到 R 是遞增的，最小值在 M 或它左邊。',
    'Compare nums[M] with nums[R]. If nums[M] > nums[R], M is in the larger left block and the minimum is to its right. Otherwise M..R is increasing, so the minimum is at M or to its left.',
  ),
  examples: [{ nums: [3, 4, 5, 1, 2] }, { nums: [4, 5, 6, 7, 0, 1, 2] }, { nums: [11, 13, 15, 17] }],
  random() {
    const a = sortedDistinct(randInt(6, 11), 1, 30);
    const k = randInt(0, a.length - 1);
    return { nums: [...a.slice(k), ...a.slice(0, k)] };
  },
  validate(x) {
    if (!isObj(x) || !isIntArray(x.nums, 1, 20)) return err('需要 {"nums": [整數...]}，長度 1–20', 'Expected {"nums": [ints]}, length 1–20');
    const a = x.nums;
    if (new Set(a).size !== a.length) return err('數字不能重複', 'Numbers must be distinct');
    const drops = a.filter((v, i) => v > a[(i + 1) % a.length]).length;
    if (a.length > 1 && drops !== 1) return err('這不是一個旋轉過的排序陣列', 'This is not a rotated sorted array');
    return null;
  },
  formatInput: (i) => `nums = [${i.nums.join(', ')}]`,

  init: ({ nums }) => ({ nums, l: 0, r: nums.length - 1, done: false }),
  isDone: (st) => st.done,
  options: () => [
    { id: 'goLeft', label: L('往左縮：R = M', 'Shrink left: R = M') },
    { id: 'goRight', label: L('往右找：L = M + 1', 'Go right: L = M + 1') },
    { id: 'return', label: L('回傳 nums[L]', 'Return nums[L]') },
  ],
  correct({ nums, l, r }) {
    if (l === r) return ['return'];
    return nums[mid(l, r)] > nums[r] ? ['goRight'] : ['goLeft'];
  },
  apply(st, a) {
    const m = mid(st.l, st.r);
    if (a === 'goRight') return { ...st, l: m + 1 };
    if (a === 'goLeft') return { ...st, r: m };
    return { ...st, done: true };
  },
  explain({ nums, l, r }, a) {
    const m = mid(l, r);
    if (a === 'goRight')
      return L(
        `nums[M] = ${nums[m]} > nums[R] = ${nums[r]}：M 在前段較大的區塊，「斷點」在 M 右邊，最小值也是。L = M + 1。`,
        `nums[M] = ${nums[m]} > nums[R] = ${nums[r]}: M is in the larger front block, so the drop and the minimum are to its right. L = M + 1.`,
      );
    if (a === 'goLeft')
      return L(
        `nums[M] = ${nums[m]} < nums[R] = ${nums[r]}：M 到 R 是遞增的，最小值在 M 或 M 的左邊。R = M（M 本身可能就是答案，所以不減 1）。`,
        `nums[M] = ${nums[m]} < nums[R] = ${nums[r]}: M..R is increasing, so the minimum is at M or to its left. R = M (M itself may be the answer, so no -1).`,
      );
    return L(`L == R，範圍只剩一個數字 ${nums[l]}，它就是最小值。`, `L == R: only ${nums[l]} remains, and it is the minimum.`);
  },
  whyWrong({ nums, l, r }, a) {
    if (l === r) return L('L == R，範圍只剩一個了。', 'L == R: only one element remains.');
    if (a === 'return') return L('L < R，範圍裡還有好幾個數字，還不確定誰最小。', 'L < R: several numbers remain, so the minimum is not certain yet.');
    const m = mid(l, r);
    if (a === 'goLeft')
      return L(`nums[M] = ${nums[m]} 比 nums[R] = ${nums[r]} 大，代表 M 到 R 之間有「斷點」，最小值在右邊。`, `nums[M] = ${nums[m]} is bigger than nums[R] = ${nums[r]}, so there is a drop between M and R. The minimum is to the right.`);
    return L(`nums[M] = ${nums[m]} 比 nums[R] = ${nums[r]} 小，M 到 R 是遞增的，右邊不會有更小的數。`, `nums[M] = ${nums[m]} is smaller than nums[R] = ${nums[r]}. M..R is increasing, so nothing smaller is on the right.`);
  },
  hints: ({ nums, l, r }) => [
    l === r
      ? L('看看 L 和 R 是不是同一個位置。', 'Check whether L and R are the same position.')
      : L('把 nums[M] 和 nums[R] 比大小。', 'Compare nums[M] with nums[R].'),
    L(`nums[M] = ${nums[mid(l, r)]}，nums[R] = ${nums[r]}。`, `nums[M] = ${nums[mid(l, r)]}, nums[R] = ${nums[r]}.`),
  ],
  scene({ nums, l, r, done }) {
    const m = mid(l, r);
    const pointers: { name: string; index: number; color: 'a' | 'b' | 'c' }[] = [
      { name: 'L', index: l, color: 'a' },
      { name: 'R', index: r, color: 'b' },
    ];
    if (l < r) pointers.push({ name: 'M', index: m, color: 'c' });
    return [
      {
        kind: 'array',
        id: 'nums',
        label: L('nums', 'nums'),
        values: nums,
        bars: true,
        pointers,
        active: [l, r],
        marks: done || l === r ? { [l]: 'good' } : { [m]: 'focus', [r]: 'focus' },
      },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'nums[M]', value: l < r ? nums[m] : '—', highlight: true },
          { name: 'nums[R]', value: nums[r], highlight: true },
        ],
      },
    ];
  },
  result: (st) => L(`最小值 = ${st.nums[st.l]}`, `Minimum = ${st.nums[st.l]}`),
  code: `def findMin(self, nums: List[int]) -> int:
    l, r = 0, len(nums) - 1
    while l < r:
        m = (l + r) // 2
        if nums[m] > nums[r]:
            l = m + 1
        else:
            r = m
    return nums[l]`,
  lineOf: { init: 2, goRight: 6, goLeft: 8, return: 9 },
  answer: (st) => st.nums[st.l],
  verify: ({ nums }, ans) => ans === Math.min(...nums),
};
