import { randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';

type I = { nums: number[] };
/** Pass 1 (left → right) writes prefix products; pass 2 (right → left) multiplies suffix products in. */
type S = { nums: number[]; res: (number | null)[]; pass: 1 | 2; i: number; prefix: number; suffix: number };

export const productExceptSelf: Problem<I, S> = {
  id: 'product-of-array-except-self',
  number: 238,
  category: 'arrays-hashing',
  difficulty: 'Medium',
  title: L('除自身以外陣列的乘積', 'Product of Array Except Self'),
  description: L('回傳 res，res[i] = 除了 nums[i] 以外所有數的乘積。不能用除法，要 O(n)。', 'Return res where res[i] is the product of every number except nums[i], without division, in O(n).'),
  insight: L(
    'res[i] = （i 左邊所有數的乘積）×（i 右邊所有數的乘積）。第一遍從左往右，把「左邊乘積 prefix」寫進 res[i]，再乘上 nums[i]；第二遍從右往左，把「右邊乘積 suffix」乘進 res[i]，再乘上 nums[i]。',
    'res[i] = (product of everything left of i) × (product of everything right of i). Pass 1 goes left to right writing the running prefix into res[i], then multiplies in nums[i]; pass 2 goes right to left multiplying the running suffix into res[i].',
  ),
  complexity: {
    time: 'O(n)',
    space: 'O(1)',
    why: L('兩遍各 O(n)。除了輸出的 res，只用 prefix、suffix 兩個變數（題目規定輸出不算額外空間）。每個位置都把其他數乘一遍是 O(n²)。', 'Two O(n) passes. Besides the output res, only prefix and suffix are stored (the output does not count). Multiplying everything else for each position is O(n²).'),
  },
  examples: [{ nums: [1, 2, 3, 4] }, { nums: [-1, 1, 0, -3, 3] }, { nums: [2, 3, 5] }],
  random: () => ({ nums: Array.from({ length: randInt(3, 6) }, () => randInt(-3, 5)) }),
  validate(x) {
    if (!isObj(x) || !isIntArray(x.nums, 2, 10) || x.nums.some((v) => Math.abs(v) > 30)) return err('需要 {"nums": [-30～30 的整數...]}，長度 2–10', 'Expected {"nums": [ints -30..30]}, length 2–10');
    return null;
  },
  formatInput: (i) => `nums = [${i.nums.join(', ')}]`,

  init: ({ nums }) => ({ nums, res: nums.map(() => null), pass: 1, i: 0, prefix: 1, suffix: 1 }),
  isDone: (st) => st.pass === 2 && st.i < 0,
  options: () => [
    { id: 'writePrefix', label: L('prefix 寫進 res[i]', 'Write prefix into res[i]') },
    { id: 'mulSuffix', label: L('suffix 乘進 res[i]', 'Multiply suffix into res[i]') },
  ],
  correct: (st) => [st.pass === 1 ? 'writePrefix' : 'mulSuffix'],
  apply(st, a) {
    const res = [...st.res];
    if (a === 'writePrefix') {
      res[st.i] = st.prefix;
      const prefix = st.prefix * st.nums[st.i];
      const i = st.i + 1;
      return i >= st.nums.length ? { ...st, res, prefix, pass: 2, i: st.nums.length - 1 } : { ...st, res, prefix, i };
    }
    res[st.i] = (res[st.i] ?? 1) * st.suffix;
    return { ...st, res, suffix: st.suffix * st.nums[st.i], i: st.i - 1 };
  },
  explain(st, a) {
    const { nums, i } = st;
    if (a === 'writePrefix') return L(`res[${i}] = 左邊乘積 ${st.prefix}。然後 prefix × nums[${i}] = ${st.prefix * nums[i]}。`, `res[${i}] = left product ${st.prefix}. Then prefix × nums[${i}] = ${st.prefix * nums[i]}.`);
    return L(`res[${i}] = ${st.res[i]} × 右邊乘積 ${st.suffix} = ${(st.res[i] ?? 1) * st.suffix}。然後 suffix × nums[${i}] = ${st.suffix * nums[i]}。`, `res[${i}] = ${st.res[i]} × right product ${st.suffix} = ${(st.res[i] ?? 1) * st.suffix}. Then suffix × nums[${i}] = ${st.suffix * nums[i]}.`);
  },
  whyWrong(st, a) {
    return st.pass === 1
      ? a === 'mulSuffix' ? L('第一遍（左 → 右）處理 prefix，右邊的乘積第二遍才算。', 'Pass 1 (left → right) handles prefix; the right products come in pass 2.') : L(`現在要寫的是 res[${st.i}]。`, `The cell to write now is res[${st.i}].`)
      : a === 'writePrefix' ? L('第一遍已經做完了，現在是第二遍：從右往左乘上 suffix。', 'Pass 1 is done; pass 2 multiplies in suffix from right to left.') : L(`現在要處理的是 res[${st.i}]。`, `The cell to update now is res[${st.i}].`);
  },
  hints: (st) => [
    st.pass === 1 ? L('第一遍：從左往右，把 prefix（左邊所有數的乘積）放進 res[i]。', 'Pass 1: left to right, put prefix (product of everything to the left) into res[i].') : L('第二遍：從右往左，把 suffix（右邊所有數的乘積）乘進 res[i]。', 'Pass 2: right to left, multiply suffix (product of everything to the right) into res[i].'),
    L(`下一格是 res[${st.i}]。`, `Next cell: res[${st.i}].`),
  ],
  scene(st) {
    const { nums, res, pass, i, prefix, suffix } = st;
    const done = pass === 2 && i < 0;
    const rm: Record<number, CellMark> = {};
    res.forEach((v, k) => {
      if (pass === 2 && k > i) rm[k] = 'good';
      else if (v !== null) rm[k] = 'done';
    });
    return [
      { kind: 'array', id: 'nums', label: L('nums', 'nums'), values: nums, pointers: done ? [] : [{ name: 'i', index: i, color: 'a' }], marks: done ? {} : { [i]: 'focus' } },
      {
        kind: 'array',
        id: 'tile',
        label: L(pass === 1 ? '第一遍 ➡：prefix（左邊乘積）' : '第二遍 ⬅：suffix（右邊乘積）', pass === 1 ? 'Pass 1 ➡: prefix (left product)' : 'Pass 2 ⬅: suffix (right product)'),
        values: [pass === 1 ? prefix : suffix],
        dragPrefix: done ? undefined : 'p',
        dragLabels: [`× ${pass === 1 ? prefix : suffix}`],
      },
      { kind: 'array', id: 'res', label: L('res（拖到對的格子）', 'res (drop into the right cell)'), values: res.map((v) => (v === null ? '·' : v)), marks: rm, dropPrefix: done ? undefined : 'res' },
    ];
  },
  drag: {
    instructions: L('第一遍從左往右：把 prefix 拖進 res[i]。第二遍從右往左：把 suffix 拖進 res[i] 乘上去。每放一次，系統會把 nums[i] 乘進 prefix / suffix。', 'Pass 1, left to right: drag prefix into res[i]. Pass 2, right to left: drag suffix into res[i] to multiply. After each drop, nums[i] is multiplied into prefix / suffix.'),
    moves: (st) => [{ action: productExceptSelf.correct(st)[0], from: 'p:0', to: `res:${st.i}` }],
    whyWrong(st, _from, to) {
      const j = Number(to.split(':')[1]);
      if (st.pass === 1) return j > st.i ? L(`第一遍從左往右，一格一格來；現在是 res[${st.i}]，右邊還沒輪到。`, `Pass 1 goes left to right; it's res[${st.i}] now.`) : L(`res[${j}] 已經寫好了，現在是 res[${st.i}]。`, `res[${j}] is done; it's res[${st.i}] now.`);
      return j < st.i ? L(`第二遍從右往左；現在是 res[${st.i}]，左邊還沒輪到。`, `Pass 2 goes right to left; it's res[${st.i}] now.`) : L(`res[${j}] 已經乘過 suffix 了，現在是 res[${st.i}]。`, `res[${j}] already has its suffix; it's res[${st.i}] now.`);
    },
  },
  result: (st) => L(`res = [${st.res.join(', ')}]`, `res = [${st.res.join(', ')}]`),
  code: `def productExceptSelf(self, nums: List[int]) -> List[int]:
    res = [1] * len(nums)
    prefix = 1
    for i in range(len(nums)):
        res[i] = prefix
        prefix *= nums[i]
    suffix = 1
    for i in range(len(nums) - 1, -1, -1):
        res[i] *= suffix
        suffix *= nums[i]
    return res`,
  lineOf: { init: 2, writePrefix: 5, mulSuffix: 9 },
  answer: (st) => st.res,
  verify({ nums }, ans) {
    const z = (v: number) => (Object.is(v, -0) ? 0 : v);
    const exp = nums.map((_, i) => z(nums.reduce((p, v, k) => (k === i ? p : p * v), 1)));
    return JSON.stringify((ans as number[]).map(z)) === JSON.stringify(exp);
  },
};
