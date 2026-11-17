import { pick, randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
import { err, isObj } from './helpers';

type I = { s: string; k: number };
/** Window is s[l..r) (r = next index to add). */
type S = { s: string; k: number; l: number; r: number; best: number };

const counts = (s: string, l: number, r: number) => {
  const c: Record<string, number> = {};
  for (let i = l; i < r; i++) c[s[i]] = (c[s[i]] ?? 0) + 1;
  return c;
};
const maxf = (st: S) => Math.max(0, ...Object.values(counts(st.s, st.l, st.r)));
const needed = (st: S) => st.r - st.l - maxf(st);
const valid = (st: S) => needed(st) <= st.k;

export const charReplacement: Problem<I, S> = {
  id: 'longest-repeating-character-replacement',
  number: 424,
  category: 'sliding-window',
  difficulty: 'Medium',
  title: L('替換後的最長重複字元', 'Longest Repeating Character Replacement'),
  description: L(
    '最多可以把 k 個字元改成任意字母，求改完後「全部相同字母」的最長子字串長度。',
    'You may change at most k characters to any letter. Find the length of the longest substring that can become all one letter.',
  ),
  insight: L(
    '一個視窗要改的字元數 = 視窗長度 − 視窗裡最多的那個字母的數量。只要這個數 ≤ k，視窗就合法。R 一直往右加字；一旦不合法，就從左邊移出字元，直到合法為止。',
    'Changes needed for a window = window length − count of its most frequent letter. The window is valid while that is ≤ k. Keep adding on the right; whenever it becomes invalid, drop characters from the left until it is valid again.',
  ),
  complexity: {
    time: 'O(n)',
    space: 'O(1)',
    why: L(
      '每個字元最多進出視窗各一次；計數表只有 26 個字母，取最大值是常數時間。暴力解檢查每個子字串是 O(n²) 以上。',
      'Each character enters and leaves the window at most once; the count table has only 26 letters, so its max is constant time. Checking every substring is O(n²) or worse.',
    ),
  },
  examples: [
    { s: 'ABAB', k: 2 },
    { s: 'AABABBA', k: 1 },
    { s: 'ABBBCCBA', k: 1 },
  ],
  random: () => ({ s: Array.from({ length: randInt(6, 12) }, () => pick('AABC')).join(''), k: randInt(0, 2) }),
  validate(x) {
    if (!isObj(x) || typeof x.s !== 'string' || !/^[A-Z]{1,24}$/.test(x.s) || typeof x.k !== 'number' || !Number.isInteger(x.k) || x.k < 0 || x.k > 24)
      return err('需要 {"s": "大寫字母（1–24 個）", "k": 0–24 的整數}', 'Expected {"s": "1–24 uppercase letters", "k": int 0–24}');
    return null;
  },
  formatInput: (i) => `s = ${JSON.stringify(i.s)}, k = ${i.k}`,

  init: ({ s, k }) => ({ s, k, l: 0, r: 0, best: 0 }),
  isDone: (st) => st.r >= st.s.length && valid(st),
  options: () => [
    { id: 'expand', label: L('加入 s[R]，R 右移', 'Add s[R], R →') },
    { id: 'shrink', label: L('移出 s[L]，L 右移', 'Remove s[L], L →') },
  ],
  correct: (st) => (valid(st) ? ['expand'] : ['shrink']),
  apply(st, act) {
    const next = act === 'expand' ? { ...st, r: st.r + 1 } : { ...st, l: st.l + 1 };
    return valid(next) ? { ...next, best: Math.max(next.best, next.r - next.l) } : next;
  },
  explain(st, act) {
    if (act === 'expand') {
      const nx = { ...st, r: st.r + 1 };
      const need = needed(nx);
      return L(
        `加入 '${st.s[st.r]}'。視窗長度 ${nx.r - nx.l}，最多的字母有 ${maxf(nx)} 個，要改 ${need} 個${need <= st.k ? `（≤ k=${st.k}，合法${nx.r - nx.l > st.best ? '，刷新最長紀錄！' : '）'}` : `（> k=${st.k}，不合法）`}。`,
        `Add '${st.s[st.r]}'. Window length ${nx.r - nx.l}, top letter appears ${maxf(nx)} times, so ${need} change(s)${need <= st.k ? ` (≤ k=${st.k}, valid${nx.r - nx.l > st.best ? ', a new best!' : ')'}` : ` (> k=${st.k}, invalid)`}.`,
      );
    }
    return L(
      `要改 ${needed(st)} 個 > k=${st.k}，視窗不合法。從左邊移出 '${st.s[st.l]}'。`,
      `${needed(st)} change(s) > k=${st.k}: invalid. Remove '${st.s[st.l]}' from the left.`,
    );
  },
  whyWrong(st, act) {
    if (act === 'expand')
      return L(
        `視窗長度 ${st.r - st.l}、最多的字母 ${maxf(st)} 個，要改 ${needed(st)} 個 > k=${st.k}，視窗不合法。先從左邊縮。`,
        `Length ${st.r - st.l} with ${maxf(st)} of the top letter needs ${needed(st)} change(s) > k=${st.k}: invalid. Shrink from the left first.`,
      );
    return L(
      `視窗只需要改 ${needed(st)} 個 ≤ k=${st.k}，是合法的，不用縮。繼續往右加字。`,
      `The window needs only ${needed(st)} change(s) ≤ k=${st.k}, so it is valid. No need to shrink; keep adding.`,
    );
  },
  hints: (st) => [
    L('算算看：視窗長度 − 最多的那個字母數量，有沒有超過 k？', 'Compute window length − count of the top letter. Is it above k?'),
    L(`長度 ${st.r - st.l} − ${maxf(st)} = ${needed(st)}，k = ${st.k}。`, `${st.r - st.l} − ${maxf(st)} = ${needed(st)}, k = ${st.k}.`),
  ],
  scene(st) {
    const { s, l, r, best, k } = st;
    const done = r >= s.length && valid(st);
    const marks: Record<number, CellMark> = {};
    for (let i = 0; i < l; i++) marks[i] = 'gone';
    if (!valid(st)) marks[l] = 'bad';
    else if (r < s.length) marks[r] = 'focus';
    const c = counts(s, l, r);
    return [
      {
        kind: 'array',
        id: 's',
        label: L('字串 s（藍色是視窗）', 'string s (blue is the window)'),
        values: [...s],
        pointers: [
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
        id: 'cnt',
        label: L('視窗內各字母數量（拖進來 = 加入視窗）', 'letter counts in the window (drop here to add)'),
        items: Object.entries(c)
          .sort()
          .map(([ch, n]) => `${ch}×${n}`),
        dropId: done ? undefined : 'win',
      },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'len - maxf', value: needed(st), highlight: !valid(st) },
          { name: 'k', value: k },
          { name: 'res', value: best, highlight: true },
        ],
      },
      { kind: 'zones', id: 'zones', zones: [{ id: 'out', label: L('🗑️ 移出視窗（只能從最左邊）', '🗑️ Remove from window (leftmost only)'), tone: 'trash' }] },
    ];
  },
  drag: {
    instructions: L(
      '把 s[R] 拖進計數區擴張視窗。當「視窗長度 − 最多的字母數量」超過 k，視窗不合法，就從最左邊把字元拖進 🗑️，直到合法。',
      'Drag s[R] into the counts to grow the window. When length − top-letter count exceeds k, the window is invalid: drag characters from the left into 🗑️ until it is valid.',
    ),
    moves: (st) => (valid(st) ? [{ action: 'expand', from: `c:${st.r}`, to: 'win' }] : [{ action: 'shrink', from: `c:${st.l}`, to: 'out' }]),
    whyWrong(st, from, to) {
      const k = Number(from.split(':')[1]);
      const ok = valid(st);
      if (k > st.r || (k === st.r && to === 'out'))
        return k === st.r ? L(`'${st.s[k]}' 還沒進視窗，不能移出。`, `'${st.s[k]}' isn't in the window yet.`) : L(`還沒輪到 '${st.s[k]}'，下一個要加入的是 s[R] = '${st.s[st.r]}'。`, `Not '${st.s[k]}' yet; the next to add is s[R] = '${st.s[st.r]}'.`);
      if (k < st.r && to === 'win') return L(`'${st.s[k]}' 已經在視窗裡了。`, `'${st.s[k]}' is already in the window.`);
      if (k > st.l && k < st.r) return L(`只能從最左邊移出，最左邊是 '${st.s[st.l]}'。`, `Remove from the left end only; the leftmost is '${st.s[st.l]}'.`);
      return charReplacement.whyWrong(st, ok ? 'shrink' : 'expand') ?? L('這一步不對。', 'Not quite.');
    },
  },
  result: (st) => L(`最長長度 = ${st.best}`, `Longest length = ${st.best}`),
  code: `def characterReplacement(self, s: str, k: int) -> int:
    count = {}
    res = 0
    l = 0
    for r in range(len(s)):
        count[s[r]] = 1 + count.get(s[r], 0)
        while (r - l + 1) - max(count.values()) > k:
            count[s[l]] -= 1
            l += 1
        res = max(res, r - l + 1)
    return res`,
  lineOf: { init: 2, expand: 6, shrink: 8 },
  answer: (st) => st.best,
  verify({ s, k }, ans) {
    let best = 0;
    for (let i = 0; i < s.length; i++)
      for (let j = i + 1; j <= s.length; j++) {
        const c = counts(s, i, j);
        if (j - i - Math.max(...Object.values(c)) <= k) best = Math.max(best, j - i);
      }
    return ans === best;
  },
};
