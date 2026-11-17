import { pick, randInt } from '../core/engine';
import { L, TAP, type CellMark, type DragMove, type Problem } from '../core/types';
import { err, isObj } from './helpers';

type I = { ops: string[] };
/**
 * One key, for focus. store = [value, timestamp] in increasing time.
 * During a get: l / r = search range, res = best value found so far.
 */
type S = { ops: string[]; i: number; store: [string, number][]; l: number; r: number; res: string; inGet: boolean; out: string[] };

const parse = (op: string) => {
  const p = op.trim().split(/\s+/);
  return p[0] === 'set' ? { name: 'set' as const, val: p[1], t: Number(p[2]) } : { name: 'get' as const, val: '', t: Number(p[1]) };
};
const mid = (l: number, r: number) => Math.floor((l + r) / 2);

/** Enter the next op: a get starts a search over the whole store. */
function enter(st: S): S {
  if (st.i >= st.ops.length) return st;
  const op = parse(st.ops[st.i]);
  return op.name === 'get' ? { ...st, inGet: true, l: 0, r: st.store.length - 1, res: '' } : { ...st, inGet: false };
}

export const timeMap: Problem<I, S> = {
  id: 'time-based-key-value-store',
  number: 981,
  category: 'binary-search',
  difficulty: 'Medium',
  title: L('基於時間的鍵值儲存', 'Time Based Key-Value Store'),
  description: L(
    '設計一個資料結構：set 存下「某個時間點的值」，get(t) 回傳時間 ≤ t 的最後一個值（沒有就回傳空字串）。這裡用單一個 key 來練習。',
    'Design a store where set records a value at a timestamp and get(t) returns the latest value with timestamp ≤ t (or "" if none). We practice with a single key.',
  ),
  insight: L(
    'set 的時間是遞增的，所以每個 key 的紀錄天生就是排好序的，直接 append。get(t) 就是在這個有序清單上二分搜尋「≤ t 的最後一筆」：M 的時間 ≤ t 就記下它、再往右找更晚的；否則往左找。',
    'Timestamps of set calls increase, so each key\'s records are already sorted: just append. get(t) is a binary search for the last record with time ≤ t: if M\'s time ≤ t, record it and look right for a later one; otherwise look left.',
  ),
  complexity: {
    time: 'O(log n)',
    space: 'O(n)',
    why: L(
      'set 只是 append；get 在該 key 的 n 筆紀錄上二分搜尋。所有紀錄都要存，所以空間 O(n)。如果 get 從後往前一筆一筆找，是 O(n)。',
      'set just appends; get binary-searches the key\'s n records. Every record is stored, so O(n) space. Scanning backwards on each get would be O(n).',
    ),
  },
  examples: [
    { ops: ['set bar 1', 'get 1', 'get 3', 'set bar2 4', 'get 4', 'get 5'] },
    { ops: ['set a 1', 'set b 3', 'set c 6', 'set d 9', 'get 7', 'get 0', 'get 9'] },
    { ops: ['set x 2', 'set y 5', 'get 4', 'set z 8', 'get 10'] },
  ],
  random() {
    const ops: string[] = [];
    let t = 0;
    const n = randInt(5, 8);
    let sets = 0;
    while (ops.length < n) {
      if (sets < 2 || Math.random() < 0.45) {
        t += randInt(1, 3);
        ops.push(`set ${pick('abcdefgh')}${sets} ${t}`);
        sets++;
      } else ops.push(`get ${randInt(0, t + 2)}`);
    }
    return { ops };
  },
  validate(x) {
    if (!isObj(x) || !Array.isArray(x.ops) || x.ops.length === 0 || x.ops.length > 12)
      return err('需要 {"ops": ["set 值 時間", "get 時間", ...]}，1–12 個操作', 'Expected {"ops": ["set value time", "get time", ...]}, 1–12 ops');
    let last = -Infinity;
    for (const op of x.ops) {
      if (typeof op !== 'string') return err('每個操作都要是字串', 'Every op must be a string');
      const p = op.trim().split(/\s+/);
      if (p[0] === 'set' && p.length === 3 && Number.isInteger(Number(p[2]))) {
        if (Number(p[2]) <= last) return err('set 的時間必須遞增', 'set timestamps must increase');
        last = Number(p[2]);
      } else if (!(p[0] === 'get' && p.length === 2 && Number.isInteger(Number(p[1])))) return err(`無法辨識的操作 "${op}"`, `Unknown op "${op}"`);
    }
    return null;
  },
  formatInput: (i) => `ops = [${i.ops.map((o) => JSON.stringify(o)).join(', ')}]`,

  init: ({ ops }) => enter({ ops, i: 0, store: [], l: 0, r: -1, res: '', inGet: false, out: [] }),
  isDone: (st) => st.i >= st.ops.length,
  options: () => [
    { id: 'append', label: L('set：加到清單尾端', 'set: append to the list') },
    { id: 'goRight', label: L('M 的時間 ≤ t：記下，往右找', "M's time ≤ t: record, go right") },
    { id: 'goLeft', label: L('M 的時間 > t：往左找', "M's time > t: go left") },
    { id: 'return', label: L('回傳 res', 'Return res') },
  ],
  correct(st) {
    if (!st.inGet) return ['append'];
    if (st.l > st.r) return ['return'];
    return st.store[mid(st.l, st.r)][1] <= parse(st.ops[st.i]).t ? ['goRight'] : ['goLeft'];
  },
  apply(st, a) {
    const op = parse(st.ops[st.i]);
    if (a === 'append') return enter({ ...st, store: [...st.store, [op.val, op.t]], i: st.i + 1 });
    if (a === 'return') return enter({ ...st, out: [...st.out, st.res], i: st.i + 1, inGet: false });
    const m = mid(st.l, st.r);
    if (a === 'goRight') return { ...st, res: st.store[m][0], l: m + 1 };
    return { ...st, r: m - 1 };
  },
  explain(st, a) {
    const op = parse(st.ops[st.i]);
    if (a === 'append') return L(`set "${op.val}" @ ${op.t}：時間是遞增的，直接加到清單尾端，清單仍然有序。`, `set "${op.val}" @ ${op.t}: timestamps increase, so append; the list stays sorted.`);
    if (a === 'return') return L(`範圍空了，get(${op.t}) 回傳 "${st.res}"。`, `The range is empty; get(${op.t}) returns "${st.res}".`);
    const [v, t] = st.store[mid(st.l, st.r)];
    if (a === 'goRight') return L(`M 的時間 ${t} ≤ ${op.t}，"${v}" 是候選答案，記下來；往右找有沒有更晚的。`, `M's time ${t} ≤ ${op.t}: "${v}" is a candidate, record it; look right for a later one.`);
    return L(`M 的時間 ${t} > ${op.t}，太晚了，往左找。`, `M's time ${t} > ${op.t}: too late, look left.`);
  },
  whyWrong(st, a) {
    if (!st.inGet) return L('這是 set 操作，把它加到清單尾端。', 'This is a set: append it to the list.');
    const op = parse(st.ops[st.i]);
    if (st.l > st.r) return L(`範圍空了，回傳目前記下的 "${st.res}"。`, `The range is empty; return the recorded "${st.res}".`);
    if (a === 'return') return L('範圍還沒空。', 'The range is not empty yet.');
    if (a === 'append') return L(`這是 get(${op.t})，要搜尋，不是新增。`, `This is get(${op.t}): search, don't add.`);
    const t = st.store[mid(st.l, st.r)][1];
    return a === 'goLeft'
      ? L(`M 的時間 ${t} ≤ ${op.t}，它是合法的候選，右邊可能還有更晚但 ≤ ${op.t} 的。`, `M's time ${t} ≤ ${op.t} is a valid candidate; the right may have a later one ≤ ${op.t}.`)
      : L(`M 的時間 ${t} > ${op.t}，太晚了，不能當答案，右邊更晚。`, `M's time ${t} > ${op.t} is too late; everything right of it is later still.`);
  },
  hints: (st) => {
    if (!st.inGet) return [L('set 的時間一定比之前的晚。', 'A set always has a later timestamp than before.'), L('放到清單哪裡清單才會保持有序？', 'Where does it go to keep the list sorted?')];
    const op = parse(st.ops[st.i]);
    if (st.l > st.r) return [L('範圍還有東西嗎？', 'Is anything left in the range?'), L(`res = "${st.res}"`, `res = "${st.res}"`)];
    return [
      L(`找「時間 ≤ ${op.t} 的最後一筆」：比較 M 的時間和 ${op.t}。`, `Find the last record with time ≤ ${op.t}: compare M's time with ${op.t}.`),
      L(`M 的時間 = ${st.store[mid(st.l, st.r)][1]}。`, `M's time = ${st.store[mid(st.l, st.r)][1]}.`),
    ];
  },
  scene(st) {
    const { ops, i, store, l, r, res, inGet, out } = st;
    const done = i >= ops.length;
    const opMarks: Record<number, CellMark> = {};
    ops.forEach((_, k) => {
      if (k < i) opMarks[k] = 'done';
    });
    if (!done) opMarks[i] = 'focus';
    const m = mid(l, r);
    const sMarks: Record<number, CellMark> = {};
    if (inGet) store.forEach((_, k) => {
      if (k < l || k > r) sMarks[k] = 'gone';
    });
    if (inGet && l <= r) sMarks[m] = 'focus';
    const ptrs: { name: string; index: number; color: 'a' | 'b' | 'c' }[] = inGet && l <= r ? [{ name: 'L', index: l, color: 'a' }, { name: 'R', index: r, color: 'b' }, { name: 'M', index: m, color: 'c' }] : [];
    return [
      {
        kind: 'array',
        id: 'ops',
        label: L('操作（set 值@時間 / get 時間）', 'ops (set value@time / get time)'),
        values: ops.map((o) => {
          const p = parse(o);
          return p.name === 'set' ? `${p.val}@${p.t}` : `get ${p.t}`;
        }),
        pointers: done ? [] : [{ name: '▶', index: i, color: 'a' }],
        marks: opMarks,
        dragPrefix: 'o',
        dragMask: ops.map((_, k) => !done && k === i && !inGet),
      },
      {
        kind: 'array',
        id: 'store',
        label: L('清單（值@時間，時間遞增）', 'records (value@time, increasing time)'),
        values: store.length ? store.map(([v, t]) => `${v}@${t}`) : ['·'],
        pointers: ptrs,
        marks: sMarks,
        dragPrefix: inGet && l <= r ? 'k' : undefined,
        dragMask: store.map((_, k) => k >= l && k <= r),
      },
      { kind: 'vars', id: 'v', vars: [{ name: 'res', value: inGet ? `"${res}"` : '—', highlight: inGet }, { name: 'get t', value: inGet ? parse(ops[i]).t : '—' }] },
      { kind: 'set', id: 'out', label: L('get 的輸出', 'get outputs'), items: out.map((v, k) => `${k + 1}: "${v}"`) },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'append', label: L('➕ 加到清單尾端（set）', '➕ Append (set)'), tone: 'info' },
          { id: 'dropLeft', label: L('🗑️⬅ M 的時間 ≤ t：記下 M，丟掉 M 和左邊', "🗑️⬅ M's time ≤ t: record M, drop M and left"), tone: 'trash' },
          { id: 'dropRight', label: L('M 的時間 > t：丟掉 M 和右邊 ➡🗑️', "M's time > t: drop M and right ➡🗑️"), tone: 'trash' },
          { id: 'outZone', label: L('📤 回傳 res', '📤 Return res'), tone: 'good' },
        ],
      },
    ];
  },
  drag: {
    instructions: L(
      'set：把操作方塊拖到「加到清單尾端」。get：在清單上二分搜尋「時間 ≤ t 的最後一筆」，把不可能的那一半拖進對應的 🗑️；範圍空了點 📤 回傳。',
      'set: drag the op tile to "Append". get: binary-search the list for the last record with time ≤ t, dragging the impossible half into its 🗑️; when the range is empty, tap 📤.',
    ),
    tapZones: ['outZone'],
    moves(st) {
      const [a] = timeMap.correct(st);
      if (a === 'append') return [{ action: a, from: `o:${st.i}`, to: 'append' }];
      if (a === 'return') return [{ action: a, from: TAP, to: 'outZone' }];
      const m = mid(st.l, st.r);
      const out: DragMove[] = [];
      if (a === 'goRight') for (let k = st.l; k <= m; k++) out.push({ action: a, from: `k:${k}`, to: 'dropLeft' });
      else for (let k = m; k <= st.r; k++) out.push({ action: a, from: `k:${k}`, to: 'dropRight' });
      return out;
    },
    whyWrong(st, from, to) {
      if (from.startsWith('o:')) return timeMap.whyWrong(st, to === 'append' ? 'append' : 'goLeft') ?? L('這一步不對。', 'Not quite.');
      if (from === TAP || to === 'outZone') return timeMap.whyWrong(st, 'return') ?? L('這一步不對。', 'Not quite.');
      if (to === 'append') return L('這是 get，不是新增。', 'This is a get, not an add.');
      const act = to === 'dropLeft' ? 'goRight' : 'goLeft';
      if (timeMap.correct(st)[0] !== act) return timeMap.whyWrong(st, act) ?? L('這一步不對。', 'Not quite.');
      return L('這一格不在要丟的那一半裡。', "That cell isn't in the half being dropped.");
    },
  },
  result: (st) => L(`get 的輸出：[${st.out.map((v) => `"${v}"`).join(', ')}]`, `get outputs: [${st.out.map((v) => `"${v}"`).join(', ')}]`),
  code: `class TimeMap:
    def __init__(self):
        self.store = {}  # key -> list of [value, timestamp]

    def set(self, key: str, value: str, timestamp: int) -> None:
        self.store.setdefault(key, []).append([value, timestamp])

    def get(self, key: str, timestamp: int) -> str:
        res, values = "", self.store.get(key, [])
        l, r = 0, len(values) - 1
        while l <= r:
            m = (l + r) // 2
            if values[m][1] <= timestamp:
                res = values[m][0]
                l = m + 1
            else:
                r = m - 1
        return res`,
  lineOf: { init: 3, append: 6, goRight: 15, goLeft: 17, return: 18 },
  answer: (st) => st.out,
  verify({ ops }, ans) {
    const store: [string, number][] = [];
    const exp: string[] = [];
    for (const o of ops) {
      const p = parse(o);
      if (p.name === 'set') store.push([p.val, p.t]);
      else exp.push([...store].reverse().find(([, t]) => t <= p.t)?.[0] ?? '');
    }
    return JSON.stringify(ans) === JSON.stringify(exp);
  },
};
