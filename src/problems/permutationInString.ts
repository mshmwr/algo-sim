import { pick, randInt } from '../core/engine';
import { L, TAP, type CellMark, type Problem } from '../core/types';
import { err, isObj } from './helpers';

type I = { s1: string; s2: string };
/** Window is s2[l..r). */
type S = { s1: string; s2: string; l: number; r: number; done: boolean; result: boolean | null };

const counts = (s: string, l = 0, r = s.length) => {
  const c: Record<string, number> = {};
  for (let i = l; i < r; i++) c[s[i]] = (c[s[i]] ?? 0) + 1;
  return c;
};
const same = (a: Record<string, number>, b: Record<string, number>) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((k) => (a[k] ?? 0) === (b[k] ?? 0));
};
const fmt = (c: Record<string, number>) =>
  Object.entries(c)
    .filter(([, n]) => n > 0)
    .sort()
    .map(([ch, n]) => `${ch}×${n}`);
const matches = (st: S) => st.r - st.l === st.s1.length && same(counts(st.s2, st.l, st.r), counts(st.s1));

export const permutationInString: Problem<I, S> = {
  id: 'permutation-in-string',
  number: 567,
  category: 'sliding-window',
  difficulty: 'Medium',
  title: L('字串的排列', 'Permutation in String'),
  description: L(
    '判斷 s2 裡有沒有一段連續子字串，剛好是 s1 的某種排列（字母和數量完全相同，順序不限）。',
    'Decide whether s2 contains a contiguous substring that is a permutation of s1 (same letters and counts, any order).',
  ),
  insight: L(
    '排列 = 字母數量完全相同。在 s2 上維持一個長度固定為 len(s1) 的視窗：右邊加一個字、超過長度就從左邊丟一個，每次比對視窗和 s1 的字母數量。',
    'A permutation has exactly the same letter counts. Slide a window of fixed length len(s1) over s2: add one on the right, drop one on the left when it gets too long, and compare letter counts each time.',
  ),
  complexity: {
    time: 'O(n)',
    space: 'O(1)',
    why: L(
      '視窗每次只進一個、出一個字元；比對兩張最多 26 個字母的計數表是常數時間。暴力解列出 s1 的所有排列是 O(m!)。',
      'Each slide adds and drops one character; comparing two count tables of at most 26 letters is constant time. Generating every permutation of s1 is O(m!).',
    ),
  },
  examples: [
    { s1: 'ab', s2: 'eidbaooo' },
    { s1: 'ab', s2: 'eidboaoo' },
    { s1: 'abc', s2: 'ccbbaca' },
  ],
  random() {
    const s1 = Array.from({ length: randInt(2, 3) }, () => pick('abc')).join('');
    let s2 = Array.from({ length: randInt(6, 10) }, () => pick('abcd')).join('');
    if (Math.random() < 0.5) {
      const p = [...s1].sort(() => Math.random() - 0.5).join('');
      const at = randInt(0, s2.length - s1.length);
      s2 = s2.slice(0, at) + p + s2.slice(at + p.length);
    }
    return { s1, s2 };
  },
  validate(x) {
    if (!isObj(x) || typeof x.s1 !== 'string' || typeof x.s2 !== 'string' || !/^[a-z]{1,8}$/.test(x.s1) || !/^[a-z]{1,24}$/.test(x.s2))
      return err('需要 {"s1": "1–8 個小寫字母", "s2": "1–24 個小寫字母"}', 'Expected {"s1": "1–8 lowercase", "s2": "1–24 lowercase"}');
    return null;
  },
  formatInput: (i) => `s1 = ${JSON.stringify(i.s1)}, s2 = ${JSON.stringify(i.s2)}`,

  init: ({ s1, s2 }) => ({ s1, s2, l: 0, r: 0, done: false, result: null }),
  isDone: (st) => st.done,
  options: () => [
    { id: 'expand', label: L('加入 s2[R]', 'Add s2[R]') },
    { id: 'shrink', label: L('移出 s2[L]', 'Remove s2[L]') },
    { id: 'true', label: L('回傳 True', 'Return True') },
    { id: 'false', label: L('回傳 False', 'Return False') },
  ],
  correct(st) {
    if (st.r - st.l > st.s1.length) return ['shrink'];
    if (matches(st)) return ['true'];
    if (st.r >= st.s2.length) return ['false'];
    return ['expand'];
  },
  apply(st, act) {
    if (act === 'expand') return { ...st, r: st.r + 1 };
    if (act === 'shrink') return { ...st, l: st.l + 1 };
    return { ...st, done: true, result: act === 'true' };
  },
  explain(st, act) {
    const m = st.s1.length;
    if (act === 'expand') {
      const len = st.r + 1 - st.l;
      return L(
        `加入 '${st.s2[st.r]}'，視窗長度 ${len}${len > m ? `，超過 s1 的長度 ${m}` : ''}。`,
        `Add '${st.s2[st.r]}'; window length ${len}${len > m ? `, longer than len(s1) = ${m}` : ''}.`,
      );
    }
    if (act === 'shrink') return L(`視窗比 s1 長，從左邊移出 '${st.s2[st.l]}'。`, `The window is longer than s1; remove '${st.s2[st.l]}' from the left.`);
    if (act === 'true')
      return L(`視窗 "${st.s2.slice(st.l, st.r)}" 的字母數量和 s1 完全相同，是排列！回傳 True。`, `Window "${st.s2.slice(st.l, st.r)}" has exactly s1's letter counts: a permutation! Return True.`);
    return L('視窗滑到底都沒有找到相同的字母數量，回傳 False。', 'The window reached the end without a match. Return False.');
  },
  whyWrong(st, act) {
    const m = st.s1.length;
    const len = st.r - st.l;
    if (len > m) return L(`視窗長度 ${len} 已經超過 s1 的長度 ${m}，先從左邊移出一個。`, `Window length ${len} exceeds len(s1) = ${m}. Remove one from the left first.`);
    if (matches(st)) return L('視窗的字母數量和 s1 完全相同，已經找到了！', 'The window has exactly the same letter counts as s1. Found it!');
    if (act === 'shrink') return L(`視窗長度 ${len} 還沒超過 ${m}，不用移出。`, `Window length ${len} doesn't exceed ${m}; no need to remove.`);
    if (act === 'true')
      return len < m
        ? L(`視窗只有 ${len} 個字，還不到 s1 的長度 ${m}。`, `The window has only ${len} characters, fewer than len(s1) = ${m}.`)
        : L('視窗的字母數量和 s1 不一樣。', "The window's letter counts differ from s1.");
    if (act === 'false') return L('s2 還沒看完，可能後面就有。', 's2 is not finished; a match may still come.');
    return L('s2 已經看完了。', 's2 has been fully scanned.');
  },
  hints: (st) => [
    L('視窗長度和 s1 一樣嗎？字母數量一樣嗎？', 'Is the window as long as s1? Are the letter counts the same?'),
    L(`視窗 {${fmt(counts(st.s2, st.l, st.r)).join(', ')}}，s1 {${fmt(counts(st.s1)).join(', ')}}`, `window {${fmt(counts(st.s2, st.l, st.r)).join(', ')}}, s1 {${fmt(counts(st.s1)).join(', ')}}`),
  ],
  scene(st) {
    const { s1, s2, l, r, done, result } = st;
    const marks: Record<number, CellMark> = {};
    for (let i = 0; i < l; i++) marks[i] = 'gone';
    if (done && result) for (let i = l; i < r; i++) marks[i] = 'good';
    else if (!done && r < s2.length) marks[r] = 'focus';
    return [
      {
        kind: 'array',
        id: 's2',
        label: L('s2（藍色是視窗）', 's2 (blue is the window)'),
        values: [...s2],
        pointers: done ? [] : [
          { name: 'L', index: l, color: 'a' },
          { name: 'R', index: r, color: 'b' },
        ],
        window: r > l ? [l, r - 1] : null,
        marks,
        dragPrefix: 'c',
        dragMask: [...s2].map((_, i) => !done && i >= l),
      },
      { kind: 'set', id: 'need', label: L(`s1 = "${s1}" 的字母數量`, `letter counts of s1 = "${s1}"`), items: fmt(counts(s1)) },
      { kind: 'set', id: 'win', label: L('視窗的字母數量（拖進來 = 加入）', 'window letter counts (drop here to add)'), items: fmt(counts(s2, l, r)), dropId: done ? undefined : 'win' },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'out', label: L('🗑️ 移出視窗（最左邊）', '🗑️ Remove (leftmost)'), tone: 'trash' },
          { id: 'yes', label: L('✓ 找到排列', '✓ Found a permutation'), tone: 'good' },
          { id: 'no', label: L('✗ 沒有', '✗ None'), tone: 'bad' },
        ],
      },
    ];
  },
  drag: {
    instructions: L(
      '把 s2[R] 拖進視窗計數區；視窗比 s1 長，就把最左邊拖進 🗑️。視窗的字母數量和 s1 一樣時點 ✓；滑到底都沒有就點 ✗。',
      "Drag s2[R] into the window counts; when the window is longer than s1, drag the leftmost into 🗑️. When the counts match s1, tap ✓; if the end is reached with no match, tap ✗.",
    ),
    tapZones: ['yes', 'no'],
    moves(st) {
      const [a] = permutationInString.correct(st);
      if (a === 'expand') return [{ action: a, from: `c:${st.r}`, to: 'win' }];
      if (a === 'shrink') return [{ action: a, from: `c:${st.l}`, to: 'out' }];
      return [{ action: a, from: TAP, to: a === 'true' ? 'yes' : 'no' }];
    },
    whyWrong(st, from, to) {
      if (from !== TAP) {
        const k = Number(from.split(':')[1]);
        if (to === 'yes' || to === 'no') return L('直接點 ✓ 或 ✗ 就好。', 'Just tap ✓ or ✗.');
        if (k > st.r) return L(`還沒輪到 '${st.s2[k]}'，下一個是 s2[R] = '${st.s2[st.r]}'。`, `Not '${st.s2[k]}' yet; next is s2[R] = '${st.s2[st.r]}'.`);
        if (k === st.r && to === 'out') return L(`'${st.s2[k]}' 還沒進視窗。`, `'${st.s2[k]}' isn't in the window yet.`);
        if (k < st.r && to === 'win') return L(`'${st.s2[k]}' 已經在視窗裡了。`, `'${st.s2[k]}' is already in the window.`);
        if (k > st.l && k < st.r) return L(`只能從最左邊移出，最左邊是 '${st.s2[st.l]}'。`, `Remove from the left end only: '${st.s2[st.l]}'.`);
        return permutationInString.whyWrong(st, to === 'out' ? 'shrink' : 'expand') ?? L('這一步不對。', 'Not quite.');
      }
      return permutationInString.whyWrong(st, to === 'yes' ? 'true' : 'false') ?? L('這一步不對。', 'Not quite.');
    },
  },
  result: (st) => L(`回傳 ${st.result ? 'True' : 'False'}`, `Returned ${st.result ? 'True' : 'False'}`),
  code: `def checkInclusion(self, s1: str, s2: str) -> bool:
    need = Counter(s1)
    window = Counter()
    l = 0
    for r in range(len(s2)):
        window[s2[r]] += 1
        if r - l + 1 > len(s1):
            window[s2[l]] -= 1
            l += 1
        if window == need:
            return True
    return False`,
  lineOf: { init: 2, expand: 6, shrink: 8, true: 11, false: 12 },
  answer: (st) => st.result,
  verify({ s1, s2 }, ans) {
    const need = counts(s1);
    let found = false;
    for (let i = 0; i + s1.length <= s2.length; i++) if (same(counts(s2, i, i + s1.length), need)) found = true;
    return ans === found;
  },
};
