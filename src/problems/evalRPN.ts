import { pick, randInt } from '../core/engine';
import { L, type Problem } from '../core/types';
import { err, isObj } from './helpers';

type I = { tokens: string[] };
type S = { tokens: string[]; i: number; stack: number[]; done: boolean };

const OPS = ['+', '-', '*', '/'];
const isOp = (t: string) => OPS.includes(t);
const calc = (a: number, op: string, b: number) => {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    default:
      return b === 0 ? NaN : Math.trunc(a / b);
  }
};

type Node = { v: number } | { op: string; l: Node; r: Node };
const evalNode = (n: Node): number => ('v' in n ? n.v : calc(evalNode(n.l), n.op, evalNode(n.r)));
const postfix = (n: Node): string[] => ('v' in n ? [String(n.v)] : [...postfix(n.l), ...postfix(n.r), n.op]);

function genTree(depth: number): Node {
  if (depth === 0 || Math.random() < 0.25) return { v: randInt(1, 9) };
  const l = genTree(depth - 1);
  let r = genTree(depth - 1);
  let op = pick(OPS);
  if (op === '/' && evalNode(r) === 0) r = { v: randInt(1, 9) };
  if (op === '/' && evalNode(r) === 0) op = '+';
  return { op, l, r };
}

/** Stack top first: b = top, a = second. */
const operands = (stack: number[]) => ({ a: stack[stack.length - 2], b: stack[stack.length - 1] });

