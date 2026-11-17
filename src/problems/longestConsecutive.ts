import { randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';

type I = { nums: number[] };
/** Walk the distinct numbers; a number starts a run only if n − 1 is absent. */
type S = { nums: number[]; uniq: number[]; i: number; best: number; runs: number[][] };

const runFrom = (set: Set<number>, n: number) => {
  const run = [n];
  while (set.has(run[run.length - 1] + 1)) run.push(run[run.length - 1] + 1);
  return run;
};

export const longestConsecutive: Problem<I, S> = {
  id: 'longest-consecutive-sequence',
  number: 128,
  category: 'arrays-hashing',
  difficulty: 'Medium',
  title: L('最長連續序列', 'Longest Consecutive Sequence'),
  description: L('在沒排序的陣列裡，找出數值連續（像 1, 2, 3, 4）的最長序列長度，要 O(n)。', 'In an unsorted array, find the length of the longest run of consecutive values (like 1, 2, 3, 4) in O(n).'),
  insight: L(
    '把所有數字放進 set。一個數字 n 只有在 n − 1 不存在時，才是一段序列的「起點」，這時才往上數 n+1、n+2⋯。不是起點的直接跳過，這樣每個數字只會被數到一次。',
    'Put every number in a set. A number n starts a run only if n − 1 is absent; only then count up n+1, n+2, …. Skip non-starts, so each number is counted once.',
  ),
  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    why: L('每段序列只從起點往上數一次，所有序列加起來最多數 n 個數。set 存 n 個數。先排序再掃是 O(n log n)；從每個數字都往上數則是 O(n²)。', 'Each run is counted once from its start, so all runs together count at most n numbers. The set stores n numbers. Sorting first is O(n log n); counting up from every number is O(n²).'),
  },
  examples: [{ nums: [100, 4, 200, 1, 3, 2] }, { nums: [0, 3, 7, 2, 5, 8, 4, 6, 0, 1] }, { nums: [9, 1, 10, 3, 11, 2] }],
  random: () => ({ nums: Array.from({ length: randInt(5, 8) }, () => randInt(0, 12)) }),
  validate(x) {
    if (!isObj(x) || !isIntArray(x.nums, 0, 14)) return err('需要 {"nums": [整數...]}，最多 14 個', 'Expected {"nums": [ints]}, up to 14');
    return null;
  },
  formatInput: (i) => `nums = [${i.nums.join(', ')}]`,

  init: ({ nums }) => ({ nums, uniq: [...new Set(nums)], i: 0, best: 0, runs: [] }),
  isDone: (st) => st.i >= st.uniq.length,
  options: () => [
    { id: 'start', label: L('是起點：往上數', 'A start: count up') },
    { id: 'skip', label: L('不是起點：跳過', 'Not a start: skip') },
  ],
  correct: (st) => (new Set(st.uniq).has(st.uniq[st.i] - 1) ? ['skip'] : ['start']),
  apply(st, a) {
    if (a === 'skip') return { ...st, i: st.i + 1 };
    const run = runFrom(new Set(st.uniq), st.uniq[st.i]);
    return { ...st, i: st.i + 1, runs: [...st.runs, run], best: Math.max(st.best, run.length) };
  },
  explain(st, a) {
    const n = st.uniq[st.i];
    if (a === 'skip') return L(`${n - 1} 在 set 裡，所以 ${n} 只是某段序列的中間，跳過（之後從起點數會數到它）。`, `${n - 1} is in the set, so ${n} sits inside a run. Skip it; counting from the run's start will include it.`);
    const run = runFrom(new Set(st.uniq), n);
    return L(`${n - 1} 不在 set 裡，${n} 是起點。往上數：${run.join(' → ')}，長度 ${run.length}${run.length > st.best ? '，刷新紀錄！' : '。'}`, `${n - 1} isn't in the set, so ${n} starts a run. Count up: ${run.join(' → ')}, length ${run.length}${run.length > st.best ? ', a new best!' : '.'}`);
  },
  whyWrong(st, a) {
    const n = st.uniq[st.i];
    return a === 'start' ? L(`${n - 1} 在 set 裡，${n} 不是起點；從這裡數會重複計算。`, `${n - 1} is in the set, so ${n} isn't a start; counting here would double-count.`) : L(`${n - 1} 不在 set 裡，${n} 就是一段序列的起點，要往上數。`, `${n - 1} isn't in the set, so ${n} starts a run. Count up.`);
  },
  hints: (st) => [L('n − 1 在 set 裡嗎？', 'Is n − 1 in the set?'), L(`n = ${st.uniq[st.i]}，找 ${st.uniq[st.i] - 1}。`, `n = ${st.uniq[st.i]}; look for ${st.uniq[st.i] - 1}.`)],
  scene({ uniq, i, best, runs }) {
    const done = i >= uniq.length;
    const marks: Record<number, CellMark> = {};
    uniq.forEach((_, k) => k < i && (marks[k] = 'done'));
    if (!done) marks[i] = 'focus';
    return [
      { kind: 'array', id: 'uniq', label: L('set 裡的數字（依原順序走訪）', 'numbers in the set (visited in input order)'), values: uniq, pointers: done ? [] : [{ name: 'n', index: i, color: 'a' }], marks, dragPrefix: 'u', dragMask: uniq.map((_, k) => !done && k >= i) },
      { kind: 'set', id: 'runs', label: L('數過的序列', 'runs counted'), items: runs.map((r) => r.join('→')) },
      { kind: 'vars', id: 'v', vars: [{ name: 'n − 1 in set?', value: done ? '—' : new Set(uniq).has(uniq[i] - 1) ? 'yes' : 'no' }, { name: 'longest', value: best, highlight: true }] },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'start', label: L('🚩 是起點，往上數', '🚩 A start: count up'), tone: 'good' },
          { id: 'skip', label: L('⏭ 不是起點，跳過', '⏭ Not a start: skip'), tone: 'trash' },
        ],
      },
    ];
  },
  drag: {
    instructions: L('一個一個看：n − 1 不在 set 裡，n 就是起點，拖到 🚩（系統會往上數）；否則拖到 ⏭ 跳過。', 'One by one: if n − 1 is absent, n is a start: drag it to 🚩 (it counts up for you); otherwise drag it to ⏭.'),
    moves: (st) => [{ action: longestConsecutive.correct(st)[0], from: `u:${st.i}`, to: longestConsecutive.correct(st)[0] }],
    whyWrong(st, from, to) {
      if (Number(from.split(':')[1]) !== st.i) return L(`照順序來，現在是 ${st.uniq[st.i]}。`, `In order: the current number is ${st.uniq[st.i]}.`);
      return longestConsecutive.whyWrong(st, to) ?? L('這一步不對。', 'Not quite.');
    },
  },
  result: (st) => L(`最長長度 = ${st.best}`, `Longest = ${st.best}`),
  code: `def longestConsecutive(self, nums: List[int]) -> int:
    numSet = set(nums)
    longest = 0
    for n in numSet:
        if (n - 1) not in numSet:  # start of a run
            length = 1
            while (n + length) in numSet:
                length += 1
            longest = max(length, longest)
    return longest`,
  lineOf: { init: 2, start: 9, skip: 5 },
  answer: (st) => st.best,
  verify({ nums }, ans) {
    const s = [...new Set(nums)].sort((a, b) => a - b);
    let best = 0;
    let cur = 0;
    s.forEach((v, k) => {
      cur = k > 0 && v === s[k - 1] + 1 ? cur + 1 : 1;
      best = Math.max(best, cur);
    });
    return ans === best;
  },
};
