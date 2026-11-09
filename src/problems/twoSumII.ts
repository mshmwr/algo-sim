import { randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
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
      return L(
        `${x} + ${y} = ${s} < ${target}，和太小。${x} 配上最大的 ${y} 都不夠，它不可能是答案，丟掉（L 右移）。`,
        `${x} + ${y} = ${s} < ${target}: too small. Even with the largest number ${y}, ${x} falls short, so it can't be in the answer. Discard it (L moves right).`,
      );
    if (a === 'moveR')
      return L(
        `${x} + ${y} = ${s} > ${target}，和太大。${y} 配上最小的 ${x} 都太大，它不可能是答案，丟掉（R 左移）。`,
        `${x} + ${y} = ${s} > ${target}: too big. Even with the smallest number ${x}, ${y} overshoots, so it can't be in the answer. Discard it (R moves left).`,
      );
    return L(`${x} + ${y} = ${target}，配對成功！回傳 [${l + 1}, ${r + 1}]（從 1 開始算）。`, `${x} + ${y} = ${target}. Paired! Return [${l + 1}, ${r + 1}] (1-based).`);
  },
  whyWrong({ nums, target, l, r }, a) {
    const s = nums[l] + nums[r];
    if (s === target) return L('和剛好等於 target，已經找到答案了！', 'The sum already equals target. You found the answer!');
    if (a === 'found') return L(`${s} ≠ ${target}，還沒找到。`, `${s} ≠ ${target}. Not found yet.`);
    if (a === 'moveL') return L(`和 ${s} 已經比 ${target} 大，L 右移只會讓和更大。`, `The sum ${s} is already above ${target}. Moving L right only makes it bigger.`);
    return L(`和 ${s} 比 ${target} 小，R 左移只會讓和更小。`, `The sum ${s} is below ${target}. Moving R left only makes it smaller.`);
  },
  hints: ({ nums, target, l, r }) => [
    L('先算最左 + 最右，再和 target 比大小。太小或太大時，想想哪一個數「配誰都不可能」。', 'Add the leftmost and rightmost numbers and compare with target. If it is off, which number cannot work with any partner?'),
    L(`目前的和 = ${nums[l] + nums[r]}，target = ${target}。`, `Current sum = ${nums[l] + nums[r]}, target = ${target}.`),
  ],
  scene({ nums, target, l, r, done }) {
    const marks: Record<number, CellMark> = {};
    nums.forEach((_, k) => {
      if (k < l || k > r) marks[k] = 'gone';
    });
    if (done) {
      marks[l] = 'good';
      marks[r] = 'good';
    }
    const live = nums.map((_, k) => !done && k >= l && k <= r);
    return [
      {
        kind: 'array',
        id: 'nums',
        label: L('numbers（拖曳最左或最右的數）', 'numbers (drag the leftmost or rightmost number)'),
        values: nums,
        pointers: [
          { name: 'L', index: l, color: 'a' },
          { name: 'R', index: r, color: 'b' },
        ],
        marks,
        dragPrefix: 'n',
        dropPrefix: 'n',
        dragMask: live,
        dropMask: live,
      },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'numbers[L] + numbers[R]', value: nums[l] + nums[r], highlight: true },
          { name: 'target', value: target },
        ],
      },
      {
        kind: 'zones',
        id: 'zones',
        zones: [{ id: 'trash', label: L('🗑️ 丟掉（不可能是答案的數）', "🗑️ Discard (can't be in the answer)"), tone: 'trash' }],
      },
    ];
  },
  drag: {
    instructions: L(
      '只看最左和最右兩個數。和不等於 target 時，把「不可能是答案」的那個數拖進 🗑️；和剛好等於 target，就把一個拖到另一個上面配對。',
      "Look only at the leftmost and rightmost numbers. If their sum isn't target, drag the one that can't be in the answer into 🗑️. If it equals target, drag one onto the other to pair them.",
    ),
    moves({ nums, target, l, r }) {
      const sum = nums[l] + nums[r];
      if (sum < target) return [{ action: 'moveL', from: `n:${l}`, to: 'trash' }];
      if (sum > target) return [{ action: 'moveR', from: `n:${r}`, to: 'trash' }];
      return [
        { action: 'found', from: `n:${l}`, to: `n:${r}` },
        { action: 'found', from: `n:${r}`, to: `n:${l}` },
      ];
    },
    whyWrong({ nums, target, l, r }, from, to) {
      const k = Number(from.split(':')[1]);
      const x = nums[l];
      const y = nums[r];
      const sum = x + y;
      if (k !== l && k !== r)
        return L(`${nums[k]} 不在兩端。現在只比較最左邊的 ${x} 和最右邊的 ${y}。`, `${nums[k]} is not at either end. Compare only the leftmost ${x} and the rightmost ${y}.`);
      if (to === 'trash') {
        if (sum === target) return L(`${x} + ${y} 剛好等於 ${target}，不用丟，把它們配對！`, `${x} + ${y} equals ${target}. Don't discard; pair them!`);
        if (k === l)
          return L(
            `和 ${sum} 已經太大了。丟掉 ${x} 會換上更大的數，和只會更大。該丟的是最大的 ${y}。`,
            `The sum ${sum} is already too big. Dropping ${x} brings in a bigger number, so the sum only grows. Discard the largest, ${y}.`,
          );
        return L(
          `和 ${sum} 還太小。丟掉 ${y} 會換上更小的數，和只會更小。該丟的是最小的 ${x}。`,
          `The sum ${sum} is still too small. Dropping ${y} brings in a smaller number, so the sum only shrinks. Discard the smallest, ${x}.`,
        );
      }
      const j = Number(to.split(':')[1]);
      const other = k === l ? r : l;
      if (j !== other) return L(`要和另一端的 ${nums[other]} 配對。`, `Pair it with ${nums[other]} at the other end.`);
      return L(`${x} + ${y} = ${sum}，不等於 ${target}，不能配對。`, `${x} + ${y} = ${sum}, not ${target}, so they can't be paired.`);
    },
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
