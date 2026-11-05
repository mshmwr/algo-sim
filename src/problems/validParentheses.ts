import { pick, randInt } from '../core/engine';
import { L, type Problem } from '../core/types';
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
    const marks: Record<number, 'good' | 'bad' | 'focus' | 'done'> = {};
    for (let k = 0; k < Math.min(i, s.length); k++) marks[k] = 'done';
    if (i < s.length) marks[i] = done && result === false ? 'bad' : 'focus';
    return [
      {
        kind: 'array',
        id: 's',
        label: L('字串 s', 'string s'),
        values: [...s],
        pointers: [{ name: 'i', index: i, color: 'a' }],
        marks,
      },
      { kind: 'stack', id: 'stack', label: L('stack', 'stack'), items: stack },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'c', value: i < s.length ? s[i] : '—', highlight: true },
          { name: 'return', value: result === null ? '—' : result ? 'True' : 'False' },
        ],
      },
    ];
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
