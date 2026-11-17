import { randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';

type I = { nums: number[]; k: number };
/** r = index being processed; pushed = nums[r] already appended to the deque; dq holds indices. */
type S = { nums: number[]; k: number; r: number; pushed: boolean; dq: number[]; res: (number | null)[] };

const frontStale = (st: S) => st.dq.length > 0 && st.dq[0] < st.r - st.k + 1;
const needRecord = (st: S) => st.r >= st.k - 1 && st.res[st.r - st.k + 1] === null;

/** After a push / pop-front / record, move on to the next index when nothing is left to do for r. */
function settle(st: S): S {
  if (st.pushed && !frontStale(st) && !needRecord(st)) return { ...st, r: st.r + 1, pushed: false };
  return st;
}

export const slidingWindowMax: Problem<I, S> = {
  id: 'sliding-window-maximum',
  number: 239,
  category: 'sliding-window',
  difficulty: 'Hard',
  title: L('滑動視窗最大值', 'Sliding Window Maximum'),
  description: L(
    '長度 k 的視窗從左滑到右，回傳每個位置的視窗最大值。',
    'A window of size k slides from left to right. Return the maximum of each window position.',
  ),
  insight: L(
    '用一個「單調遞減」的 deque 存索引：新數字進來前，把尾端比它小的都丟掉（它們有新數字在，永遠不會再當最大值）；前端如果已經滑出視窗也丟掉。這樣 deque 的前端永遠是視窗最大值。',
    "Keep a decreasing deque of indices. Before a new number enters, drop smaller ones from the back (with the newcomer around they can never be the max again); drop the front if it has slid out. The front is then always the window's maximum.",
  ),
  complexity: {
    time: 'O(n)',
    space: 'O(k)',
    why: L(
      '每個索引最多進 deque 一次、出 deque 一次，總共 O(n)。deque 最多存 k 個索引。暴力解對每個視窗掃 k 個數，是 O(n·k)。',
      'Each index enters and leaves the deque at most once, so O(n) in total. The deque holds at most k indices. Scanning every window is O(n·k).',
    ),
  },
  examples: [
    { nums: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 },
    { nums: [9, 8, 7, 6, 5], k: 2 },
    { nums: [1, 3, 1, 2, 0, 5], k: 3 },
  ],
  random() {
    const n = randInt(6, 9);
    return { nums: Array.from({ length: n }, () => randInt(-3, 9)), k: randInt(2, 3) };
  },
  validate(x) {
    if (!isObj(x) || !isIntArray(x.nums, 1, 16) || typeof x.k !== 'number' || !Number.isInteger(x.k) || x.k < 1 || x.k > x.nums.length)
      return err('需要 {"nums": [整數...], "k": 1 到 nums 長度}，長度 1–16', 'Expected {"nums": [ints], "k": 1..len(nums)}, length 1–16');
    return null;
  },
  formatInput: (i) => `nums = [${i.nums.join(', ')}], k = ${i.k}`,

  init: ({ nums, k }) => ({ nums, k, r: 0, pushed: false, dq: [], res: Array(nums.length - k + 1).fill(null) }),
  isDone: (st) => st.r >= st.nums.length,
  options: () => [
    { id: 'popBack', label: L('丟掉 deque 尾端', 'Pop deque back') },
    { id: 'push', label: L('nums[r] 放進尾端', 'Push nums[r] to back') },
    { id: 'popFront', label: L('丟掉 deque 前端', 'Pop deque front') },
    { id: 'record', label: L('前端寫進 res', 'Record front into res') },
  ],
  correct(st) {
    const { nums, r, pushed, dq } = st;
    if (!pushed) return dq.length && nums[dq[dq.length - 1]] < nums[r] ? ['popBack'] : ['push'];
    if (frontStale(st)) return ['popFront'];
    return ['record'];
  },
  apply(st, act) {
    if (act === 'popBack') return { ...st, dq: st.dq.slice(0, -1) };
    if (act === 'push') return settle({ ...st, dq: [...st.dq, st.r], pushed: true });
    if (act === 'popFront') return settle({ ...st, dq: st.dq.slice(1) });
    const res = [...st.res];
    res[st.r - st.k + 1] = st.nums[st.dq[0]];
    return settle({ ...st, res });
  },
  explain(st, act) {
    const { nums, r, dq, k } = st;
    const back = dq[dq.length - 1];
    if (act === 'popBack')
      return L(`尾端 ${nums[back]} 比新來的 ${nums[r]} 小，有 ${nums[r]} 在，它永遠不會再當最大值，丟掉。`, `Back ${nums[back]} is smaller than the newcomer ${nums[r]}; it can never be the max again. Drop it.`);
    if (act === 'push') return L(`尾端沒有比 ${nums[r]} 小的了，把 ${nums[r]}（索引 ${r}）放進尾端。deque 保持遞減。`, `Nothing at the back is smaller than ${nums[r]}; push it (index ${r}). The deque stays decreasing.`);
    if (act === 'popFront') return L(`前端索引 ${dq[0]} 已經滑出視窗 [${r - k + 1}, ${r}]，丟掉。`, `Front index ${dq[0]} has slid out of window [${r - k + 1}, ${r}]. Drop it.`);
    return L(`視窗 [${r - k + 1}, ${r}] 的最大值是前端的 ${nums[dq[0]]}，寫進 res[${r - k + 1}]。`, `The max of window [${r - k + 1}, ${r}] is the front, ${nums[dq[0]]}. Write it into res[${r - k + 1}].`);
  },
  whyWrong(st, act) {
    const { nums, r, pushed, dq, k } = st;
    const back = dq[dq.length - 1];
    if (!pushed) {
      if (act === 'push') return L(`尾端的 ${nums[back]} 比 ${nums[r]} 小，先把它丟掉，不然 deque 就不是遞減了。`, `The back ${nums[back]} is smaller than ${nums[r]}; drop it first or the deque won't stay decreasing.`);
      if (act === 'popBack')
        return dq.length ? L(`尾端的 ${nums[back]} 沒有比 ${nums[r]} 小，要留著。直接放進 ${nums[r]}。`, `The back ${nums[back]} isn't smaller than ${nums[r]}; keep it and push ${nums[r]}.`) : L('deque 是空的。', 'The deque is empty.');
      return L(`還沒把 nums[r] = ${nums[r]} 放進 deque。`, `nums[r] = ${nums[r]} hasn't been pushed yet.`);
    }
    if (frontStale(st)) return L(`前端索引 ${dq[0]} 已經不在視窗 [${r - k + 1}, ${r}] 裡了，先丟掉。`, `Front index ${dq[0]} is outside window [${r - k + 1}, ${r}]. Drop it first.`);
    if (act === 'popFront') return L(`前端索引 ${dq[0]} 還在視窗 [${r - k + 1}, ${r}] 裡，它就是最大值，要留著。`, `Front index ${dq[0]} is still in window [${r - k + 1}, ${r}]; it's the max, keep it.`);
    return L(`${nums[r]} 已經放進去了，現在要寫答案。`, `${nums[r]} is already in; record the answer now.`);
  },
  hints: (st) => {
    const { nums, r, pushed, dq, k } = st;
    if (!pushed)
      return [
        L('新數字進來前：deque 尾端有比它小的嗎？', 'Before the new number enters: is anything at the back smaller?'),
        L(`新數字 ${nums[r]}，尾端 ${dq.length ? nums[dq[dq.length - 1]] : '（空）'}。`, `New ${nums[r]}, back ${dq.length ? nums[dq[dq.length - 1]] : '(empty)'}.`),
      ];
    return [
      L('deque 前端還在視窗裡嗎？', 'Is the deque front still inside the window?'),
      L(`前端索引 ${dq[0]}，視窗 [${r - k + 1}, ${r}]。`, `Front index ${dq[0]}, window [${r - k + 1}, ${r}].`),
    ];
  },
  scene(st) {
    const { nums, k, r, dq, res } = st;
    const done = r >= nums.length;
    const lo = Math.max(0, r - k + 1);
    const marks: Record<number, CellMark> = {};
    nums.forEach((_, i) => {
      if (i > r) return;
      if (i < lo) marks[i] = 'gone';
    });
    if (!done) marks[r] = 'focus';
    return [
      {
        kind: 'array',
        id: 'nums',
        label: L(`nums（視窗大小 k = ${k}）`, `nums (window size k = ${k})`),
        values: nums,
        pointers: done ? [] : [{ name: 'r', index: r, color: 'b' }],
        window: done ? null : [lo, r],
        marks,
        dragPrefix: 'n',
        dragMask: nums.map((_, i) => !done && i >= r),
      },
      {
        kind: 'array',
        id: 'dq',
        label: L('deque（前端 ← → 尾端；存索引，顯示數值）', 'deque (front ← → back; holds indices, shows values)'),
        values: dq.length ? dq.map((i) => nums[i]) : ['·'],
        dragPrefix: dq.length && !done ? 'q' : undefined,
        dragLabels: dq.map((i) => String(nums[i])),
        marks: (dq.length ? { 0: 'good' } : {}) as Record<number, CellMark>,
      },
      {
        kind: 'array',
        id: 'res',
        label: L('res（每個視窗的最大值）', 'res (max of each window)'),
        values: res.map((v) => (v === null ? '·' : v)),
        dropPrefix: done ? undefined : 'res',
      },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'back', label: L('➡ 放進 deque 尾端', '➡ Push to deque back'), tone: 'info' },
          { id: 'trash', label: L('🗑️ 丟掉（deque 的前端或尾端）', '🗑️ Discard (deque front or back)'), tone: 'trash' },
        ],
      },
    ];
  },
  drag: {
    instructions: L(
      'nums[r] 進來前，deque 尾端比它小的拖進 🗑️；然後把 nums[r] 拖到「放進尾端」。前端如果滑出視窗也拖進 🗑️。視窗滿了，就把 deque 前端拖到 res 對應的格子。',
      'Before nums[r] enters, drag smaller values at the deque back into 🗑️, then drag nums[r] to "Push to back". If the front has slid out, drag it into 🗑️ too. Once the window is full, drag the deque front into the matching res cell.',
    ),
    moves(st) {
      const [a] = slidingWindowMax.correct(st);
      const last = st.dq.length - 1;
      if (a === 'popBack') return [{ action: a, from: `q:${last}`, to: 'trash' }];
      if (a === 'push') return [{ action: a, from: `n:${st.r}`, to: 'back' }];
      if (a === 'popFront') return [{ action: a, from: 'q:0', to: 'trash' }];
      return [{ action: a, from: 'q:0', to: `res:${st.r - st.k + 1}` }];
    },
    whyWrong(st, from, to) {
      const [kind, idxS] = from.split(':');
      const i = Number(idxS);
      const last = st.dq.length - 1;
      if (kind === 'n') {
        if (i !== st.r) return L(`現在處理的是 nums[${st.r}] = ${st.nums[st.r]}。`, `The current number is nums[${st.r}] = ${st.nums[st.r]}.`);
        if (to !== 'back') return L(`把 ${st.nums[st.r]} 拖到「放進尾端」。`, `Drag ${st.nums[st.r]} to "Push to back".`);
        return slidingWindowMax.whyWrong(st, 'push') ?? L('這一步不對。', 'Not quite.');
      }
      if (i !== 0 && i !== last) return L('只能從 deque 的前端或尾端拿。', 'You can only take from the front or back of the deque.');
      if (to === 'back') return L('它已經在 deque 裡了。', "It's already in the deque.");
      if (to.startsWith('res:')) {
        if (i !== 0) return L('答案是 deque 的「前端」，不是尾端。', 'The answer is the deque front, not the back.');
        const j = Number(to.split(':')[1]);
        if (st.pushed && !frontStale(st) && j !== st.r - st.k + 1)
          return L(`這是視窗 [${st.r - st.k + 1}, ${st.r}] 的答案，要寫在 res[${st.r - st.k + 1}]。`, `This is the answer for window [${st.r - st.k + 1}, ${st.r}]; write it in res[${st.r - st.k + 1}].`);
        return slidingWindowMax.whyWrong(st, 'record') ?? L('這一步不對。', 'Not quite.');
      }
      // to trash
      const act = i === last && !st.pushed ? 'popBack' : i === 0 && st.pushed ? 'popFront' : i === last ? 'popBack' : 'popFront';
      return slidingWindowMax.whyWrong(st, act) ?? L('這一步不對。', 'Not quite.');
    },
  },
  result: (st) => L(`res = [${st.res.join(', ')}]`, `res = [${st.res.join(', ')}]`),
  code: `def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
    output = []
    q = collections.deque()  # indices, values decreasing
    for r in range(len(nums)):
        while q and nums[q[-1]] < nums[r]:
            q.pop()
        q.append(r)
        if q[0] < r - k + 1:
            q.popleft()
        if r >= k - 1:
            output.append(nums[q[0]])
    return output`,
  lineOf: { init: 2, popBack: 6, push: 7, popFront: 9, record: 11 },
  answer: (st) => st.res,
  verify({ nums, k }, ans) {
    const exp = [];
    for (let i = 0; i + k <= nums.length; i++) exp.push(Math.max(...nums.slice(i, i + k)));
    return JSON.stringify(ans) === JSON.stringify(exp);
  },
};