export const evalRPN: Problem<I, S> = {
  id: 'evaluate-reverse-polish-notation',
  number: 150,
  category: 'stack',
  difficulty: 'Medium',
  title: L('逆波蘭表示法求值', 'Evaluate Reverse Polish Notation'),
  description: L(
    '運算子寫在運算元後面的算式（例如 ["2","1","+","3","*"] 等於 (2+1)*3），求它的值。除法向零取整。',
    'Evaluate an expression where operators follow their operands (e.g. ["2","1","+","3","*"] is (2+1)*3). Division truncates toward zero.',
  ),
  insight: L(
    '數字直接放進堆疊。遇到運算子就彈出兩個數：先彈出的是右邊的 b，後彈出的是左邊的 a，算 a ○ b 再放回去。順序對 - 和 / 很重要！',
    'Push numbers. On an operator, pop twice: the first pop is the right operand b, the second is the left operand a. Push a ○ b back. Order matters for - and /!',
  ),
  examples: [
    { tokens: ['2', '1', '+', '3', '*'] },
    { tokens: ['4', '13', '5', '/', '+'] },
    { tokens: ['9', '3', '-', '8', '2', '/', '*'] },
  ],
  random() {
    for (;;) {
      const tree = genTree(3);
      if ('v' in tree) continue;
      const tokens = postfix(tree);
      if (tokens.length >= 5 && tokens.length <= 13 && Number.isFinite(evalNode(tree))) return { tokens };
    }
  },
  validate(x) {
    if (!isObj(x) || !Array.isArray(x.tokens) || x.tokens.length === 0 || x.tokens.length > 19)
      return err('需要 {"tokens": ["2","1","+"]}，長度 1–19', 'Expected {"tokens": ["2","1","+"]}, length 1–19');
    let depth = 0;
    for (const t of x.tokens) {
      if (typeof t !== 'string') return err('每個 token 都要是字串', 'Every token must be a string');
      if (isOp(t)) {
        if (depth < 2) return err(`運算子 '${t}' 前面的數字不夠`, `Not enough operands before '${t}'`);
        depth--;
      } else if (/^-?\d+$/.test(t)) depth++;
      else return err(`無法辨識的 token '${t}'`, `Unknown token '${t}'`);
    }
    if (depth !== 1) return err('算完後堆疊應該剛好剩一個數字', 'The expression must leave exactly one number');
    const st: number[] = [];
    for (const t of x.tokens as string[]) {
      if (isOp(t)) {
        const b = st.pop()!;
        const a = st.pop()!;
        if (t === '/' && b === 0) return err('不能除以 0', 'Division by zero');
        st.push(calc(a, t, b));
      } else st.push(parseInt(t, 10));
    }
    return null;
  },
  formatInput: (i) => `tokens = [${i.tokens.map((t) => JSON.stringify(t)).join(', ')}]`,

  init: ({ tokens }) => ({ tokens, i: 0, stack: [], done: false }),
  isDone: (st) => st.done,
  options: () => [
    { id: 'push', label: L('數字放進堆疊（push）', 'Push the number') },
    { id: 'compute', label: L('彈出兩個，算「次頂 ○ 頂端」', 'Pop two, compute second ○ top') },
    { id: 'computeRev', label: L('彈出兩個，算「頂端 ○ 次頂」', 'Pop two, compute top ○ second') },
    { id: 'return', label: L('回傳堆疊中的結果', 'Return the result') },
  ],
  correct({ tokens, i, stack }) {
    if (i >= tokens.length) return ['return'];
    const t = tokens[i];
    if (!isOp(t)) return ['push'];
    const { a, b } = operands(stack);
    return calc(a, t, b) === calc(b, t, a) ? ['compute', 'computeRev'] : ['compute'];
  },
  apply(st, act) {
    const t = st.tokens[st.i];
    if (act === 'push') return { ...st, stack: [...st.stack, parseInt(t, 10)], i: st.i + 1 };
    if (act === 'return') return { ...st, done: true };
    const { a, b } = operands(st.stack);
    const v = act === 'compute' ? calc(a, t, b) : calc(b, t, a);
    return { ...st, stack: [...st.stack.slice(0, -2), v], i: st.i + 1 };
  },
  explain({ tokens, i, stack }, act) {
    const t = tokens[i];
    if (act === 'push') return L(`'${t}' 是數字，放進堆疊。`, `'${t}' is a number. Push it.`);
    if (act === 'return')
      return L(`所有 token 都處理完了，堆疊裡只剩 ${stack[0]}，就是答案。`, `All tokens are processed. Only ${stack[0]} is left on the stack, and that's the answer.`);
    const { a, b } = operands(stack);
    return L(
      `遇到 '${t}'：先彈出 b = ${b}（頂端），再彈出 a = ${a}，算 ${a} ${t} ${b} = ${calc(a, t, b)}，放回堆疊。`,
      `Operator '${t}': pop b = ${b} (top), then a = ${a}. Compute ${a} ${t} ${b} = ${calc(a, t, b)} and push it.`,
    );
  },
  whyWrong({ tokens, i, stack }, act) {
    if (i >= tokens.length) return L('所有 token 都處理完了。', 'All tokens have been processed.');
    const t = tokens[i];
    if (act === 'return') return L('還有 token 沒處理。', 'There are still tokens left.');
    if (!isOp(t)) return L(`'${t}' 是數字，直接放進堆疊。`, `'${t}' is a number. Just push it.`);
    if (act === 'push') return L(`'${t}' 是運算子，不是數字。`, `'${t}' is an operator, not a number.`);
    const { a, b } = operands(stack);
    return L(
      `順序反了！先彈出的 ${b} 是右邊的運算元。應該是 ${a} ${t} ${b} = ${calc(a, t, b)}，不是 ${b} ${t} ${a}。`,
      `Wrong order! The first pop (${b}) is the right operand. It is ${a} ${t} ${b} = ${calc(a, t, b)}, not ${b} ${t} ${a}.`,
    );
  },
  hints: ({ tokens, i, stack }) => [
    i >= tokens.length
      ? L('token 都處理完了嗎？', 'Have all tokens been processed?')
      : L(`現在的 token '${tokens[i]}' 是數字還是運算子？`, `Is the current token '${tokens[i]}' a number or an operator?`),
    L(
      '遇到運算子時：先彈出的是右邊的運算元，例如 [5, 2] 遇到 - 是 5 - 2。',
      'For an operator, the first pop is the right operand: [5, 2] with - means 5 - 2.',
    ),
    L(`堆疊：[${stack.join(', ')}]`, `Stack: [${stack.join(', ')}]`),
  ],
  scene({ tokens, i, stack, done }) {
    const marks: Record<number, 'focus' | 'done'> = {};
    for (let k = 0; k < Math.min(i, tokens.length); k++) marks[k] = 'done';
    if (i < tokens.length) marks[i] = 'focus';
    return [
      { kind: 'array', id: 'tokens', label: L('tokens', 'tokens'), values: tokens, pointers: [{ name: 'i', index: i, color: 'a' }], marks },
      { kind: 'stack', id: 'stack', label: L('stack', 'stack'), items: stack },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'c', value: i < tokens.length ? tokens[i] : '—', highlight: true },
          { name: 'return', value: done ? stack[0] : '—' },
        ],
      },
    ];
  },
  result: (st) => L(`結果 = ${st.stack[0]}`, `Result = ${st.stack[0]}`),
  code: `def evalRPN(self, tokens: List[str]) -> int:
    stack = []
    for c in tokens:
        if c in "+-*/":
            b, a = stack.pop(), stack.pop()
            if c == "+": stack.append(a + b)
            elif c == "-": stack.append(a - b)
            elif c == "*": stack.append(a * b)
            else: stack.append(int(a / b))
        else:
            stack.append(int(c))
    return stack[0]`,
  lineOf: { init: 2, compute: 5, computeRev: 5, push: 11, return: 12 },
  answer: (st) => st.stack[0],
  verify({ tokens }, ans) {
    // Independent check: rebuild the expression tree from the right, then evaluate recursively.
    let k = tokens.length - 1;
    const build = (): Node => {
      const t = tokens[k--];
      if (!isOp(t)) return { v: parseInt(t, 10) };
      const r = build();
      const l = build();
      return { op: t, l, r };
    };
    return ans === evalNode(build());
  },
};
