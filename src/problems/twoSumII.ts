import { randInt } from '../core/engine';
import { L, type Problem } from '../core/types';
import { err, isIntArray, isObj, isSorted } from './helpers';

type I = { numbers: number[]; target: number };
type S = { nums: number[]; target: number; l: number; r: number; done: boolean; ans: [number, number] | null };

const countPairs = (a: number[], t: number) => {
  let c = 0;
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] + a[j] === t) c++;
  return c;
};

export const twoSumII: Problem<I, S> = {
  id: 'two-sum-ii',
  number: 167,
  category: 'two-pointers',
  difficulty: 'Medium',
  title: L('兩數之和 II（已排序陣列）', 'Two Sum II - Input Array Is Sorted'),
  description: L(
    '在已排序的陣列中找兩個數，使其和等於 target，回傳它們的位置（從 1 開始算）。',
    'In a sorted array, find two numbers that add up to target and return their 1-based positions.',
  ),
  insight: L(
    '陣列有序，所以 L 右移和會變大、R 左移和會變小。和太小就移 L，和太大就移 R。',
    'Because the array is sorted, moving L right increases the sum and moving R left decreases it. Too small → move L; too big → move R.',
  ),
  examples: [
    { numbers: [2, 7, 11, 15], target: 9 },
    { numbers: [1, 3, 4, 5, 7, 10, 11], target: 9 },
    { numbers: [-3, -1, 0, 2, 4, 6, 9], target: 8 },
  ],
  random() {
    for (;;) {
      const n = randInt(6, 9);
      const nums = Array.from({ length: n }, () => randInt(-5, 25)).sort((a, b) => a - b);
      const i = randInt(0, n - 2);
      const j = randInt(i + 1, n - 1);
      const target = nums[i] + nums[j];
      if (countPairs(nums, target) === 1) return { numbers: nums, target };
    }
  },
  validate(x) {
    if (!isObj(x) || !isIntArray(x.numbers, 2, 20) || typeof x.target !== 'number')
      return err('需要 {"numbers": [整數...], "target": 整數}，長度 2–20', 'Expected {"numbers": [ints], "target": int}, length 2–20');
    if (!isSorted(x.numbers)) return err('numbers 必須由小到大排序', 'numbers must be sorted ascending');
    if (countPairs(x.numbers, x.target) === 0) return err('找不到和為 target 的兩個數', 'No pair adds up to target');
    return null;
  },
  formatInput: (i) => `numbers = [${i.numbers.join(', ')}], target = ${i.target}`,

  init: ({ numbers, target }) => ({ nums: numbers, target, l: 0, r: numbers.length - 1, done: false, ans: null }),
  isDone: (st) => st.done,
  options: () => [
    { id: 'moveL', label: L('L 右移', 'Move L →') },
    { id: 'moveR', label: L('R 左移', 'Move R ←') },
    { id: 'found', label: L('找到答案', 'Found it') },
  ],
  correct({ nums, target, l, r }) {
    const sum = nums[l] + nums[r];
    if (sum === target) return ['found'];
    return sum < target ? ['moveL'] : ['moveR'];
  },
  apply(st, a) {
    if (a === 'moveL') return { ...st, l: st.l + 1 };
    if (a === 'moveR') return { ...st, r: st.r - 1 };
    return { ...st, done: true, ans: [st.l + 1, st.r + 1] };
  },
  explain({ nums, target, l, r }, a) {
    const x = nums[l];
    const y = nums[r];
    const s = x + y;
    if (a === 'moveL')
      return L(`${x} + ${y} = ${s} < ${target}，和太小。L 右移換一個比較大的數。`, `${x} + ${y} = ${s} < ${target}: too small. Move L right to a bigger number.`);
    if (a === 'moveR')
      return L(`${x} + ${y} = ${s} > ${target}，和太大。R 左移換一個比較小的數。`, `${x} + ${y} = ${s} > ${target}: too big. Move R left to a smaller number.`);
    return L(`${x} + ${y} = ${target}，找到了！回傳 [${l + 1}, ${r + 1}]（從 1 開始算）。`, `${x} + ${y} = ${target}. Found it! Return [${l + 1}, ${r + 1}] (1-based).`);
  },
  whyWrong({ nums, target, l, r }, a) {
    const s = nums[l] + nums[r];
    if (s === target) return L('和剛好等於 target，已經找到答案了！', 'The sum already equals target. You found the answer!');
    if (a === 'found') return L(`${s} ≠ ${target}，還沒找到。`, `${s} ≠ ${target}. Not found yet.`);
    if (a === 'moveL') return L(`和 ${s} 已經比 ${target} 大，L 右移只會讓和更大。`, `The sum ${s} is already above ${target}. Moving L right only makes it bigger.`);
    return L(`和 ${s} 比 ${target} 小，R 左移只會讓和更小。`, `The sum ${s} is below ${target}. Moving R left only makes it smaller.`);
  },
  hints: ({ nums, target, l, r }) => [
    L('先算 numbers[L] + numbers[R]，再和 target 比大小。', 'Compute numbers[L] + numbers[R] and compare it with target.'),
    L(`目前的和 = ${nums[l] + nums[r]}，target = ${target}。`, `Current sum = ${nums[l] + nums[r]}, target = ${target}.`),
  ],
  scene({ nums, target, l, r, done }) {
    return [
      {
        kind: 'array',
        id: 'nums',
        label: L('numbers', 'numbers'),
        values: nums,
        pointers: [
          { name: 'L', index: l, color: 'a' },
          { name: 'R', index: r, color: 'b' },
        ],
        active: [l, r],
        marks: done ? { [l]: 'good', [r]: 'good' } : { [l]: 'focus', [r]: 'focus' },
      },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'numbers[L] + numbers[R]', value: nums[l] + nums[r], highlight: true },
          { name: 'target', value: target },
        ],
      },
    ];
  },
  result: (st) => L(`回傳 [${st.ans?.join(', ')}]`, `Returned [${st.ans?.join(', ')}]`),
  code: `def twoSum(self, numbers: List[int], target: int) -> List[int]:
    l, r = 0, len(numbers) - 1
    while l < r:
        cur = numbers[l] + numbers[r]
        if cur > target:
            r -= 1
        elif cur < target:
            l += 1
        else:
            return [l + 1, r + 1]`,
  lineOf: { init: 2, moveR: 6, moveL: 8, found: 10 },
  answer: (st) => st.ans,
  verify({ numbers, target }, ans) {
    if (!Array.isArray(ans) || ans.length !== 2) return false;
    const [a, b] = ans as number[];
    return a >= 1 && a < b && b <= numbers.length && numbers[a - 1] + numbers[b - 1] === target;
  },
};
