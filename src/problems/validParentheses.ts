import { pick, randInt } from '../core/engine';
import { L, TAP, type CellMark, type Problem } from '../core/types';
import { err, isObj } from './helpers';

type I = { s: string };
type S = { s: string; i: number; stack: string[]; done: boolean; result: boolean | null };

const PAIR: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
const isOpen = (c: string) => '([{'.includes(c);

function genValid(pairs: number): string {
  if (pairs === 0) return '';
  const inner = randInt(0, pairs - 1);
  const [o, c] = pick([['(', ')'], ['[', ']'], ['{', '}']]);
  return o + genValid(inner) + c + genValid(pairs - 1 - inner);
}

export const validParentheses: Problem<I, S> = {
  id: 'valid-parentheses',
  number: 20,
  category: 'stack',
  difficulty: 'Easy',
  title: L('有效的括號', 'Valid Parentheses'),
  description: L(
    '字串只包含 ()[]{}，判斷括號是否都正確配對且順序正確。',
    'The string contains only ()[]{}. Decide whether every bracket is closed by the matching type in the correct order.',
  ),
  insight: L(
    '左括號放進堆疊；遇到右括號時，它必須和堆疊「頂端」的左括號是一對。最後堆疊要是空的。',
    'Push opening brackets. A closing bracket must match the opening bracket on top of the stack. At the end the stack must be empty.',
  ),
  examples: [{ s: '([]{})' }, { s: '([)]' }, { s: '{[()]}(' }],
  random() {
    let s = genValid(randInt(2, 5));
    if (Math.random() < 0.5) {
      const arr = [...s];
      const k = randInt(0, arr.length - 1);
      const mode = randInt(0, 2);
      if (mode === 0) arr[k] = pick([...'()[]{}']);
      else if (mode === 1) arr.splice(k, 1);
      else arr.splice(k, 0, pick([...'([{)]}']));
      s = arr.join('');
    }
    return { s };
  },
  validate(x) {
    if (!isObj(x) || typeof x.s !== 'string' || !/^[()[\]{}]*$/.test(x.s))
      return err('需要 {"s": "只含 ()[]{} 的字串"}', 'Expected {"s": "only ()[]{} characters"}');
    if (x.s.length > 24) return err('字串最長 24 個字元', 'String must be at most 24 characters');
    return null;
  },
  formatInput: (i) => `s = ${JSON.stringify(i.s)}`,

  init: ({ s }) => ({ s, i: 0, stack: [], done: false, result: null }),
  isDone: (st) => st.done,
  options: () => [
    { id: 'push', label: L('放進堆疊（push）', 'Push onto stack') },
    { id: 'pop', label: L('配對成功，彈出（pop）', 'Matched, pop') },
    { id: 'false', label: L('回傳 False', 'Return False') },
    { id: 'true', label: L('回傳 True', 'Return True') },
  ],
  correct({ s, i, stack }) {
    if (i >= s.length) return stack.length === 0 ? ['true'] : ['false'];
    const c = s[i];
    if (isOpen(c)) return ['push'];
    return stack.length > 0 && stack[stack.length - 1] === PAIR[c] ? ['pop'] : ['false'];
  },
  apply(st, a) {
    if (a === 'push') return { ...st, stack: [...st.stack, st.s[st.i]], i: st.i + 1 };
    if (a === 'pop') return { ...st, stack: st.stack.slice(0, -1), i: st.i + 1 };
    return { ...st, done: true, result: a === 'true' };
  },
  explain({ s, i, stack }, a) {
    const c = s[i];
    const top = stack[stack.length - 1];
    if (a === 'push') return L(`'${c}' 是左括號，放進堆疊，等待之後的右括號來配對。`, `'${c}' is an opening bracket. Push it and wait for its closing partner.`);
    if (a === 'pop') return L(`'${c}' 和堆疊頂端的 '${top}' 是一對，配對成功，彈出。`, `'${c}' matches '${top}' on top of the stack. Pop it.`);
    if (a === 'true') return L('字串掃完了，堆疊是空的，全部配對成功！回傳 True。', 'The string is done and the stack is empty. Everything matched! Return True.');
    if (i >= s.length)
      return L(`字串掃完了，但堆疊裡還有 ${stack.length} 個左括號沒配對。回傳 False。`, `The string is done, but ${stack.length} opening bracket(s) are still unmatched. Return False.`);
    if (stack.length === 0) return L(`'${c}' 是右括號，但堆疊是空的，沒有左括號可以配對。回傳 False。`, `'${c}' is a closing bracket, but the stack is empty. Nothing to match. Return False.`);
    return L(`'${c}' 和堆疊頂端的 '${top}' 不是一對。回傳 False。`, `'${c}' does not match '${top}' on top of the stack. Return False.`);
  },
  whyWrong({ s, i, stack }, a) {
    const top = stack[stack.length - 1];
    if (i >= s.length) {
      if (a === 'push' || a === 'pop') return L('字串已經掃完了。', 'The whole string has been scanned.');
      return stack.length === 0
        ? L('堆疊是空的，代表全部都配對成功了。', 'The stack is empty, so everything matched.')
        : L(`堆疊裡還剩 ${stack.length} 個沒配對的左括號。`, `${stack.length} unmatched opening bracket(s) remain on the stack.`);
    }
    const c = s[i];
    if (a === 'true') return L('字串還沒掃完。', 'The string has not been fully scanned yet.');
    if (isOpen(c)) {
      return L(`'${c}' 是左括號，應該放進堆疊。`, `'${c}' is an opening bracket. It should go on the stack.`);
    }
    if (a === 'push') return L(`'${c}' 是右括號，右括號不放進堆疊，要和頂端比對。`, `'${c}' is a closing bracket. Don't push it; compare it with the top.`);
    const ok = stack.length > 0 && top === PAIR[c];
    if (a === 'pop') {
      return stack.length === 0
        ? L('堆疊是空的，沒有東西可以彈出。', 'The stack is empty. There is nothing to pop.')
        : L(`頂端是 '${top}'，和 '${c}' 不是一對。`, `The top is '${top}', which does not match '${c}'.`);
    }
    if (a === 'false' && ok) return L(`'${c}' 和頂端的 '${top}' 剛好是一對。`, `'${c}' matches the top '${top}'.`);
    return null;
  },
  hints: ({ s, i, stack }) => [
    i >= s.length
      ? L('字串掃完了，看看堆疊裡還有沒有東西。', 'The scan is done. Is anything left on the stack?')
      : L(`現在的字元 '${s[i]}' 是左括號還是右括號？`, `Is the current character '${s[i]}' opening or closing?`),
    L(`堆疊頂端：${stack.length ? `'${stack[stack.length - 1]}'` : '（空）'}`, `Stack top: ${stack.length ? `'${stack[stack.length - 1]}'` : '(empty)'}`),
  ],
  scene({ s, i, stack, done, result }) {
    const marks: Record<number, CellMark> = {};
    for (let k = 0; k < Math.min(i, s.length); k++) marks[k] = isOpen(s[k]) ? 'done' : 'good';
    if (i < s.length) marks[i] = done && result === false ? 'bad' : 'focus';
    const live = [...s].map((_, k) => !done && k >= i);
    return [
      {
        kind: 'array',
        id: 's',
        label: L('字串 s（由左往右處理）', 'string s (left to right)'),
        values: [...s],
        pointers: done ? [] : [{ name: 'i', index: i, color: 'a' }],
        marks,
        dragPrefix: 'c',
        dropPrefix: 'c',
        dragMask: live,
        dropMask: live,
      },
      {
        kind: 'stack',
        id: 'stack',
        label: L('stack（還在等配對的左括號）', 'stack (opening brackets waiting for a match)'),
        items: stack,
        dragPrefix: done ? undefined : 'k',
        dropId: done ? undefined : 'stack',
        itemDropPrefix: done ? undefined : 'k',
      },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'no', label: L('✗ 無效', '✗ Invalid'), tone: 'bad' },
          { id: 'yes', label: L('✓ 有效', '✓ Valid'), tone: 'good' },
        ],
      },
    ];
  },
  drag: {
    instructions: L(
      '由左往右處理：左括號拖進 stack；右括號拖到 stack 頂端那塊上面配對。配不起來就拖進 ✗。全部處理完，點 ✓ 或 ✗。',
      'Go left to right: drag opening brackets into the stack; drag a closing bracket onto the top of the stack to pair it. If it cannot pair, drag it into ✗. When the string is done, tap ✓ or ✗.',
    ),
    tapZones: ['yes', 'no'],
    moves({ s, i, stack }) {
      const topPos = stack.length - 1;
      if (i >= s.length) {
        if (stack.length === 0) return [{ action: 'true', from: TAP, to: 'yes' }];
        return [
          { action: 'false', from: TAP, to: 'no' },
          { action: 'false', from: `k:${topPos}`, to: 'no' },
        ];
      }
      const c = s[i];
      if (isOpen(c)) return [{ action: 'push', from: `c:${i}`, to: 'stack' }, ...stack.map((_, j) => ({ action: 'push', from: `c:${i}`, to: `k:${j}` }))];
      if (stack.length > 0 && stack[topPos] === PAIR[c])
        return [
          { action: 'pop', from: `c:${i}`, to: `k:${topPos}` },
          { action: 'pop', from: `k:${topPos}`, to: `c:${i}` },
        ];
      return [
        { action: 'false', from: `c:${i}`, to: 'no' },
        { action: 'false', from: TAP, to: 'no' },
      ];
    },
    whyWrong({ s, i, stack }, from, to) {
      const n = s.length;
      const topPos = stack.length - 1;
      const top = stack[topPos];
      const q = (x: string) => `'${x}'`;
      if (i >= n) {
        if (to === 'yes') return L(`stack 裡還剩 ${stack.length} 個沒配對的左括號，所以無效。`, `${stack.length} unmatched opening bracket(s) remain, so it's invalid.`);
        if (to === 'no') return L('stack 是空的，每個括號都配對成功了。', 'The stack is empty; every bracket was matched.');
        return L('字串已經處理完了，點 ✓ 或 ✗ 下結論。', 'The string is done. Tap ✓ or ✗ to conclude.');
      }
      const c = s[i];
      const ok = stack.length > 0 && top === PAIR[c];
      if (from === TAP) {
        if (to === 'yes') return L('字串還沒處理完。', 'The string is not finished yet.');
        return isOpen(c)
          ? L(`還沒發現問題：${q(c)} 是左括號，放進 stack 就好。`, `No problem yet: ${q(c)} is an opening bracket; just push it.`)
          : L(`還沒發現問題：${q(c)} 可以和頂端的 ${q(top)} 配對。`, `No problem yet: ${q(c)} pairs with ${q(top)} on top.`);
      }
      const [kind, idxS] = from.split(':');
      const k = Number(idxS);
      if (kind === 'c') {
        if (k > i) return L(`還沒輪到 ${q(s[k])}。由左往右一個一個處理，現在是 ${q(c)}。`, `It's not ${q(s[k])}'s turn. Go left to right; the current one is ${q(c)}.`);
        if (to === 'yes') return L('字串還沒處理完。', 'The string is not finished yet.');
        if (to.startsWith('c:')) return L('要拖到 stack，不是拖到字串裡。', 'Drag it to the stack, not into the string.');
        if (isOpen(c))
          return L(`${q(c)} 是左括號，放進 stack 等之後的右括號來配對。`, `${q(c)} is an opening bracket. Push it so a later closing bracket can pair with it.`);
        // closing bracket
        if (to === 'no') return L(`${q(c)} 和頂端的 ${q(top)} 剛好是一對，把它拖到頂端上配對。`, `${q(c)} matches ${q(top)} on top. Drag it onto the top to pair.`);
        if (stack.length === 0)
          return L(`${q(c)} 是右括號，但 stack 是空的，沒有左括號可以配對，這代表無效。`, `${q(c)} is a closing bracket, but the stack is empty. Nothing can pair with it, which means invalid.`);
        if (to === 'stack') return L(`右括號不放進 stack，要拖到頂端的 ${q(top)} 上面比對。`, `Closing brackets don't go on the stack. Drag it onto the top ${q(top)} to compare.`);
        const j = Number(to.split(':')[1]);
        if (j !== topPos) return L(`只能和 stack 最上面的 ${q(top)} 配對。`, `It can only pair with ${q(top)} on top of the stack.`);
        return ok ? L('', '') : L(`${q(c)} 和頂端的 ${q(top)} 不是一對，這代表無效。`, `${q(c)} doesn't match ${q(top)} on top, which means invalid.`);
      }
      // dragging a stack item
      if (k !== topPos) return L('只能拿 stack 最上面那一塊。', 'You can only take the top of the stack.');
      if (to === 'stack' || to.startsWith('k:')) return L('它已經在 stack 裡了。', "It's already in the stack.");
      if (to === 'no' || to === 'yes') return L('字串還沒處理完。', 'The string is not finished yet.');
      const j = Number(to.split(':')[1]);
      if (j !== i) return L(`要和現在處理的 ${q(c)} 配對。`, `Pair it with the current character ${q(c)}.`);
      if (isOpen(c)) return L(`${q(c)} 是左括號，要放進 stack，不是拿來配對。`, `${q(c)} is an opening bracket. Push it; it isn't a closing partner.`);
      return L(`頂端的 ${q(top)} 和 ${q(c)} 不是一對，這代表無效。把 ${q(c)} 拖進 ✗。`, `${q(top)} doesn't match ${q(c)}, which means invalid. Drag ${q(c)} into ✗.`);
    },
  },
  result: (st) => L(`回傳 ${st.result ? 'True' : 'False'}`, `Returned ${st.result ? 'True' : 'False'}`),
  code: `def isValid(self, s: str) -> bool:
    stack = []
    closeToOpen = {")": "(", "]": "[", "}": "{"}
    for c in s:
        if c in closeToOpen:
            if stack and stack[-1] == closeToOpen[c]:
                stack.pop()
            else:
                return False
        else:
            stack.append(c)
    return True if not stack else False`,
  lineOf: { init: 2, pop: 7, push: 11, true: 12, false: 9 },
  answer: (st) => st.result,
  verify({ s }, ans) {
    let t = s;
    for (;;) {
      const n = t.replace(/\(\)|\[\]|\{\}/g, '');
      if (n === t) break;
      t = n;
    }
    return ans === (t.length === 0);
  },
};
