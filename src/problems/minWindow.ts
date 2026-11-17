import { pick, randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
import { err, isObj } from './helpers';

type I = { s: string; t: string };
/** Window is s[l..r); best = [start, length] of the shortest covering window so far. */
type S = { s: string; t: string; l: number; r: number; best: [number, number] | null };

const counts = (s: string, l = 0, r = s.length) => {
  const c: Record<string, number> = {};
  for (let i = l; i < r; i++) c[s[i]] = (c[s[i]] ?? 0) + 1;
  return c;
};
const covers = (s: string, t: string, l: number, r: number) => {
  const w = counts(s, l, r);
  return Object.entries(counts(t)).every(([ch, n]) => (w[ch] ?? 0) >= n);
};
const cov = (st: S) => covers(st.s, st.t, st.l, st.r);
const missing = (st: S) => {
  const w = counts(st.s, st.l, st.r);
  return Object.entries(counts(st.t))
    .filter(([ch, n]) => (w[ch] ?? 0) < n)
    .map(([ch, n]) => `${ch}×${n - (w[ch] ?? 0)}`)
    .join(', ');
};
const record = (st: S): S => {
  const len = st.r - st.l;
  return cov(st) && (!st.best || len < st.best[1]) ? { ...st, best: [st.l, len] } : st;
};
const bestStr = (st: S) => (st.best ? st.s.slice(st.best[0], st.best[0] + st.best[1]) : '');

export const minWindow: Problem<I, S> = {
  id: 'minimum-window-substring',
  number: 76,
  category: 'sliding-window',
  difficulty: 'Hard',
  title: L('最小覆蓋子字串', 'Minimum Window Substring'),
  description: L(
    '在 s 裡找最短的一段連續子字串，包含 t 的所有字元（含重複次數）。找不到就回傳空字串。',
    'Find the shortest substring of s that contains every character of t (with multiplicity). Return "" if there is none.',
  ),
  insight: L(
    '右邊一直擴張，直到視窗包含 t 的所有字元；一旦包含，就記錄長度，然後從左邊縮，看能不能更短。縮到不再包含時，又換右邊擴張。',
    'Expand on the right until the window covers t; once it does, record its length and shrink from the left to try something shorter. When it stops covering, expand again.',
  ),
  complexity: {
    time: 'O(n + m)',
    space: 'O(1)',
    why: L(
      'L 和 R 都只往右走，每個字元最多進出各一次；比對用「已滿足的字母種類數」只需 O(1) 更新。計數表的大小受字母種類限制。暴力解檢查每個子字串是 O(n²·m) 以上。',
      'L and R only move right, so each character enters and leaves once; tracking how many letter kinds are satisfied updates in O(1). Count tables are bounded by the alphabet. Checking every substring is O(n²·m) or worse.',
    ),
  },
  examples: [
    { s: 'ADOBECODEBANC', t: 'ABC' },
    { s: 'aa', t: 'aa' },
    { s: 'CABWEFGEWCWAEFGCF', t: 'CAE' },
  ],
  random: () => ({ s: Array.from({ length: randInt(7, 12) }, () => pick('ABCDD')).join(''), t: Array.from({ length: randInt(2, 3) }, () => pick('ABC')).join('') }),
  validate(x) {
    if (!isObj(x) || typeof x.s !== 'string' || typeof x.t !== 'string' || !/^[A-Za-z]{1,24}$/.test(x.s) || !/^[A-Za-z]{1,8}$/.test(x.t))
      return err('需要 {"s": "1–24 個英文字母", "t": "1–8 個英文字母"}', 'Expected {"s": "1–24 letters", "t": "1–8 letters"}');
    return null;
  },
  formatInput: (i) => `s = ${JSON.stringify(i.s)}, t = ${JSON.stringify(i.t)}`,

  init: ({ s, t }) => ({ s, t, l: 0, r: 0, best: null }),
  isDone: (st) => !cov(st) && st.r >= st.s.length,
  options: () => [
    { id: 'expand', label: L('加入 s[R]，R 右移', 'Add s[R], R →') },
    { id: 'shrink', label: L('移出 s[L]，L 右移', 'Remove s[L], L →') },
  ],
  correct: (st) => (cov(st) ? ['shrink'] : ['expand']),
  apply: (st, act) => record(act === 'expand' ? { ...st, r: st.r + 1 } : { ...st, l: st.l + 1 }),
  explain(st, act) {
    if (act === 'expand') {
      const nx = { ...st, r: st.r + 1 };
      return cov(nx)
        ? L(
            `加入 '${st.s[st.r]}'，視窗 "${st.s.slice(nx.l, nx.r)}" 包含 t 的所有字元了！長度 ${nx.r - nx.l}${!st.best || nx.r - nx.l < st.best[1] ? '，刷新最短紀錄' : ''}。`,
            `Add '${st.s[st.r]}': window "${st.s.slice(nx.l, nx.r)}" covers t! Length ${nx.r - nx.l}${!st.best || nx.r - nx.l < st.best[1] ? ', a new shortest' : ''}.`,
          )
        : L(`加入 '${st.s[st.r]}'，還缺 ${missing(nx)}。`, `Add '${st.s[st.r]}'; still missing ${missing(nx)}.`);
    }
    const nx = { ...st, l: st.l + 1 };
    return cov(nx)
      ? L(
          `視窗已經包含 t，試著縮短：移出 '${st.s[st.l]}' 後仍然包含，長度 ${nx.r - nx.l}${!st.best || nx.r - nx.l < st.best[1] ? '，刷新最短紀錄！' : '。'}`,
          `It covers t, so try shorter: after removing '${st.s[st.l]}' it still covers, length ${nx.r - nx.l}${!st.best || nx.r - nx.l < st.best[1] ? ', a new shortest!' : '.'}`,
        )
      : L(`視窗已經包含 t，試著縮短：移出 '${st.s[st.l]}' 後就缺 ${missing(nx)} 了，換右邊擴張。`, `It covers t, so try shorter: removing '${st.s[st.l]}' leaves ${missing(nx)} missing. Expand again.`);
  },
  whyWrong(st, act) {
    if (act === 'expand')
      return L(`視窗 "${st.s.slice(st.l, st.r)}" 已經包含 t 的所有字元了。先從左邊縮，看能不能更短。`, `Window "${st.s.slice(st.l, st.r)}" already covers t. Shrink from the left to try shorter first.`);
    return L(`視窗還沒包含 t 的所有字元（還缺 ${missing(st)}），縮了只會缺更多。先往右擴張。`, `The window doesn't cover t yet (missing ${missing(st)}); shrinking only loses more. Expand first.`);
  },
  hints: (st) => [
    L('視窗裡有沒有 t 的每一個字元（含次數）？', 'Does the window contain every character of t, with counts?'),
    cov(st) ? L('有，全部都包含了。', 'Yes, it covers all of them.') : L(`還缺：${missing(st)}`, `Missing: ${missing(st)}`),
  ],
  scene(st) {
    const { s, t, l, r, best } = st;
    const done = !cov(st) && r >= s.length;
    const marks: Record<number, CellMark> = {};
    for (let i = 0; i < l; i++) marks[i] = 'gone';
    if (best) for (let i = best[0]; i < best[0] + best[1]; i++) if (i < l || i >= r) marks[i] = 'good';
    if (!done) {
      if (cov(st)) marks[l] = 'focus';
      else if (r < s.length) marks[r] = 'focus';
    }
    const w = counts(s, l, r);
    return [
      {
        kind: 'array',
        id: 's',
        label: L('字串 s（藍色是視窗，綠色是目前最短的答案）', 'string s (blue = window, green = shortest so far)'),
        values: [...s],
        pointers: done ? [] : [
          { name: 'L', index: l, color: 'a' },
          { name: 'R', index: r, color: 'b' },
        ],
        window: r > l ? [l, r - 1] : null,
        marks,
        dragPrefix: 'c',
        dragMask: [...s].map((_, i) => !done && i >= l),
      },
      {
        kind: 'set',
        id: 'need',
        label: L(`t = "${t}" 需要的字元（視窗有 / 需要）——拖進來 = 加入視窗`, `chars t = "${t}" needs (have / need): drop here to add`),
        items: Object.entries(counts(t))
          .sort()
          .map(([ch, n]) => `${ch} ${Math.min(w[ch] ?? 0, 99)}/${n}${(w[ch] ?? 0) >= n ? ' ✓' : ''}`),
        dropId: done ? undefined : 'win',
      },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'covers t?', value: cov(st) ? '✓' : '✗', highlight: cov(st) },
          { name: 'res', value: best ? `"${bestStr(st)}"` : '""', highlight: true },
        ],
      },
      { kind: 'zones', id: 'zones', zones: [{ id: 'out', label: L('🗑️ 移出視窗（只能從最左邊）', '🗑️ Remove from window (leftmost only)'), tone: 'trash' }] },
    ];
  },
  drag: {
    instructions: L(
      '視窗還沒包含 t 的所有字元時，把 s[R] 拖進需求表擴張；包含了就把最左邊拖進 🗑️，試著縮短。',
      "While the window doesn't cover t, drag s[R] into the requirement table to expand. Once it covers t, drag the leftmost into 🗑️ to try shorter.",
    ),
    moves: (st) => (cov(st) ? [{ action: 'shrink', from: `c:${st.l}`, to: 'out' }] : [{ action: 'expand', from: `c:${st.r}`, to: 'win' }]),
    whyWrong(st, from, to) {
      const k = Number(from.split(':')[1]);
      if (k > st.r || (k === st.r && to === 'out'))
        return k === st.r ? L(`'${st.s[k]}' 還沒進視窗。`, `'${st.s[k]}' isn't in the window yet.`) : L(`還沒輪到 '${st.s[k]}'，下一個是 s[R] = '${st.s[st.r]}'。`, `Not '${st.s[k]}' yet; next is s[R] = '${st.s[st.r]}'.`);
      if (k < st.r && to === 'win') return L(`'${st.s[k]}' 已經在視窗裡了。`, `'${st.s[k]}' is already in the window.`);
      if (k > st.l && k < st.r) return L(`只能從最左邊移出，最左邊是 '${st.s[st.l]}'。`, `Remove from the left end only: '${st.s[st.l]}'.`);
      return minWindow.whyWrong(st, to === 'out' ? 'shrink' : 'expand') ?? L('這一步不對。', 'Not quite.');
    },
  },
  result: (st) => L(`回傳 "${bestStr(st)}"`, `Returned "${bestStr(st)}"`),
  code: `def minWindow(self, s: str, t: str) -> str:
    need, window = Counter(t), Counter()
    have, required = 0, len(need)
    res, resLen = "", float("inf")
    l = 0
    for r in range(len(s)):
        window[s[r]] += 1
        if s[r] in need and window[s[r]] == need[s[r]]:
            have += 1
        while have == required:
            if r - l + 1 < resLen:
                res, resLen = s[l:r + 1], r - l + 1
            window[s[l]] -= 1
            if s[l] in need and window[s[l]] < need[s[l]]:
                have -= 1
            l += 1
    return res`,
  lineOf: { init: 2, expand: 7, shrink: 13 },
  answer: bestStr,
  verify({ s, t }, ans) {
    let best = '';
    for (let len = 1; len <= s.length && !best; len++)
      for (let i = 0; i + len <= s.length; i++)
        if (covers(s, t, i, i + len)) {
          best = s.slice(i, i + len);
          break;
        }
    return ans === best;
  },
};
