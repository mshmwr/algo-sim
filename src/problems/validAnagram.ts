import { pick, randInt } from '../core/engine';
import { L, TAP, type CellMark, type Problem } from '../core/types';
import { err, isObj } from './helpers';

type I = { s: string; t: string };
/** i walks s (count +1), then j walks t (count −1). */
type S = { s: string; t: string; i: number; j: number; count: Record<string, number>; done: boolean; result: boolean | null };

const fmt = (c: Record<string, number>) =>
  Object.entries(c)
    .filter(([, n]) => n !== 0)
    .sort()
    .map(([ch, n]) => `${ch}:${n}`);

export const validAnagram: Problem<I, S> = {
  id: 'valid-anagram',
  number: 242,
  category: 'arrays-hashing',
  difficulty: 'Easy',
  title: L('有效的字母異位詞', 'Valid Anagram'),
  description: L('判斷 t 是不是把 s 的字母重新排列而成（字母和數量完全相同）。', 'Decide whether t is a rearrangement of s (same letters, same counts).'),
  insight: L(
    '長度不同一定不是。長度相同時，用雜湊表數 s 的每個字母（+1），再用 t 的字母抵銷（−1）。抵銷時如果某個字母已經是 0，代表 t 多出這個字母，就不是異位詞。',
    "Different lengths can't match. Otherwise count s's letters (+1) in a hash map, then cancel with t's letters (−1). If a letter is already 0 when cancelling, t has an extra one, so it's not an anagram.",
  ),
  complexity: {
    time: 'O(n)',
    space: 'O(1)',
    why: L('兩個字串各掃一次。計數表最多 26 個字母，算常數空間。把兩個字串排序後比較是 O(n log n)。', 'One pass over each string. The count table has at most 26 letters: constant space. Sorting both and comparing is O(n log n).'),
  },
  examples: [
    { s: 'anagram', t: 'nagaram' },
    { s: 'rat', t: 'car' },
    { s: 'aab', t: 'abb' },
  ],
  random() {
    const s = Array.from({ length: randInt(3, 6) }, () => pick('abc')).join('');
    let t = [...s].sort(() => Math.random() - 0.5).join('');
    if (Math.random() < 0.5) t = t.slice(0, -1) + pick('abcd');
    return { s, t };
  },
  validate(x) {
    if (!isObj(x) || typeof x.s !== 'string' || typeof x.t !== 'string' || !/^[a-z]{1,12}$/.test(x.s) || !/^[a-z]{1,12}$/.test(x.t))
      return err('需要 {"s": "1–12 個小寫字母", "t": "1–12 個小寫字母"}', 'Expected {"s": "1–12 lowercase", "t": "1–12 lowercase"}');
    return null;
  },
  formatInput: (i) => `s = ${JSON.stringify(i.s)}, t = ${JSON.stringify(i.t)}`,

  init: ({ s, t }) => ({ s, t, i: 0, j: 0, count: {}, done: false, result: null }),
  isDone: (st) => st.done,
  options: () => [
    { id: 'plus', label: L('s 的字母 +1', "s letter +1") },
    { id: 'minus', label: L('t 的字母 −1', 't letter −1') },
    { id: 'true', label: L('回傳 True', 'Return True') },
    { id: 'false', label: L('回傳 False', 'Return False') },
  ],
  correct(st) {
    const { s, t, i, j, count } = st;
    if (s.length !== t.length) return ['false'];
    if (i < s.length) return ['plus'];
    if (j < t.length) return (count[t[j]] ?? 0) > 0 ? ['minus'] : ['false'];
    return ['true'];
  },
  apply(st, a) {
    if (a === 'plus') return { ...st, count: { ...st.count, [st.s[st.i]]: (st.count[st.s[st.i]] ?? 0) + 1 }, i: st.i + 1 };
    if (a === 'minus') return { ...st, count: { ...st.count, [st.t[st.j]]: st.count[st.t[st.j]] - 1 }, j: st.j + 1 };
    return { ...st, done: true, result: a === 'true' };
  },
  explain(st, a) {
    const { s, t, i, j } = st;
    if (a === 'plus') return L(`s 的 '${s[i]}'：計數 +1。`, `s's '${s[i]}': count +1.`);
    if (a === 'minus') return L(`t 的 '${t[j]}'：抵銷一個，計數 −1。`, `t's '${t[j]}': cancel one, count −1.`);
    if (a === 'true') return L('全部抵銷完，每個字母都剛好歸零，是異位詞！', 'Everything cancelled out to zero: an anagram!');
    if (s.length !== t.length) return L(`長度不同（${s.length} ≠ ${t.length}），不可能是異位詞。`, `Different lengths (${s.length} ≠ ${t.length}): can't be an anagram.`);
    return L(`t 的 '${t[j]}' 已經沒有可以抵銷的了（計數是 0），t 多出這個字母，回傳 False。`, `t's '${t[j]}' has nothing left to cancel (count 0): t has an extra one. Return False.`);
  },
  whyWrong(st, a) {
    const { s, t, i, j, count } = st;
    const want = validAnagram.correct(st)[0];
    if (want === 'false' && s.length !== t.length) return L(`先看長度：${s.length} ≠ ${t.length}。`, `Check the lengths first: ${s.length} ≠ ${t.length}.`);
    if (want === 'plus') return a === 'minus' ? L('先把 s 全部數完，再用 t 抵銷。', 'Count all of s first, then cancel with t.') : L('s 還沒數完。', "s isn't fully counted.");
    if (want === 'minus') return a === 'false' ? L(`'${t[j]}' 還有 ${count[t[j]]} 個可以抵銷。`, `'${t[j]}' still has ${count[t[j]]} to cancel.`) : L('t 還沒抵銷完。', "t isn't fully processed.");
    if (want === 'false') return L(`'${t[j]}' 的計數是 0，沒得抵銷了。`, `'${t[j]}' is at 0; nothing to cancel.`);
    return i >= s.length ? L('全部都抵銷乾淨了。', 'Everything cancelled cleanly.') : L('這一步不對。', 'Not quite.');
  },
  hints: (st) => [
    L('長度一樣嗎？一樣的話：s 的字母 +1，t 的字母 −1。', 'Same length? Then s letters +1 and t letters −1.'),
    L(`計數：{${fmt(st.count).join(', ')}}`, `Counts: {${fmt(st.count).join(', ')}}`),
  ],
  scene(st) {
    const { s, t, i, j, count, done } = st;
    const sm: Record<number, CellMark> = {};
    [...s].forEach((_, k) => k < i && (sm[k] = 'done'));
    if (i < s.length) sm[i] = 'focus';
    const tm: Record<number, CellMark> = {};
    [...t].forEach((_, k) => k < j && (tm[k] = 'done'));
    if (i >= s.length && j < t.length) tm[j] = done ? 'bad' : 'focus';
    return [
      { kind: 'array', id: 's', label: L(`s（長度 ${s.length}）`, `s (length ${s.length})`), values: [...s], marks: sm, dragPrefix: 's', dragMask: [...s].map((_, k) => !done && k >= i) },
      { kind: 'array', id: 't', label: L(`t（長度 ${t.length}）`, `t (length ${t.length})`), values: [...t], marks: tm, dragPrefix: 't', dragMask: [...t].map((_, k) => !done && k >= j) },
      { kind: 'set', id: 'count', label: L('計數（字母:次數）', 'counts (letter:n)'), items: fmt(count) },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'plus', label: L('➕ 計數 +1（s 的字母）', "➕ Count +1 (s's letters)"), tone: 'info' },
          { id: 'minus', label: L('➖ 抵銷 −1（t 的字母）', "➖ Cancel −1 (t's letters)"), tone: 'info' },
          { id: 'yes', label: L('✓ 是異位詞', '✓ Anagram'), tone: 'good' },
          { id: 'no', label: L('✗ 不是', '✗ Not'), tone: 'bad' },
        ],
      },
    ];
  },
  drag: {
    instructions: L('長度不同就直接點 ✗。否則把 s 的字母依序拖到 ➕，再把 t 的字母依序拖到 ➖ 抵銷；抵銷不了就拖進 ✗。全部抵銷完點 ✓。', "If the lengths differ, tap ✗. Otherwise drag s's letters to ➕ in order, then t's letters to ➖ to cancel; if one can't be cancelled, drag it into ✗. When all cancel, tap ✓."),
    tapZones: ['yes', 'no'],
    moves(st) {
      const [a] = validAnagram.correct(st);
      if (a === 'plus') return [{ action: a, from: `s:${st.i}`, to: 'plus' }];
      if (a === 'minus') return [{ action: a, from: `t:${st.j}`, to: 'minus' }];
      if (a === 'true') return [{ action: a, from: TAP, to: 'yes' }];
      return st.s.length === st.t.length ? [{ action: a, from: `t:${st.j}`, to: 'no' }, { action: a, from: TAP, to: 'no' }] : [{ action: a, from: TAP, to: 'no' }];
    },
    whyWrong(st, from, to) {
      if (from !== TAP) {
        const [kind, idx] = from.split(':');
        const k = Number(idx);
        if (kind === 's' && to === 'minus') return L('s 的字母要 +1，t 的字母才是 −1。', "s's letters are +1; t's letters are −1.");
        if (kind === 't' && to === 'plus') return L('t 的字母是拿來抵銷的（−1）。', "t's letters cancel (−1).");
        if ((kind === 's' && k !== st.i) || (kind === 't' && k !== st.j)) return L('照順序一個一個來。', 'Go in order, one at a time.');
      }
      const act = to === 'plus' ? 'plus' : to === 'minus' ? 'minus' : to === 'yes' ? 'true' : 'false';
      return validAnagram.whyWrong(st, act) ?? L('這一步不對。', 'Not quite.');
    },
  },
  result: (st) => L(`回傳 ${st.result ? 'True' : 'False'}`, `Returned ${st.result ? 'True' : 'False'}`),
  code: `def isAnagram(self, s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    count = {}
    for c in s:
        count[c] = count.get(c, 0) + 1
    for c in t:
        if count.get(c, 0) == 0:
            return False
        count[c] -= 1
    return True`,
  lineOf: { init: 2, plus: 6, minus: 10, false: 9, true: 11 },
  answer: (st) => st.result,
  verify: ({ s, t }, ans) => ans === ([...s].sort().join('') === [...t].sort().join('')),
};
