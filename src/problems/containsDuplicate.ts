import { randInt } from '../core/engine';
import { L, TAP, type CellMark, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';

type I = { nums: number[] };
type S = { nums: number[]; i: number; seen: number[]; done: boolean; result: boolean | null };

export const containsDuplicate: Problem<I, S> = {
  id: 'contains-duplicate',
  number: 217,
  category: 'arrays-hashing',
  difficulty: 'Easy',
  title: L('存在重複元素', 'Contains Duplicate'),
  description: L('判斷陣列裡有沒有任何數字出現兩次以上。', 'Decide whether any value appears at least twice in the array.'),
  insight: L(
    '用一個 set 記住看過的數字。每看一個新數字，先查它在不在 set 裡：在，就是重複；不在，就加進去。',
    'Keep a set of numbers already seen. For each number, check the set first: if it is there, it is a duplicate; otherwise add it.',
  ),
  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    why: L('每個數字查一次、加一次 set，都是平均 O(1)。set 最多存 n 個。兩兩比較是 O(n²)；先排序再看相鄰是 O(n log n)。', 'Each number does one O(1) set lookup and insert; the set holds up to n numbers. Comparing every pair is O(n²); sorting then checking neighbours is O(n log n).'),
  },
  examples: [{ nums: [1, 2, 3, 1] }, { nums: [1, 2, 3, 4] }, { nums: [1, 1, 1, 3, 3, 4, 3, 2, 4, 2] }],
  random: () => ({ nums: Array.from({ length: randInt(5, 8) }, () => randInt(0, 12)) }),
  validate(x) {
    if (!isObj(x) || !isIntArray(x.nums, 1, 16)) return err('需要 {"nums": [整數...]}，長度 1–16', 'Expected {"nums": [ints]}, length 1–16');
    return null;
  },
  formatInput: (i) => `nums = [${i.nums.join(', ')}]`,

  init: ({ nums }) => ({ nums, i: 0, seen: [], done: false, result: null }),
  isDone: (st) => st.done,
  options: () => [
    { id: 'add', label: L('加進 set', 'Add to set') },
    { id: 'true', label: L('重複了，回傳 True', 'Duplicate: return True') },
    { id: 'false', label: L('都不重複，回傳 False', 'No duplicates: return False') },
  ],
  correct: ({ nums, i, seen }) => (i >= nums.length ? ['false'] : seen.includes(nums[i]) ? ['true'] : ['add']),
  apply: (st, a) => (a === 'add' ? { ...st, seen: [...st.seen, st.nums[st.i]], i: st.i + 1 } : { ...st, done: true, result: a === 'true' }),
  explain({ nums, i }, a) {
    if (a === 'add') return L(`${nums[i]} 不在 set 裡，第一次看到，加進去。`, `${nums[i]} isn't in the set yet: first sighting, add it.`);
    if (a === 'true') return L(`${nums[i]} 已經在 set 裡了，出現第二次，回傳 True。`, `${nums[i]} is already in the set: a second occurrence. Return True.`);
    return L('全部看完都沒有重複，回傳 False。', 'Everything was checked with no repeats. Return False.');
  },
  whyWrong({ nums, i, seen }, a) {
    if (i >= nums.length) return L('全部都看完了，沒有發現重複。', 'Everything is checked; no duplicate was found.');
    if (a === 'false') return L('還沒看完。', "You haven't checked everything yet.");
    if (seen.includes(nums[i])) return L(`${nums[i]} 已經在 set 裡了！`, `${nums[i]} is already in the set!`);
    return L(`${nums[i]} 還不在 set 裡，第一次看到。`, `${nums[i]} isn't in the set; this is its first sighting.`);
  },
  hints: ({ nums, i, seen }) => [
    L('這個數字在 set 裡出現過嗎？', 'Has this number already appeared in the set?'),
    L(`現在是 ${i < nums.length ? nums[i] : '（看完了）'}，set = {${seen.join(', ')}}。`, `Current ${i < nums.length ? nums[i] : '(done)'}, set = {${seen.join(', ')}}.`),
  ],
  scene({ nums, i, seen, done, result }) {
    const marks: Record<number, CellMark> = {};
    nums.forEach((_, k) => {
      if (k < i) marks[k] = 'done';
    });
    if (i < nums.length) marks[i] = done && result ? 'bad' : 'focus';
    return [
      { kind: 'array', id: 'nums', label: L('nums', 'nums'), values: nums, pointers: done ? [] : [{ name: 'i', index: i, color: 'a' }], marks, dragPrefix: 'n', dragMask: nums.map((_, k) => !done && k >= i) },
      { kind: 'set', id: 'seen', label: L('seen（看過的數字）——拖進來 = 加入', 'seen (numbers so far): drop here to add'), items: seen, dropId: done ? undefined : 'set' },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'dup', label: L('🔁 重複了（True）', '🔁 Duplicate (True)'), tone: 'bad' },
          { id: 'none', label: L('✓ 都不重複（False）', '✓ No duplicates (False)'), tone: 'good' },
        ],
      },
    ];
  },
  drag: {
    instructions: L('一個一個看：沒看過的數字拖進 seen；已經在 seen 裡的，拖到 🔁 重複了。全部看完都沒重複，點 ✓。', 'Go one by one: drag unseen numbers into seen; one already in seen goes to 🔁 Duplicate. If none repeat, tap ✓.'),
    tapZones: ['none'],
    moves(st) {
      const [a] = containsDuplicate.correct(st);
      if (a === 'false') return [{ action: a, from: TAP, to: 'none' }];
      return [{ action: a, from: `n:${st.i}`, to: a === 'add' ? 'set' : 'dup' }];
    },
    whyWrong(st, from, to) {
      if (from !== TAP && Number(from.split(':')[1]) !== st.i) return L(`一個一個看，現在是 ${st.nums[st.i]}。`, `One at a time: the current number is ${st.nums[st.i]}.`);
      return containsDuplicate.whyWrong(st, to === 'set' ? 'add' : to === 'dup' ? 'true' : 'false') ?? L('這一步不對。', 'Not quite.');
    },
  },
  result: (st) => L(`回傳 ${st.result ? 'True' : 'False'}`, `Returned ${st.result ? 'True' : 'False'}`),
  code: `def containsDuplicate(self, nums: List[int]) -> bool:
    seen = set()
    for n in nums:
        if n in seen:
            return True
        seen.add(n)
    return False`,
  lineOf: { init: 2, true: 5, add: 6, false: 7 },
  answer: (st) => st.result,
  verify: ({ nums }, ans) => ans === (new Set(nums).size !== nums.length),
};
