import { randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';

type I = { nums: number[]; k: number };
/**
 * phase count: i walks nums into the counter.
 * phase bucket: u walks the distinct numbers into buckets[freq].
 * phase collect: take numbers from the highest non-empty bucket until k are chosen.
 */
type S = { nums: number[]; k: number; i: number; counts: [number, number][]; u: number; buckets: number[][]; b: number; res: number[] };

const phase = (st: S) => (st.i < st.nums.length ? 'count' : st.u < st.counts.length ? 'bucket' : 'collect');
const nextBucket = (st: S) => {
  let b = st.b;
  while (b > 0 && st.buckets[b].length === 0) b--;
  return b;
};

export const topKFrequent: Problem<I, S> = {
  id: 'top-k-frequent-elements',
  number: 347,
  category: 'arrays-hashing',
  difficulty: 'Medium',
  title: L('前 K 個高頻元素', 'Top K Frequent Elements'),
  description: L('回傳出現次數最多的 k 個數字。', 'Return the k most frequent numbers.'),
  insight: L(
    '先用雜湊表數每個數字出現幾次。出現次數最多也只有 n，所以開 n+1 個「桶子」，第 f 號桶子放出現 f 次的數字。最後從最大號的桶子往回拿，拿滿 k 個就好，不用排序。',
    'Count each number with a hash map. A frequency is at most n, so make n+1 buckets where bucket f holds numbers seen f times. Then take from the highest bucket downward until you have k; no sorting needed.',
  ),
  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    why: L('計數 O(n)、放桶子 O(n)、從桶子收集 O(n)。依次數排序是 O(n log n)；用大小 k 的堆積是 O(n log k)。', 'Counting O(n), bucketing O(n), collecting O(n). Sorting by frequency is O(n log n); a size-k heap is O(n log k).'),
  },
  examples: [
    { nums: [1, 1, 1, 2, 2, 3], k: 2 },
    { nums: [1], k: 1 },
    { nums: [4, 1, 4, 2, 1, 4, 3, 1, 4], k: 2 },
  ],
  random() {
    for (;;) {
      const nums = Array.from({ length: randInt(6, 9) }, () => randInt(1, 4));
      const freq = new Map<number, number>();
      nums.forEach((v) => freq.set(v, (freq.get(v) ?? 0) + 1));
      const fs = [...freq.values()].sort((a, b) => b - a);
      const k = randInt(1, Math.min(2, fs.length));
      if (k === fs.length || fs[k - 1] !== fs[k]) return { nums, k };
    }
  },
  validate(x) {
    if (!isObj(x) || !isIntArray(x.nums, 1, 14) || typeof x.k !== 'number' || !Number.isInteger(x.k) || x.k < 1) return err('需要 {"nums": [...], "k": 正整數}，長度 1–14', 'Expected {"nums": [...], "k": positive int}, length 1–14');
    const freq = new Map<number, number>();
    x.nums.forEach((v) => freq.set(v, (freq.get(v) ?? 0) + 1));
    const fs = [...freq.values()].sort((a, b) => b - a);
    if (x.k > fs.length) return err('k 不能超過不同數字的個數', 'k cannot exceed the number of distinct values');
    if (x.k < fs.length && fs[x.k - 1] === fs[x.k]) return err('答案必須唯一（第 k 名不能同分）', 'The answer must be unique (no tie at rank k)');
    return null;
  },
  formatInput: (i) => `nums = [${i.nums.join(', ')}], k = ${i.k}`,

  init: ({ nums, k }) => ({ nums, k, i: 0, counts: [], u: 0, buckets: Array.from({ length: nums.length + 1 }, () => []), b: nums.length, res: [] }),
  isDone: (st) => st.res.length >= st.k,
  options: () => [
    { id: 'count', label: L('計數 +1', 'Count +1') },
    { id: 'bucket', label: L('放進對應次數的桶子', 'Drop into its frequency bucket') },
    { id: 'take', label: L('從最大的桶子拿', 'Take from the highest bucket') },
  ],
  correct: (st) => [phase(st) === 'count' ? 'count' : phase(st) === 'bucket' ? 'bucket' : 'take'],
  apply(st, a) {
    if (a === 'count') {
      const v = st.nums[st.i];
      const has = st.counts.some(([x]) => x === v);
      return { ...st, counts: has ? st.counts.map(([x, c]): [number, number] => [x, x === v ? c + 1 : c]) : [...st.counts, [v, 1]], i: st.i + 1 };
    }
    if (a === 'bucket') {
      const [v, c] = st.counts[st.u];
      return { ...st, buckets: st.buckets.map((bk, f) => (f === c ? [...bk, v] : bk)), u: st.u + 1 };
    }
    const b = nextBucket(st);
    const need = st.k - st.res.length;
    const take = st.buckets[b].slice(0, need);
    return { ...st, res: [...st.res, ...take], buckets: st.buckets.map((bk, f) => (f === b ? bk.slice(take.length) : bk)), b: take.length === st.buckets[b].length ? b - 1 : b };
  },
  explain(st, a) {
    if (a === 'count') return L(`${st.nums[st.i]} 的次數 +1。`, `Count of ${st.nums[st.i]} +1.`);
    if (a === 'bucket') {
      const [v, c] = st.counts[st.u];
      return L(`${v} 出現 ${c} 次，放進 ${c} 號桶子。`, `${v} appears ${c} times: put it in bucket ${c}.`);
    }
    const b = nextBucket(st);
    return L(`目前最大的非空桶子是 ${b} 號（${st.buckets[b].join(', ')}），從這裡拿。`, `The highest non-empty bucket is ${b} (${st.buckets[b].join(', ')}). Take from it.`);
  },
  whyWrong(st) {
    const p = phase(st);
    if (p === 'count') return L('先把每個數字數完。', 'Count every number first.');
    if (p === 'bucket') {
      const [v, c] = st.counts[st.u];
      return L(`${v} 出現 ${c} 次，要放 ${c} 號桶子。`, `${v} appears ${c} times; it goes in bucket ${c}.`);
    }
    return L(`要從次數最多的桶子拿，也就是 ${nextBucket(st)} 號。`, `Take from the highest-frequency bucket: number ${nextBucket(st)}.`);
  },
  hints: (st) => {
    const p = phase(st);
    if (p === 'count') return [L('第一步：數每個數字出現幾次。', 'Step 1: count each number.'), L(`現在是 ${st.nums[st.i]}。`, `Current: ${st.nums[st.i]}.`)];
    if (p === 'bucket') return [L('第二步：出現 f 次的數字放 f 號桶子。', 'Step 2: a number seen f times goes in bucket f.'), L(`${st.counts[st.u][0]} 出現 ${st.counts[st.u][1]} 次。`, `${st.counts[st.u][0]} appears ${st.counts[st.u][1]} times.`)];
    return [L('第三步：從號碼最大的非空桶子往回拿，拿滿 k 個。', 'Step 3: take from the highest non-empty bucket downward until you have k.'), L(`還要 ${st.k - st.res.length} 個。`, `${st.k - st.res.length} more needed.`)];
  },
  scene(st) {
    const { nums, k, i, counts, u, buckets, res } = st;
    const p = phase(st);
    const done = res.length >= k;
    const nm: Record<number, CellMark> = {};
    nums.forEach((_, x) => x < i && (nm[x] = 'done'));
    if (p === 'count') nm[i] = 'focus';
    const cm: Record<number, CellMark> = {};
    counts.forEach((_, x) => x < u && (cm[x] = 'done'));
    if (p === 'bucket') cm[u] = 'focus';
    const bm: Record<number, CellMark> = {};
    if (p === 'collect' && !done) bm[nextBucket(st)] = 'focus';
    return [
      { kind: 'array', id: 'nums', label: L('① nums：拖到計數區', '① nums: drag to the counter'), values: nums, marks: nm, dragPrefix: 'n', dragMask: nums.map((_, x) => p === 'count' && x >= i) },
      {
        kind: 'array',
        id: 'counts',
        label: L('② 計數（數字×次數）：拖到對應的桶子', '② counts (value×times): drag to its bucket'),
        values: counts.length ? counts.map(([v, c]) => `${v}×${c}`) : ['·'],
        marks: cm,
        dragPrefix: counts.length ? 'c' : undefined,
        dragMask: counts.map((_, x) => p === 'bucket' && x >= u),
        dropPrefix: undefined,
      },
      {
        kind: 'array',
        id: 'buckets',
        label: L('③ 桶子（第 f 格 = 出現 f 次的數字）：從右往左拿到 res', '③ buckets (cell f = numbers seen f times): take right to left into res'),
        values: buckets.map((bk) => (bk.length ? bk.join(',') : '·')),
        marks: bm,
        dragPrefix: p === 'collect' && !done ? 'b' : undefined,
        dragMask: buckets.map((bk) => bk.length > 0),
        dropPrefix: p === 'bucket' ? 'bk' : undefined,
      },
      { kind: 'set', id: 'res', label: L(`res（要 ${k} 個）`, `res (need ${k})`), items: res },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'counter', label: L('🧮 計數 +1', '🧮 Count +1'), tone: 'info' },
          { id: 'res', label: L('📥 放進 res', '📥 Into res'), tone: 'good' },
        ],
      },
    ];
  },
  drag: {
    instructions: L('① 把每個數字拖到 🧮 計數。② 把每個「數字×次數」拖到對應號碼的桶子。③ 從號碼最大的非空桶子開始，拖到 📥 res，直到拿滿 k 個。', '① Drag every number to 🧮. ② Drag each "value×times" into the bucket with that number. ③ From the highest non-empty bucket down, drag into 📥 res until you have k.'),
    moves(st) {
      const p = phase(st);
      if (p === 'count') return [{ action: 'count', from: `n:${st.i}`, to: 'counter' }];
      if (p === 'bucket') return [{ action: 'bucket', from: `c:${st.u}`, to: `bk:${st.counts[st.u][1]}` }];
      return [{ action: 'take', from: `b:${nextBucket(st)}`, to: 'res' }];
    },
    whyWrong(st, from, to) {
      const [kind, idxS] = from.split(':');
      const x = Number(idxS);
      const p = phase(st);
      if (p === 'count') return kind === 'n' && x !== st.i ? L('照順序一個一個數。', 'Count in order, one at a time.') : L('先把 nums 全部拖到 🧮 計數。', 'First drag all of nums to 🧮.');
      if (p === 'bucket') {
        if (kind !== 'c' || x !== st.u) return L('現在要把計數一個一個放進桶子。', 'Now drop the counts into buckets one at a time.');
        return L(`${st.counts[st.u][0]} 出現 ${st.counts[st.u][1]} 次，要放 ${st.counts[st.u][1]} 號桶子${to.startsWith('bk:') ? `，不是 ${to.slice(3)} 號` : ''}。`, `${st.counts[st.u][0]} appears ${st.counts[st.u][1]} times; bucket ${st.counts[st.u][1]}${to.startsWith('bk:') ? `, not ${to.slice(3)}` : ''}.`);
      }
      if (kind === 'b' && to === 'res') return L(`${x} 號桶子不是最大的；先拿 ${nextBucket(st)} 號（出現最多次的）。`, `Bucket ${x} isn't the highest; take bucket ${nextBucket(st)} (most frequent) first.`);
      return topKFrequent.whyWrong(st, 'take') ?? L('這一步不對。', 'Not quite.');
    },
  },
  result: (st) => L(`回傳 [${st.res.join(', ')}]`, `Returned [${st.res.join(', ')}]`),
  code: `def topKFrequent(self, nums: List[int], k: int) -> List[int]:
    count = {}
    freq = [[] for i in range(len(nums) + 1)]
    for n in nums:
        count[n] = 1 + count.get(n, 0)
    for n, c in count.items():
        freq[c].append(n)
    res = []
    for i in range(len(freq) - 1, 0, -1):
        for n in freq[i]:
            res.append(n)
            if len(res) == k:
                return res`,
  lineOf: { init: 2, count: 5, bucket: 7, take: 11 },
  answer: (st) => st.res,
  verify({ nums, k }, ans) {
    const freq = new Map<number, number>();
    nums.forEach((v) => freq.set(v, (freq.get(v) ?? 0) + 1));
    const exp = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(([v]) => v).sort((a, b) => a - b);
    return JSON.stringify([...(ans as number[])].sort((a, b) => a - b)) === JSON.stringify(exp);
  },
};
