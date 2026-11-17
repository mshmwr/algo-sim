import { randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';

type I = { nums: number[]; target: number };
type S = { nums: number[]; target: number; i: number; seen: [number, number][]; ans: [number, number] | null };

const countPairs = (a: number[], t: number) => {
  let c = 0;
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] + a[j] === t) c++;
  return c;
};

export const twoSum: Problem<I, S> = {
  id: 'two-sum',
  number: 1,
  category: 'arrays-hashing',
  difficulty: 'Easy',
  title: L('兩數之和', 'Two Sum'),
  description: L('找出兩個加起來等於 target 的數字，回傳它們的索引。', 'Find two numbers that add up to target and return their indices.'),
  insight: L(
    '一邊掃一邊用雜湊表記「數字 → 索引」。看到 x 時，先查它的「補數」target − x 有沒有出現過：有就找到了；沒有就把 x 記下來，等之後的數字來配。',
    'Scan once while recording value → index in a hash map. For each x, first look up its complement target − x: if present, done; otherwise store x for a later number to pair with.',
  ),
  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    why: L('每個數字查一次、存一次雜湊表，都是 O(1)。兩層迴圈試每一對是 O(n²)；陣列沒排序，所以不能直接用雙指標。', 'Each number does one O(1) lookup and one store. Trying every pair is O(n²); the array is unsorted, so two pointers would need an O(n log n) sort first.'),
  },
  examples: [
    { nums: [2, 7, 11, 15], target: 9 },
    { nums: [3, 2, 4], target: 6 },
    { nums: [5, 1, 8, 3, 9], target: 11 },
  ],
  random() {
    for (;;) {
      const nums = Array.from({ length: randInt(5, 7) }, () => randInt(-3, 15));
      const i = randInt(0, nums.length - 2);
      const j = randInt(i + 1, nums.length - 1);
      const target = nums[i] + nums[j];
      if (countPairs(nums, target) === 1) return { nums, target };
    }
  },
  validate(x) {
    if (!isObj(x) || !isIntArray(x.nums, 2, 14) || typeof x.target !== 'number') return err('需要 {"nums": [...], "target": 整數}，長度 2–14', 'Expected {"nums": [...], "target": int}, length 2–14');
    if (countPairs(x.nums, x.target) === 0) return err('找不到和為 target 的兩個數', 'No pair adds up to target');
    return null;
  },
  formatInput: (i) => `nums = [${i.nums.join(', ')}], target = ${i.target}`,

  init: ({ nums, target }) => ({ nums, target, i: 0, seen: [], ans: null }),
  isDone: (st) => st.ans !== null,
  options: () => [
    { id: 'store', label: L('存進雜湊表', 'Store in the map') },
    { id: 'found', label: L('補數在表裡：配對', 'Complement found: pair') },
  ],
  correct: ({ nums, target, i, seen }) => (seen.some(([v]) => v === target - nums[i]) ? ['found'] : ['store']),
  apply(st, a) {
    if (a === 'store') return { ...st, seen: [...st.seen, [st.nums[st.i], st.i]], i: st.i + 1 };
    const j = st.seen.find(([v]) => v === st.target - st.nums[st.i])![1];
    return { ...st, ans: [j, st.i] };
  },
  explain({ nums, target, i, seen }, a) {
    const c = target - nums[i];
    if (a === 'store') return L(`${nums[i]} 的補數是 ${target} − ${nums[i]} = ${c}，還沒出現過。把 ${nums[i]} → ${i} 存起來。`, `${nums[i]}'s complement is ${target} − ${nums[i]} = ${c}, not seen yet. Store ${nums[i]} → ${i}.`);
    const j = seen.find(([v]) => v === c)![1];
    return L(`${nums[i]} 的補數 ${c} 在表裡（索引 ${j}），找到了！回傳 [${j}, ${i}]。`, `${nums[i]}'s complement ${c} is in the map (index ${j}). Found! Return [${j}, ${i}].`);
  },
  whyWrong({ nums, target, i, seen }, a) {
    const c = target - nums[i];
    return a === 'store' ? L(`${nums[i]} 的補數 ${c} 已經在表裡了，可以直接配對！`, `${nums[i]}'s complement ${c} is already in the map; pair them!`) : L(`${nums[i]} 的補數是 ${c}，表裡還沒有${seen.length ? `（只有 ${seen.map(([v]) => v).join(', ')}）` : ''}。`, `${nums[i]}'s complement is ${c}, which isn't in the map${seen.length ? ` (only ${seen.map(([v]) => v).join(', ')})` : ''}.`);
  },
  hints: ({ nums, target, i }) => [L('算出補數 target − nums[i]，查表裡有沒有。', 'Compute the complement target − nums[i] and look it up.'), L(`${target} − ${nums[i]} = ${target - nums[i]}`, `${target} − ${nums[i]} = ${target - nums[i]}`)],
  scene({ nums, target, i, seen, ans }) {
    const marks: Record<number, CellMark> = {};
    nums.forEach((_, k) => k < i && (marks[k] = 'done'));
    if (ans) {
      marks[ans[0]] = 'good';
      marks[ans[1]] = 'good';
    } else marks[i] = 'focus';
    return [
      { kind: 'array', id: 'nums', label: L('nums', 'nums'), values: nums, pointers: ans ? [] : [{ name: 'i', index: i, color: 'a' }], marks, dragPrefix: 'n', dragMask: nums.map((_, k) => !ans && k >= i) },
      { kind: 'vars', id: 'v', vars: [{ name: 'target − nums[i]', value: ans ? '—' : target - nums[i], highlight: true }, { name: 'target', value: target }] },
      { kind: 'set', id: 'seen', label: L('雜湊表（數字 → 索引）——拖進來 = 存起來', 'hash map (value → index): drop here to store'), items: seen.map(([v, k]) => `${v}→${k}`), dropId: ans ? undefined : 'map' },
      { kind: 'zones', id: 'zones', zones: [{ id: 'pair', label: L('🎯 補數在表裡，配對！', '🎯 Complement is in the map: pair!'), tone: 'good' }] },
    ];
  },
  drag: {
    instructions: L('對每個數字算補數 target − x：補數已經在雜湊表裡，就拖到 🎯 配對；不在，就把它拖進雜湊表存起來。', 'For each number compute target − x: if the complement is in the map, drag it to 🎯; otherwise drag it into the map.'),
    moves: (st) => [{ action: twoSum.correct(st)[0], from: `n:${st.i}`, to: twoSum.correct(st)[0] === 'store' ? 'map' : 'pair' }],
    whyWrong(st, from, to) {
      if (Number(from.split(':')[1]) !== st.i) return L(`照順序來，現在是 ${st.nums[st.i]}。`, `In order: the current number is ${st.nums[st.i]}.`);
      return twoSum.whyWrong(st, to === 'map' ? 'store' : 'found') ?? L('這一步不對。', 'Not quite.');
    },
  },
  result: (st) => L(`回傳 [${st.ans?.join(', ')}]`, `Returned [${st.ans?.join(', ')}]`),
  code: `def twoSum(self, nums: List[int], target: int) -> List[int]:
    prevMap = {}  # value -> index
    for i, n in enumerate(nums):
        diff = target - n
        if diff in prevMap:
            return [prevMap[diff], i]
        prevMap[n] = i`,
  lineOf: { init: 2, found: 6, store: 7 },
  answer: (st) => st.ans,
  verify({ nums, target }, ans) {
    const [a, b] = ans as number[];
    return a !== b && nums[a] + nums[b] === target;
  },
};
