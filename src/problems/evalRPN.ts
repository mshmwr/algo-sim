import { pick, randInt } from '../core/engine';
import { L, TAP, type CellMark, type Layer, type Problem } from '../core/types';
import { err, isObj } from './helpers';

type I = { tokens: string[] };
/** b = right operand (popped first), a = left operand (popped second). */
type S = { tokens: string[]; i: number; stack: number[]; done: boolean; b: number | null };

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

  init: ({ tokens }) => ({ tokens, i: 0, stack: [], done: false, b: null }),
  isDone: (st) => st.done,
  options: () => [
    { id: 'push', label: L('數字放進堆疊（push）', 'Push the number') },
    { id: 'takeB', label: L('pop 頂端 → 右邊的 b', 'Pop top → right operand b') },
    { id: 'takeA', label: L('pop 頂端 → 左邊的 a，計算', 'Pop top → left operand a, compute') },
    { id: 'return', label: L('回傳結果', 'Return the result') },
  ],
  correct({ tokens, i, b }) {
    if (i >= tokens.length) return ['return'];
    if (!isOp(tokens[i])) return ['push'];
    return b === null ? ['takeB'] : ['takeA'];
  },
  apply(st, act) {
    const t = st.tokens[st.i];
    if (act === 'push') return { ...st, stack: [...st.stack, parseInt(t, 10)], i: st.i + 1 };
    if (act === 'return') return { ...st, done: true };
    const top = st.stack[st.stack.length - 1];
    const rest = st.stack.slice(0, -1);
    if (act === 'takeB') return { ...st, stack: rest, b: top };
    return { ...st, stack: [...rest, calc(top, t, st.b!)], b: null, i: st.i + 1 };
  },
  explain({ tokens, i, stack, b }, act) {
    const t = tokens[i];
    const top = stack[stack.length - 1];
    if (act === 'push') return L(`'${t}' 是數字，放進堆疊。`, `'${t}' is a number. Push it.`);
    if (act === 'return')
      return L(`所有 token 都處理完了，堆疊裡只剩 ${stack[0]}，就是答案。`, `All tokens are processed. Only ${stack[0]} is left on the stack, and that's the answer.`);
    if (act === 'takeB')
      return L(`遇到 '${t}'：先 pop 出頂端的 ${top}，它是右邊的運算元 b。`, `Operator '${t}': the first pop gives ${top}, the right operand b.`);
    return L(
      `再 pop 出 ${top}，它是左邊的運算元 a。計算 ${top} ${t} ${b} = ${calc(top, t, b!)}，結果放回堆疊。`,
      `The second pop gives ${top}, the left operand a. Compute ${top} ${t} ${b} = ${calc(top, t, b!)} and push the result.`,
    );
  },
  whyWrong({ tokens, i, b }, act) {
    if (i >= tokens.length) return L('所有 token 都處理完了。', 'All tokens have been processed.');
    const t = tokens[i];
    if (act === 'return') return L('還有 token 沒處理。', 'There are still tokens left.');
    if (!isOp(t)) return L(`'${t}' 是數字，直接放進堆疊。`, `'${t}' is a number. Just push it.`);
    if (act === 'push') return L(`'${t}' 是運算子，不是數字。`, `'${t}' is an operator, not a number.`);
    if (act === 'takeA') return L('先 pop 出來的是右邊的 b，要先放 b。', 'The first pop is the right operand b. Fill b first.');
    return L(`b 已經是 ${b} 了，這次 pop 出來的是左邊的 a。`, `b is already ${b}; this pop is the left operand a.`);
  },
  hints: ({ tokens, i, stack, b }) => [
    i >= tokens.length
      ? L('token 都處理完了嗎？', 'Have all tokens been processed?')
      : isOp(tokens[i])
        ? L('遇到運算子：先 pop 出來的是右邊的 b，再 pop 出來的是左邊的 a。例如 [5, 2] 遇到 - 是 5 - 2。', 'For an operator, the first pop is the right operand b, the second is the left operand a: [5, 2] with - means 5 - 2.')
        : L(`現在的 token '${tokens[i]}' 是數字還是運算子？`, `Is the current token '${tokens[i]}' a number or an operator?`),
    b !== null
      ? L(`b = ${b} 已經放好，堆疊頂端是 ${stack[stack.length - 1]}。`, `b = ${b} is set; the stack top is ${stack[stack.length - 1]}.`)
      : L(`堆疊：[${stack.join(', ')}]`, `Stack: [${stack.join(', ')}]`),
  ],
  scene({ tokens, i, stack, done, b }): Layer[] {
    const marks: Record<number, CellMark> = {};
    for (let k = 0; k < Math.min(i, tokens.length); k++) marks[k] = 'done';
    if (i < tokens.length) marks[i] = 'focus';
    const op = i < tokens.length && isOp(tokens[i]) ? tokens[i] : null;
    const live = tokens.map((t, k) => !done && k >= i && !isOp(t));
    return [
      { kind: 'array', id: 'tokens', label: L('tokens（由左往右處理）', 'tokens (left to right)'), values: tokens, pointers: done ? [] : [{ name: 'i', index: i, color: 'a' }], marks, dragPrefix: 't', dragMask: live },
      {
        kind: 'stack',
        id: 'stack',
        label: L('stack', 'stack'),
        items: stack,
        dragPrefix: done ? undefined : 'k',
        dropId: done ? undefined : 'stack',
      },
      ...(op
        ? [
            {
              kind: 'array',
              id: 'calc',
              label: L('運算：a ○ b（把 stack 頂端拖進空格）', 'Compute a ○ b (drag the stack top into a slot)'),
              values: ['a', op, b === null ? 'b' : b],
              dropPrefix: 'slot',
              dropMask: [true, false, true],
              marks: (b !== null ? { 1: 'focus', 2: 'good' } : { 1: 'focus' }) as Record<number, CellMark>,
            } satisfies Layer,
          ]
        : []),
      {
        kind: 'zones',
        id: 'zones',
        zones: [{ id: 'ans', label: L('✓ 這就是答案', "✓ That's the answer"), tone: 'good' }],
      },
    ];
  },
  drag: {
    instructions: L(
      '數字拖進 stack。遇到運算子時，把 stack 頂端依序拖進算式的空格，系統會算好放回去。全部處理完，把最後的數拖到 ✓（或直接點 ✓）。',
      'Drag numbers into the stack. For an operator, drag the stack top into the formula slots one at a time; the result is pushed back for you. At the end, drag the last number to ✓ (or tap ✓).',
    ),
    tapZones: ['ans'],
    moves({ tokens, i, stack, b }) {
      const top = `k:${stack.length - 1}`;
      if (i >= tokens.length) return [{ action: 'return', from: top, to: 'ans' }, { action: 'return', from: TAP, to: 'ans' }];
      if (!isOp(tokens[i])) return [{ action: 'push', from: `t:${i}`, to: 'stack' }];
      return b === null ? [{ action: 'takeB', from: top, to: 'slot:2' }] : [{ action: 'takeA', from: top, to: 'slot:0' }];
    },
    whyWrong({ tokens, i, stack, b }, from, to) {
      const n = tokens.length;
      const t = tokens[i];
      const top = stack[stack.length - 1];
      if (i >= n) {
        if (from.startsWith('k:') && Number(from.split(':')[1]) !== stack.length - 1) return L('只能拿 stack 最上面那一塊。', 'You can only take the top of the stack.');
        return L('所有 token 都處理完了，把最後的數拖到 ✓。', 'All tokens are processed. Drag the last number to ✓.');
      }
      if (to === 'ans') return L('還有 token 沒處理，還不是答案。', "Tokens remain, so it isn't the answer yet.");
      if (from === TAP) return L('還有 token 沒處理。', 'There are still tokens left.');
      const [kind, idxS] = from.split(':');
      const k = Number(idxS);
      if (kind === 't') {
        if (k > i) return L(`還沒輪到 '${tokens[k]}'，由左往右處理，現在是 '${t}'。`, `It's not '${tokens[k]}'s turn. Go left to right; the current token is '${t}'.`);
        if (isOp(t)) return L(`現在要處理運算子 '${t}'：把 stack 頂端拖進算式的空格。`, `Handle the operator '${t}' now: drag the stack top into the formula.`);
        return L(`'${t}' 是數字，拖進 stack。`, `'${t}' is a number. Drag it into the stack.`);
      }
      // stack item
      if (k !== stack.length - 1) return L('只能拿 stack 最上面那一塊。', 'You can only take the top of the stack.');
      if (!isOp(t)) return L(`現在的 '${t}' 是數字，先把它放進 stack。`, `The current token '${t}' is a number. Push it first.`);
      if (to === 'stack') return L('它已經在 stack 裡了，要拖進算式的空格。', "It's already in the stack. Drag it into a formula slot.");
      if (to === 'slot:0' && b === null)
        return L(
          `先 pop 出來的 ${top} 是右邊的 b，要放右邊的空格。例如 [5, 2] 遇到 - 是 5 - 2，不是 2 - 5。`,
          `The first pop (${top}) is the right operand b, so it goes in the right slot. [5, 2] with - means 5 - 2, not 2 - 5.`,
        );
      if (to === 'slot:2' && b !== null) return L(`b 已經是 ${b} 了，這次 pop 出來的 ${top} 是左邊的 a。`, `b is already ${b}; this pop (${top}) is the left operand a.`);
      return L('拖進算式的空格。', 'Drag it into a formula slot.');
    },
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
  lineOf: { init: 2, takeB: 5, takeA: 5, push: 11, return: 12 },
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
