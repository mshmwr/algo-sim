import { randInt } from '../core/engine';
import { L, TAP, type CellMark, type DragMove, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';

type I = { piles: number[]; h: number };
/** Binary search on the answer: speeds l..r; res = smallest feasible speed seen so far. */
type S = { piles: number[]; h: number; l: number; r: number; res: number; done: boolean };

const mid = (l: number, r: number) => Math.floor((l + r) / 2);
const hoursAt = (piles: number[], k: number) => piles.reduce((s, p) => s + Math.ceil(p / k), 0);

export const kokoBananas: Problem<I, S> = {
  id: 'koko-eating-bananas',
  number: 875,
  category: 'binary-search',
  difficulty: 'Medium',
  title: L('愛吃香蕉的珂珂', 'Koko Eating Bananas'),
  description: L(
    '有幾堆香蕉，每小時最多吃 k 根（一小時只吃一堆，吃不完下小時繼續）。要在 h 小時內吃完，k 最小可以是多少？',
    'Koko eats up to k bananas per hour from one pile (leftovers wait for the next hour). What is the smallest k that finishes all piles within h hours?',
  ),
  insight: L(
    '對「答案」做二分搜尋：速度 k 的範圍是 1 到最大那堆。試中間的速度 M：吃得完，代表更快一定也吃得完，記下 M 再往更慢的找；吃不完，就只能往更快的找。',
    'Binary search the answer: k ranges from 1 to the largest pile. Try the middle speed M: if it finishes, every faster speed does too, so record M and look slower; if not, only faster speeds can work.',
  ),
  complexity: {
    time: 'O(n log m)',
    space: 'O(1)',
    why: L(
      'm 是最大那堆的數量。二分搜尋試 log m 個速度，每次要算 n 堆花幾小時。從 1 開始一個一個試速度是 O(n·m)。',
      'm is the largest pile. Binary search tries log m speeds, each costing n to count hours. Trying speeds 1, 2, 3, … one by one is O(n·m).',
    ),
  },
  examples: [
    { piles: [3, 6, 7, 11], h: 8 },
    { piles: [30, 11, 23, 4, 20], h: 5 },
    { piles: [4, 9, 6], h: 6 },
  ],
  random() {
    const piles = Array.from({ length: randInt(3, 5) }, () => randInt(1, 12));
    return { piles, h: randInt(piles.length, piles.reduce((a, b) => a + b, 0)) };
  },
  validate(x) {
    if (!isObj(x) || !isIntArray(x.piles, 1, 8) || x.piles.some((p) => p < 1 || p > 30) || typeof x.h !== 'number' || !Number.isInteger(x.h))
      return err('需要 {"piles": [1–30 的整數...], "h": 整數}，1–8 堆', 'Expected {"piles": [ints 1–30], "h": int}, 1–8 piles');
    if (x.h < x.piles.length) return err('h 至少要等於堆數，否則不可能吃完', 'h must be at least the number of piles');
    return null;
  },
  formatInput: (i) => `piles = [${i.piles.join(', ')}], h = ${i.h}`,

  init: ({ piles, h }) => ({ piles, h, l: 1, r: Math.max(...piles), res: Math.max(...piles), done: false }),
  isDone: (st) => st.done,
  options: () => [
    { id: 'slower', label: L('吃得完：記下 M，往慢的找', 'Finishes: record M, try slower') },
    { id: 'faster', label: L('吃不完：往快的找', "Too slow: try faster") },
    { id: 'return', label: L('回傳 res', 'Return res') },
  ],
  correct: (st) => (st.l > st.r ? ['return'] : hoursAt(st.piles, mid(st.l, st.r)) <= st.h ? ['slower'] : ['faster']),
  apply(st, a) {
    const m = mid(st.l, st.r);
    if (a === 'slower') return { ...st, res: Math.min(st.res, m), r: m - 1 };
    if (a === 'faster') return { ...st, l: m + 1 };
    return { ...st, done: true };
  },
  explain({ piles, h, l, r, res }, a) {
    if (a === 'return') return L(`L > R，範圍試完了，最慢可行的速度是 ${res}。`, `L > R: every candidate is checked. The slowest speed that works is ${res}.`);
    const m = mid(l, r);
    const hrs = hoursAt(piles, m);
    if (a === 'slower')
      return L(`速度 ${m} 要 ${hrs} 小時 ≤ ${h}，吃得完！記下 ${m}，更快的一定也行，丟掉 M 和右邊，往更慢的找。`, `Speed ${m} takes ${hrs} h ≤ ${h}: it works! Record ${m}; faster speeds work too, so drop M and the right side and look slower.`);
    return L(`速度 ${m} 要 ${hrs} 小時 > ${h}，吃不完。更慢的更不行，丟掉 M 和左邊，往更快的找。`, `Speed ${m} takes ${hrs} h > ${h}: too slow. Slower speeds are worse, so drop M and the left side and look faster.`);
  },
  whyWrong({ piles, h, l, r }, a) {
    if (l > r) return L('L > R，範圍試完了，回傳 res。', 'L > R: done. Return res.');
    if (a === 'return') return L('範圍還沒試完。', 'There are still speeds to try.');
    const m = mid(l, r);
    const hrs = hoursAt(piles, m);
    if (a === 'faster') return L(`速度 ${m} 只要 ${hrs} 小時 ≤ ${h}，已經吃得完了，應該試更慢的，看能不能更省。`, `Speed ${m} needs only ${hrs} h ≤ ${h}; it already works. Try slower to find the minimum.`);
    return L(`速度 ${m} 要 ${hrs} 小時 > ${h}，吃不完。更慢只會更久，要往更快的找。`, `Speed ${m} needs ${hrs} h > ${h}: too slow. Slower is even worse; look faster.`);
  },
  hints: ({ piles, h, l, r }) => [
    L('用中間的速度 M 算算看：每堆要 ⌈堆 / M⌉ 小時，總共會不會超過 h？', 'At the middle speed M, each pile takes ⌈pile / M⌉ hours. Does the total exceed h?'),
    l > r ? L(`L = ${l} > R = ${r}。`, `L = ${l} > R = ${r}.`) : L(`速度 ${mid(l, r)}：${piles.map((p) => Math.ceil(p / mid(l, r))).join(' + ')} = ${hoursAt(piles, mid(l, r))} 小時，h = ${h}。`, `Speed ${mid(l, r)}: ${piles.map((p) => Math.ceil(p / mid(l, r))).join(' + ')} = ${hoursAt(piles, mid(l, r))} h, h = ${h}.`),
  ],
  scene({ piles, h, l, r, res, done }) {
    const max = Math.max(...piles);
    const speeds = Array.from({ length: max }, (_, k) => k + 1);
    const m = mid(l, r);
    const marks: Record<number, CellMark> = {};
    speeds.forEach((s, k) => {
      if (s < l || s > r) marks[k] = 'gone';
    });
    if (!done && l <= r) marks[m - 1] = 'focus';
    marks[res - 1] = marks[res - 1] === 'focus' ? 'focus' : 'good';
    const pointers: { name: string; index: number; color: 'a' | 'b' | 'c' }[] = [];
    if (!done && l <= r) pointers.push({ name: 'L', index: l - 1, color: 'a' }, { name: 'R', index: r - 1, color: 'b' }, { name: 'M', index: m - 1, color: 'c' });
    return [
      { kind: 'array', id: 'piles', label: L('每堆香蕉數', 'bananas per pile'), values: piles, bars: true },
      {
        kind: 'array',
        id: 'hours',
        label: L(l <= r ? `用速度 M = ${m} 每堆要幾小時` : '每堆要幾小時', l <= r ? `hours per pile at speed M = ${m}` : 'hours per pile'),
        values: l <= r ? piles.map((p) => Math.ceil(p / m)) : piles.map(() => '·'),
      },
      {
        kind: 'array',
        id: 'speeds',
        label: L('可能的速度 k（綠色 = 目前記下的 res）', 'candidate speeds k (green = recorded res)'),
        values: speeds,
        pointers,
        marks,
        dragPrefix: 'k',
        dragMask: speeds.map((s) => !done && s >= l && s <= r),
      },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'hours(M)', value: l <= r ? hoursAt(piles, m) : '—', highlight: true },
          { name: 'h', value: h },
          { name: 'res', value: res },
        ],
      },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'dropLeft', label: L('🗑️⬅ 吃不完：丟掉 M 和更慢的', "🗑️⬅ Too slow: drop M and slower"), tone: 'trash' },
          { id: 'dropRight', label: L('吃得完：記下 M，丟掉 M 和更快的 ➡🗑️', 'Finishes: record M, drop M and faster ➡🗑️'), tone: 'trash' },
          { id: 'end', label: L('🏁 回傳 res', '🏁 Return res'), tone: 'good' },
        ],
      },
    ];
  },
  drag: {
    instructions: L(
      '用中間的速度 M 算總時數：吃得完就記下 M，抓「M 和更快」那一段任一格拖到右邊的 🗑️；吃不完就抓「M 和更慢」那段拖到左邊的 🗑️。範圍空了點 🏁。',
      'Total the hours at the middle speed M. If it finishes, record M and drag any cell of "M and faster" to the right 🗑️; if not, drag any cell of "M and slower" to the left 🗑️. When the range is empty, tap 🏁.',
    ),
    tapZones: ['end'],
    moves(st) {
      const { l, r } = st;
      if (l > r) return [{ action: 'return', from: TAP, to: 'end' }];
      const m = mid(l, r);
      const out: DragMove[] = [];
      if (kokoBananas.correct(st)[0] === 'slower') for (let s = m; s <= r; s++) out.push({ action: 'slower', from: `k:${s - 1}`, to: 'dropRight' });
      else for (let s = l; s <= m; s++) out.push({ action: 'faster', from: `k:${s - 1}`, to: 'dropLeft' });
      return out;
    },
    whyWrong(st, from, to) {
      if (st.l > st.r || from === TAP || to === 'end') return kokoBananas.whyWrong(st, 'return') ?? L('這一步不對。', 'Not quite.');
      const want = kokoBananas.correct(st)[0];
      const act = to === 'dropRight' ? 'slower' : 'faster';
      if (want !== act) return kokoBananas.whyWrong(st, act) ?? L('這一步不對。', 'Not quite.');
      const s = Number(from.split(':')[1]) + 1;
      return act === 'slower' ? L(`速度 ${s} 比 M 慢，不屬於「M 和更快」那一段。`, `Speed ${s} is slower than M, not in "M and faster".`) : L(`速度 ${s} 比 M 快，不屬於「M 和更慢」那一段。`, `Speed ${s} is faster than M, not in "M and slower".`);
    },
  },
  result: (st) => L(`最小速度 = ${st.res}`, `Minimum speed = ${st.res}`),
  code: `def minEatingSpeed(self, piles: List[int], h: int) -> int:
    l, r = 1, max(piles)
    res = r
    while l <= r:
        k = (l + r) // 2
        hours = sum(math.ceil(p / k) for p in piles)
        if hours <= h:
            res = min(res, k)
            r = k - 1
        else:
            l = k + 1
    return res`,
  lineOf: { init: 2, slower: 9, faster: 11, return: 12 },
  answer: (st) => st.res,
  verify({ piles, h }, ans) {
    let k = 1;
    while (hoursAt(piles, k) > h) k++;
    return ans === k;
  },
};
