import { randInt } from '../core/engine';
import { L, TAP, type L10n, type Problem } from '../core/types';
import { err, isObj } from './helpers';

type I = { n: number };
/**
 * DFS state. path = current string; tried[d] = which branches of the node at depth d were already explored
 * (0 = none, 1 = '(' done, 2 = both done). recorded = the full path at this leaf has been saved.
 */
type S = { n: number; path: string; tried: number[]; recorded: boolean; res: string[]; done: boolean };

const opens = (p: string) => [...p].filter((c) => c === '(').length;
const closes = (p: string) => p.length - opens(p);

/** The DFS action at the current node. */
function nextAction(st: S): string {
  const { n, path, tried, recorded } = st;
  if (path.length === 2 * n) return recorded ? 'back' : 'record';
  const t = tried[path.length] ?? 0;
  if (t < 1 && opens(path) < n) return 'addOpen';
  if (t < 2 && closes(path) < opens(path)) return 'addClose';
  return path.length === 0 ? 'finish' : 'back';
}

export const generateParentheses: Problem<I, S> = {
  id: 'generate-parentheses',
  number: 22,
  category: 'stack',
  difficulty: 'Medium',
  title: L('括號生成', 'Generate Parentheses'),
  description: L('列出 n 對括號所有合法的組合。', 'List every valid combination of n pairs of parentheses.'),
  insight: L(
    '回溯法：一個字一個字往上疊，每一步有兩個選擇。左括號用了不到 n 個，就可以加「(」；右括號比左括號少，才可以加「)」。字串滿 2n 個就記錄，然後退回上一層試別的選擇。',
    "Backtracking: build the string one character at a time with two choices per step. You may add '(' while fewer than n are used, and ')' only while there are fewer ')' than '('. At length 2n, record it, then back up and try the other choice.",
  ),
  complexity: {
    time: 'O(4ⁿ / √n)',
    space: 'O(n)',
    why: L(
      '合法組合的數量是第 n 個卡特蘭數，約 4ⁿ / (n√n)，每個要花 O(n) 組字串。遞迴深度最多 2n。暴力列出所有 2²ⁿ 個字串再檢查會多做很多無效的工。',
      'The number of valid strings is the n-th Catalan number, about 4ⁿ / (n√n), each costing O(n) to build. Recursion depth is at most 2n. Generating all 2²ⁿ strings and filtering wastes far more work.',
    ),
  },
  examples: [{ n: 2 }, { n: 3 }, { n: 1 }],
  random: () => ({ n: randInt(2, 3) }),
  validate(x) {
    if (!isObj(x) || typeof x.n !== 'number' || !Number.isInteger(x.n) || x.n < 1 || x.n > 3) return err('需要 {"n": 1–3}', 'Expected {"n": 1–3}');
    return null;
  },
  formatInput: (i) => `n = ${i.n}`,

  init: ({ n }) => ({ n, path: '', tried: [], recorded: false, res: [], done: false }),
  isDone: (st) => st.done,
  options: () => [
    { id: 'addOpen', label: L("加 '('", "Add '('") },
    { id: 'addClose', label: L("加 ')'", "Add ')'") },
    { id: 'record', label: L('記錄這個組合', 'Record this string') },
    { id: 'back', label: L('退回上一層', 'Back up one level') },
    { id: 'finish', label: L('全部完成', 'All done') },
  ],
  correct: (st) => [nextAction(st)],
  apply(st, act) {
    const d = st.path.length;
    const tried = [...st.tried];
    switch (act) {
      case 'addOpen':
        tried[d] = 1;
        tried[d + 1] = 0;
        return { ...st, path: st.path + '(', tried, recorded: false };
      case 'addClose':
        tried[d] = 2;
        tried[d + 1] = 0;
        return { ...st, path: st.path + ')', tried, recorded: false };
      case 'record':
        return { ...st, res: [...st.res, st.path], recorded: true };
      case 'back':
        return { ...st, path: st.path.slice(0, -1), tried: tried.slice(0, d), recorded: false };
      default:
        return { ...st, done: true };
    }
  },
  explain(st, act) {
    const o = opens(st.path);
    const c = closes(st.path);
    const map: Record<string, L10n> = {
      addOpen: L(`左括號用了 ${o} 個 < ${st.n}，先試加 '('。`, `${o} '(' used < ${st.n}, so try '(' first.`),
      addClose: L(`'(' 那條路試完了；右括號 ${c} < 左括號 ${o}，可以加 ')'。`, `The '(' branch is done; ${c} ')' < ${o} '(', so ')' is allowed.`),
      record: L(`"${st.path}" 長度到 ${2 * st.n} 了，是合法組合，記錄下來。`, `"${st.path}" reached length ${2 * st.n}: a valid string. Record it.`),
      back: L(`這一層的選擇都試過了，拿掉最後的 '${st.path.slice(-1)}'，退回上一層。`, `Every choice at this level is done. Remove the last '${st.path.slice(-1)}' and back up.`),
      finish: L(`回到最上層，所有選擇都試過了。共 ${st.res.length} 個組合。`, `Back at the top with every choice explored: ${st.res.length} strings.`),
    };
    return map[act];
  },
  whyWrong(st, act) {
    const { n, path } = st;
    const o = opens(path);
    const c = closes(path);
    const t = st.tried[path.length] ?? 0;
    const want = nextAction(st);
    if (path.length === 2 * n && !st.recorded) return L(`"${path}" 已經滿 ${2 * n} 個字了，先記錄下來。`, `"${path}" is full (${2 * n} chars). Record it first.`);
    if (act === 'addOpen') {
      if (o >= n) return L(`左括號已經用了 ${n} 個，不能再加。`, `All ${n} '(' are used; no more can be added.`);
      if (t >= 1) return L("在這一層，'(' 那條路已經走完了。", "At this level, the '(' branch has already been explored.");
    }
    if (act === 'addClose') {
      if (c >= o) return L(`右括號（${c}）不能比左括號（${o}）多，否則會出現沒配對的 ')'。`, `')' (${c}) can't exceed '(' (${o}), or a ')' would be unmatched.`);
      if (t < 1 && o < n) return L("照順序先試 '('，試完再回來試 ')'。", "Try '(' first, then come back for ')'.");
      if (t >= 2) return L("在這一層，')' 那條路也走完了。", "At this level, the ')' branch is done too.");
    }
    if (act === 'record') return L(`"${path}" 還不到 ${2 * n} 個字。`, `"${path}" is shorter than ${2 * n}.`);
    if (act === 'back' || act === 'finish') {
      if (want === 'addOpen' || want === 'addClose') return L('這一層還有沒試過的選擇。', 'There are still untried choices at this level.');
      if (act === 'finish') return L('還沒回到最上層。', "You're not back at the top yet.");
      return L('已經在最上層了，全部完成。', "You're at the top; everything is done.");
    }
    return null;
  },
  hints: (st) => [
    L('先看能不能加 \'(\'（還沒用滿 n 個、這層還沒試過），再看 \')\'（不能比 \'(\' 多），都不行就退回。', "First check '(' (fewer than n used, not tried at this level), then ')' (not more than '('), otherwise back up."),
    L(`目前 "${st.path || '（空）'}"：'(' ${opens(st.path)} 個、')' ${closes(st.path)} 個、n = ${st.n}。`, `Now "${st.path || '(empty)'}": ${opens(st.path)} '(' and ${closes(st.path)} ')', n = ${st.n}.`),
  ],
  scene(st) {
    const { n, path, res, done } = st;
    const chars = [...path];
    return [
      {
        kind: 'array',
        id: 'palette',
        label: L('可用的括號（拖到下方字串的尾端）', 'pieces (drag onto the string below)'),
        values: ['(', ')'],
        dragPrefix: done ? undefined : 'p',
      },
      {
        kind: 'array',
        id: 'path',
        label: L(`目前的字串（長度 ${path.length} / ${2 * n}）`, `current string (length ${path.length} / ${2 * n})`),
        values: chars.length ? chars : ['·'],
        dragPrefix: !done && chars.length ? 'c' : undefined,
        dragMask: chars.map((_, i) => i === chars.length - 1),
        marks: path.length === 2 * n ? Object.fromEntries(chars.map((_, i) => [i, 'good' as const])) : {},
      },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: "'(' used", value: opens(path) },
          { name: "')' used", value: closes(path) },
          { name: 'n', value: n },
        ],
      },
      { kind: 'set', id: 'res', label: L('res（找到的組合）', 'res (strings found)'), items: res },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'append', label: L('➕ 接到字串尾端', '➕ Append to the string'), tone: 'info' },
          { id: 'trash', label: L('🗑️ 退回（拿掉最後一個）', '🗑️ Back up (remove last)'), tone: 'trash' },
          { id: 'save', label: L('✓ 記錄', '✓ Record'), tone: 'good' },
          { id: 'end', label: L('🏁 全部完成', '🏁 All done'), tone: 'good' },
        ],
      },
    ];
  },
  drag: {
    instructions: L(
      "照「先試 '(' 再試 ')'」的順序：把 ( 或 ) 拖到「接到字串尾端」。字串滿了點 ✓ 記錄；這一層都試過了，把最後一個字拖進 🗑️ 退回。回到最上層、都試完了，點 🏁。",
      "Explore '(' before ')': drag ( or ) onto \"Append\". When the string is full, tap ✓ to record; when a level is exhausted, drag the last character into 🗑️ to back up. Back at the top with nothing left, tap 🏁.",
    ),
    tapZones: ['save', 'end'],
    moves(st) {
      const a = nextAction(st);
      const last = `c:${st.path.length - 1}`;
      if (a === 'addOpen') return [{ action: a, from: 'p:0', to: 'append' }];
      if (a === 'addClose') return [{ action: a, from: 'p:1', to: 'append' }];
      if (a === 'record') return [{ action: a, from: TAP, to: 'save' }];
      if (a === 'back') return [{ action: a, from: last, to: 'trash' }];
      return [{ action: a, from: TAP, to: 'end' }];
    },
    whyWrong(st, from, to) {
      let act = '';
      if (from === 'p:0' && to === 'append') act = 'addOpen';
      else if (from === 'p:1' && to === 'append') act = 'addClose';
      else if (from.startsWith('c:') && to === 'trash') act = 'back';
      else if (from === TAP) act = to === 'save' ? 'record' : 'finish';
      else if (from.startsWith('p:')) return L('括號要拖到「接到字串尾端」。', 'Drag pieces onto "Append".');
      else return L('要退回時，把最後一個字拖進 🗑️。', 'To back up, drag the last character into 🗑️.');
      return generateParentheses.whyWrong(st, act) ?? L('這一步不對。', 'Not quite.');
    },
  },
  result: (st) => L(`共 ${st.res.length} 個：${st.res.join('  ')}`, `${st.res.length} strings: ${st.res.join('  ')}`),
  code: `def generateParenthesis(self, n: int) -> List[str]:
    stack, res = [], []
    def backtrack(openN, closedN):
        if openN == closedN == n:
            res.append("".join(stack))
            return
        if openN < n:
            stack.append("(")
            backtrack(openN + 1, closedN)
            stack.pop()
        if closedN < openN:
            stack.append(")")
            backtrack(openN, closedN + 1)
            stack.pop()
    backtrack(0, 0)
    return res`,
  lineOf: { init: 2, record: 5, addOpen: 8, addClose: 12, back: 10, finish: 16 },
  answer: (st) => st.res,
  verify({ n }, ans) {
    const all: string[] = [];
    const gen = (p: string) => {
      if (p.length === 2 * n) {
        let bal = 0;
        for (const c of p) if ((bal += c === '(' ? 1 : -1) < 0) return;
        if (bal === 0) all.push(p);
        return;
      }
      gen(p + '(');
      gen(p + ')');
    };
    gen('');
    return JSON.stringify(ans) === JSON.stringify(all);
  },
};
