import { pick, randInt } from '../core/engine';
import { L, type CellMark, type Layer, type Problem } from '../core/types';
import { err, isObj } from './helpers';

type I = { strs: string[] };
/** groups: [key, words] in creation order. */
type S = { strs: string[]; i: number; groups: [string, string[]][] };

const keyOf = (w: string) => [...w].sort().join('');

export const groupAnagrams: Problem<I, S> = {
  id: 'group-anagrams',
  number: 49,
  category: 'arrays-hashing',
  difficulty: 'Medium',
  title: L('字母異位詞分組', 'Group Anagrams'),
  description: L('把互為字母異位詞（字母相同、順序不同）的字串分到同一組。', 'Group the strings that are anagrams of each other.'),
  insight: L(
    '互為異位詞的字串，把字母排序後會變成同一個字串，例如 "eat"、"tea" 都變成 "aet"。用這個排序後的字串當雜湊表的鍵，同一個鍵的字串就是同一組。',
    'Anagrams become the same string once their letters are sorted: "eat" and "tea" both become "aet". Use that sorted string as the hash-map key; strings sharing a key form a group.',
  ),
  complexity: {
    time: 'O(n · k log k)',
    space: 'O(n · k)',
    why: L('n 個字串、每個長度 k，排序一個要 O(k log k)。也可以改用 26 格字母計數當鍵，變成 O(n·k)。兩兩比較是否為異位詞要 O(n²·k)。', 'n strings of length k; sorting each costs O(k log k). Using a 26-letter count tuple as the key gives O(n·k). Comparing every pair is O(n²·k).'),
  },
  examples: [{ strs: ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'] }, { strs: ['a'] }, { strs: ['abc', 'bca', 'cab', 'xy', 'yx', 'z'] }],
  random() {
    const bases = Array.from({ length: randInt(2, 3) }, () => Array.from({ length: randInt(2, 3) }, () => pick('abcdeot')).join(''));
    return { strs: Array.from({ length: randInt(4, 6) }, () => [...pick(bases)].sort(() => Math.random() - 0.5).join('')) };
  },
  validate(x) {
    if (!isObj(x) || !Array.isArray(x.strs) || x.strs.length < 1 || x.strs.length > 10 || !x.strs.every((w) => typeof w === 'string' && /^[a-z]{0,6}$/.test(w)))
      return err('需要 {"strs": ["小寫字串", ...]}，1–10 個、每個最多 6 字', 'Expected {"strs": ["lowercase", ...]}, 1–10 strings up to 6 letters');
    return null;
  },
  formatInput: (i) => `strs = [${i.strs.map((w) => JSON.stringify(w)).join(', ')}]`,

  init: ({ strs }) => ({ strs, i: 0, groups: [] }),
  isDone: (st) => st.i >= st.strs.length,
  options: () => [
    { id: 'join', label: L('放進已有的那一組', 'Add to its existing group') },
    { id: 'new', label: L('開新的一組', 'Start a new group') },
  ],
  correct: (st) => (st.groups.some(([k]) => k === keyOf(st.strs[st.i])) ? ['join'] : ['new']),
  apply(st, a) {
    const w = st.strs[st.i];
    const k = keyOf(w);
    const groups: [string, string[]][] = a === 'new' ? [...st.groups, [k, [w]]] : st.groups.map(([gk, ws]) => [gk, gk === k ? [...ws, w] : ws]);
    return { ...st, groups, i: st.i + 1 };
  },
  explain(st, a) {
    const w = st.strs[st.i];
    const k = keyOf(w);
    return a === 'new'
      ? L(`"${w}" 排序後是 "${k}"，還沒有這個鍵，開新的一組。`, `"${w}" sorts to "${k}"; no group has that key yet, so start one.`)
      : L(`"${w}" 排序後是 "${k}"，和那一組的鍵一樣，放進去。`, `"${w}" sorts to "${k}", matching that group's key. Add it.`);
  },
  whyWrong(st, a) {
    const w = st.strs[st.i];
    const k = keyOf(w);
    return a === 'new' ? L(`"${w}" 排序後是 "${k}"，已經有這一組了。`, `"${w}" sorts to "${k}", and that group already exists.`) : L(`"${w}" 排序後是 "${k}"，還沒有這一組。`, `"${w}" sorts to "${k}"; there's no such group yet.`);
  },
  hints: (st) => [L('把字母排序，看看鍵是什麼。', 'Sort the letters to get the key.'), L(`"${st.strs[st.i]}" → "${keyOf(st.strs[st.i])}"`, `"${st.strs[st.i]}" → "${keyOf(st.strs[st.i])}"`)],
  scene(st): Layer[] {
    const { strs, i, groups } = st;
    const done = i >= strs.length;
    const marks: Record<number, CellMark> = {};
    strs.forEach((_, k) => k < i && (marks[k] = 'done'));
    if (!done) marks[i] = 'focus';
    return [
      { kind: 'array', id: 'strs', label: L('strs（排序後的鍵寫在下面一列）', 'strs (sorted keys below)'), values: strs.map((w) => w || '""'), marks, dragPrefix: 's', dragMask: strs.map((_, k) => !done && k >= i) },
      { kind: 'array', id: 'keys', label: L('排序後的鍵', 'sorted keys'), values: strs.map((w, k) => (k <= i ? keyOf(w) || '""' : '?')), marks },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          ...groups.map(([k, ws]) => ({ id: `g:${k}`, label: L(`🔑 "${k}"：${ws.join(', ')}`, `🔑 "${k}": ${ws.join(', ')}`), tone: 'info' as const })),
          { id: 'new', label: L('🆕 開新的一組', '🆕 New group'), tone: 'good' },
        ],
      },
    ];
  },
  drag: {
    instructions: L('把每個字串拖到它的組：排序後的鍵已經有組，就拖到那一組；還沒有，拖到 🆕 開新的一組。', 'Drag each string to its group: if its sorted key already has a group, drop it there; otherwise drop it on 🆕.'),
    moves(st) {
      const [a] = groupAnagrams.correct(st);
      return [{ action: a, from: `s:${st.i}`, to: a === 'new' ? 'new' : `g:${keyOf(st.strs[st.i])}` }];
    },
    whyWrong(st, from, to) {
      if (Number(from.split(':')[1]) !== st.i) return L(`照順序來，現在是 "${st.strs[st.i]}"。`, `In order: the current string is "${st.strs[st.i]}".`);
      const k = keyOf(st.strs[st.i]);
      if (to.startsWith('g:') && to.slice(2) !== k && st.groups.some(([gk]) => gk === k)) return L(`"${st.strs[st.i]}" 的鍵是 "${k}"，不是 "${to.slice(2)}"。`, `"${st.strs[st.i]}" has key "${k}", not "${to.slice(2)}".`);
      if (to.startsWith('g:') && to.slice(2) !== k) return L(`"${st.strs[st.i]}" 的鍵是 "${k}"，和 "${to.slice(2)}" 不同，要開新的一組。`, `"${st.strs[st.i]}" has key "${k}", unlike "${to.slice(2)}": start a new group.`);
      return groupAnagrams.whyWrong(st, to === 'new' ? 'new' : 'join') ?? L('這一步不對。', 'Not quite.');
    },
  },
  result: (st) => L(`共 ${st.groups.length} 組：${st.groups.map(([, ws]) => `[${ws.join(', ')}]`).join(' ')}`, `${st.groups.length} groups: ${st.groups.map(([, ws]) => `[${ws.join(', ')}]`).join(' ')}`),
  code: `def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
    groups = defaultdict(list)  # sorted key -> words
    for s in strs:
        key = "".join(sorted(s))
        groups[key].append(s)
    return list(groups.values())`,
  lineOf: { init: 2, join: 5, new: 5 },
  answer: (st) => st.groups.map(([, ws]) => ws),
  verify({ strs }, ans) {
    const norm = (gs: string[][]) => gs.map((g) => [...g].sort().join('|')).sort().join('/');
    const m = new Map<string, string[]>();
    strs.forEach((w) => m.set(keyOf(w), [...(m.get(keyOf(w)) ?? []), w]));
    return norm(ans as string[][]) === norm([...m.values()]);
  },
};
