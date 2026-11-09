import { pick, randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
import { err, isObj, showChar } from './helpers';

type I = { s: string };
type S = { s: string; l: number; r: number; set: string[]; best: number };

export const longestSubstring: Problem<I, S> = {
  id: 'longest-substring-without-repeating-characters',
  number: 3,
  category: 'sliding-window',
  difficulty: 'Medium',
  title: L('無重複字元的最長子字串', 'Longest Substring Without Repeating Characters'),
  description: L(
    '找出字串中「沒有重複字元」的最長連續子字串，回傳它的長度。',
    'Find the length of the longest contiguous substring that contains no repeated characters.',
  ),
  insight: L(
    '用 set 記住視窗裡的字元。R 想加入的字元不在 set 裡就擴張；如果已經在裡面，就從左邊一個一個移除，直到重複的字元離開視窗。',
    'Keep the window characters in a set. If the character at R is new, expand. If it is already in the set, remove characters from the left until the duplicate leaves the window.',
  ),
  examples: [{ s: 'abcabcbb' }, { s: 'pwwkew' }, { s: 'dvdfabd' }],
  random: () => ({ s: Array.from({ length: randInt(6, 12) }, () => pick('abcde')).join('') }),
  validate(x) {
    if (!isObj(x) || typeof x.s !== 'string') return err('需要 {"s": "字串"}', 'Expected {"s": "string"}');
    if (x.s.length > 30) return err('字串最長 30 個字元', 'String must be at most 30 characters');
    return null;
  },
  formatInput: (i) => `s = ${JSON.stringify(i.s)}`,

  init: ({ s }) => ({ s, l: 0, r: 0, set: [], best: 0 }),
  isDone: (st) => st.r >= st.s.length,
  options: () => [
    { id: 'expand', label: L('加入 s[R]，R 右移', 'Add s[R], move R →') },
    { id: 'shrink', label: L('移除 s[L]，L 右移', 'Remove s[L], move L →') },
  ],
  correct: ({ s, r, set }) => (set.includes(s[r]) ? ['shrink'] : ['expand']),
  apply(st, a) {
    if (a === 'expand') {
      const r = st.r + 1;
      return { ...st, set: [...st.set, st.s[st.r]], r, best: Math.max(st.best, r - st.l) };
    }
    const c = st.s[st.l];
    return { ...st, set: st.set.filter((x) => x !== c), l: st.l + 1 };
  },
  explain({ s, l, r, best }, a) {
    const c = showChar(s[r]);
    if (a === 'expand') {
      const len = r - l + 1;
      return L(
        `'${c}' 不在視窗裡，加入它。視窗長度 ${len}${len > best ? '，刷新最長紀錄！' : '。'}`,
        `'${c}' is not in the window, so add it. Window length ${len}${len > best ? ', a new best!' : '.'}`,
      );
    }
    return L(
      `'${c}' 已經在視窗裡了（重複）。從左邊移除 '${showChar(s[l])}'，縮小視窗。`,
      `'${c}' is already in the window (duplicate). Remove '${showChar(s[l])}' from the left to shrink the window.`,
    );
  },
  whyWrong({ s, r }, a) {
    const c = showChar(s[r]);
    if (a === 'expand') return L(`'${c}' 已經在視窗裡，直接加入會出現重複字元。`, `'${c}' is already in the window. Adding it would create a duplicate.`);
    return L(`'${c}' 不在視窗裡，不需要縮小，直接擴張就好。`, `'${c}' is not in the window. No need to shrink, just expand.`);
  },
  hints: ({ s, r, set }) => [
    L('s[R] 是不是已經在 charSet 裡了？', 'Is s[R] already in charSet?'),
    L(`s[R] = '${showChar(s[r])}'，charSet = {${set.map(showChar).join(', ')}}。`, `s[R] = '${showChar(s[r])}', charSet = {${set.map(showChar).join(', ')}}.`),
  ],
  scene({ s, l, r, set, best }) {
    const n = s.length;
    const marks: Record<number, CellMark> = {};
    for (let k = 0; k < l; k++) marks[k] = 'gone';
    if (r < n) {
      const dup = set.includes(s[r]);
      marks[r] = dup ? 'bad' : 'focus';
      if (dup) for (let k = l; k < r; k++) if (s[k] === s[r]) marks[k] = 'bad';
    }
    return [
      {
        kind: 'array',
        id: 's',
        label: L('字串 s（藍色區塊是視窗）', 'string s (the blue band is the window)'),
        values: [...s].map(showChar),
        pointers: [
          { name: 'L', index: l, color: 'a' },
          { name: 'R', index: r, color: 'b' },
        ],
        window: r > l ? [l, r - 1] : null,
        marks,
        dragPrefix: 'c',
        dragMask: [...s].map((_, k) => r < n && k >= l),
      },
      {
        kind: 'set',
        id: 'set',
        label: L('charSet（視窗內的字元，拖進來 = 加入視窗）', 'charSet (chars in the window; drop here to add)'),
        items: set.map(showChar),
        dropId: r < n ? 'set' : undefined,
      },
      { kind: 'vars', id: 'v', vars: [{ name: 'r - l', value: r - l }, { name: 'res', value: best, highlight: true }] },
      {
        kind: 'zones',
        id: 'zones',
        zones: [{ id: 'out', label: L('🗑️ 移出視窗（只能從最左邊）', '🗑️ Remove from window (leftmost only)'), tone: 'trash' }],
      },
    ];
  },
  drag: {
    instructions: L(
      '把 s[R] 拖進 charSet 擴張視窗。如果它已經在視窗裡（重複），就從最左邊把字一個一個拖進 🗑️，直到重複的字離開。',
      "Drag s[R] into charSet to grow the window. If it's already in the window (a repeat), drag characters from the left end into 🗑️ one at a time until the repeat leaves.",
    ),
    moves({ s, l, r, set }) {
      return set.includes(s[r]) ? [{ action: 'shrink', from: `c:${l}`, to: 'out' }] : [{ action: 'expand', from: `c:${r}`, to: 'set' }];
    },
    whyWrong({ s, l, r, set }, from, to) {
      const k = Number(from.split(':')[1]);
      const q = (i: number) => `'${showChar(s[i])}'`;
      const dup = set.includes(s[r]);
      if (k > r) return L(`還沒輪到 ${q(k)}。現在要處理的是 s[R] = ${q(r)}。`, `It's not ${q(k)}'s turn. The current one is s[R] = ${q(r)}.`);
      if (k === r) {
        if (to === 'out') return L(`${q(r)} 還沒進視窗，不能移出。`, `${q(r)} isn't in the window yet, so it can't be removed.`);
        return L(
          `${q(r)} 已經在視窗裡了（重複）。要先從最左邊把字移出，直到重複的 ${q(r)} 離開視窗。`,
          `${q(r)} is already in the window (a repeat). Remove characters from the left until the earlier ${q(r)} leaves.`,
        );
      }
      // k is inside the window (l <= k < r)
      if (to === 'set') return L(`${q(k)} 已經在視窗裡了。`, `${q(k)} is already in the window.`);
      if (k !== l) return L(`只能從最左邊一個一個移出，最左邊是 ${q(l)}。`, `Remove from the left end one at a time; the leftmost is ${q(l)}.`);
      if (!dup)
        return L(`${q(r)} 不在視窗裡，不需要縮小，直接把 ${q(r)} 加入視窗。`, `${q(r)} isn't in the window, so no need to shrink. Just add ${q(r)}.`);
      return L('', '');
    },
  },
  result: (st) => L(`最長長度 = ${st.best}`, `Longest length = ${st.best}`),
  code: `def lengthOfLongestSubstring(self, s: str) -> int:
    charSet = set()
    l = 0
    res = 0
    for r in range(len(s)):
        while s[r] in charSet:
            charSet.remove(s[l])
            l += 1
        charSet.add(s[r])
        res = max(res, r - l + 1)
    return res`,
  lineOf: { init: 2, shrink: 7, expand: 9 },
  answer: (st) => st.best,
  verify({ s }, ans) {
    let m = 0;
    for (let i = 0; i < s.length; i++)
      for (let j = i; j < s.length; j++) {
        if (new Set(s.slice(i, j + 1)).size !== j - i + 1) break;
        m = Math.max(m, j - i + 1);
      }
    return ans === m;
  },
};
