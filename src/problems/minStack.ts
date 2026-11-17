import { pick, randInt } from '../core/engine';
import { L, type CellMark, type L10n, type Problem } from '../core/types';
import { err, isObj } from './helpers';

type I = { ops: string[] };
/** phase: sub-step of a two-part op (push: value then min; pop: stack then minStack). */
type S = { ops: string[]; i: number; phase: 0 | 1; stack: number[]; mins: number[]; out: (number | null)[] };

const parse = (op: string) => {
  const [name, arg] = op.trim().split(/\s+/);
  return { name, val: arg === undefined ? NaN : Number(arg) };
};
const top = (a: number[]) => a[a.length - 1];

export const minStack: Problem<I, S> = {
  id: 'min-stack',
  number: 155,
  category: 'stack',
  difficulty: 'Medium',
  title: L('最小堆疊', 'Min Stack'),
  description: L(
    '設計一個堆疊，除了 push、pop、top，還要能在 O(1) 時間內用 getMin 取得目前的最小值。',
    'Design a stack that supports push, pop, top, and getMin, all in O(1) time.',
  ),
  insight: L(
    '多開一個 minStack，和 stack 同步 push / pop。minStack 每一層存「到這一層為止的最小值」：push 時放 min(新數字, minStack 頂端)。這樣 minStack 的頂端永遠是目前的最小值。',
    'Keep a second minStack that pushes and pops in step with the stack. Each level stores the minimum so far: on push, store min(new value, current minStack top). The minStack top is then always the current minimum.',
  ),
  complexity: {
    time: 'O(1)',
    space: 'O(n)',
    why: L(
      '每個操作只碰兩個堆疊的頂端，都是 O(1)。minStack 和 stack 一樣高，所以多用 O(n) 空間。如果 getMin 每次都掃整個 stack，會是 O(n)。',
      'Every operation only touches the two tops: O(1). The minStack is as tall as the stack, costing O(n) extra space. Scanning the stack on each getMin would be O(n).',
    ),
  },
  examples: [
    { ops: ['push -2', 'push 0', 'push -3', 'getMin', 'pop', 'top', 'getMin'] },
    { ops: ['push 5', 'push 3', 'push 7', 'getMin', 'pop', 'pop', 'getMin'] },
    { ops: ['push 2', 'push 2', 'push 1', 'pop', 'getMin', 'pop', 'getMin'] },
  ],
  random() {
    const ops: string[] = [];
    let size = 0;
    const n = randInt(6, 9);
    while (ops.length < n) {
      const kind = size === 0 ? 'push' : pick(['push', 'push', 'pop', 'top', 'getMin', 'getMin']);
      if (kind === 'push') {
        ops.push(`push ${randInt(-5, 9)}`);
        size++;
      } else {
        ops.push(kind);
        if (kind === 'pop') size--;
      }
    }
    return { ops };
  },
  validate(x) {
    if (!isObj(x) || !Array.isArray(x.ops) || x.ops.length === 0 || x.ops.length > 16)
      return err('需要 {"ops": ["push 3", "getMin", "pop", "top", ...]}，1–16 個操作', 'Expected {"ops": ["push 3", "getMin", "pop", "top", ...]}, 1–16 ops');
    let size = 0;
    for (const op of x.ops) {
      if (typeof op !== 'string') return err('每個操作都要是字串', 'Every op must be a string');
      const { name, val } = parse(op);
      if (name === 'push') {
        if (!Number.isInteger(val)) return err(`"${op}" 需要整數`, `"${op}" needs an integer`);
        size++;
      } else if (name === 'pop' || name === 'top' || name === 'getMin') {
        if (size === 0) return err(`"${op}" 時堆疊是空的`, `The stack is empty at "${op}"`);
        if (name === 'pop') size--;
      } else return err(`無法辨識的操作 "${op}"`, `Unknown op "${op}"`);
    }
    return null;
  },
  formatInput: (i) => `ops = [${i.ops.map((o) => JSON.stringify(o)).join(', ')}]`,

  init: ({ ops }) => ({ ops, i: 0, phase: 0, stack: [], mins: [], out: [] }),
  isDone: (st) => st.i >= st.ops.length,
  options: () => [
    { id: 'pushVal', label: L('數字放進 stack', 'Push value onto stack') },
    { id: 'pushMinNew', label: L('minStack 放新數字', 'minStack: push the new value') },
    { id: 'pushMinCopy', label: L('minStack 複製頂端', 'minStack: copy its top') },
    { id: 'popVal', label: L('pop stack', 'Pop stack') },
    { id: 'popMin', label: L('pop minStack', 'Pop minStack') },
    { id: 'top', label: L('回傳 stack 頂端', 'Return stack top') },
    { id: 'getMin', label: L('回傳 minStack 頂端', 'Return minStack top') },
  ],
  correct(st) {
    const { name, val } = parse(st.ops[st.i]);
    if (name === 'push') {
      if (st.phase === 0) return ['pushVal'];
      const m = top(st.mins);
      if (st.mins.length === 0 || val < m) return ['pushMinNew'];
      return val === m ? ['pushMinNew', 'pushMinCopy'] : ['pushMinCopy'];
    }
    if (name === 'pop') return st.phase === 0 ? ['popVal'] : ['popMin'];
    return name === 'top' ? ['top'] : ['getMin'];
  },
  apply(st, act) {
    const { val } = parse(st.ops[st.i]);
    const next = (s: Partial<S>): S => ({ ...st, ...s, i: st.i + 1, phase: 0 });
    switch (act) {
      case 'pushVal':
        return { ...st, stack: [...st.stack, val], phase: 1 };
      case 'pushMinNew':
        return next({ mins: [...st.mins, val] });
      case 'pushMinCopy':
        return next({ mins: [...st.mins, top(st.mins)] });
      case 'popVal':
        return { ...st, stack: st.stack.slice(0, -1), phase: 1 };
      case 'popMin':
        return next({ mins: st.mins.slice(0, -1) });
      case 'top':
        return next({ out: [...st.out, top(st.stack)] });
      default:
        return next({ out: [...st.out, top(st.mins)] });
    }
  },
  explain(st, act) {
    const { val } = parse(st.ops[st.i]);
    const m = top(st.mins);
    const map: Record<string, L10n> = {
      pushVal: L(`push ${val}：先把 ${val} 放進 stack。`, `push ${val}: first put ${val} on the stack.`),
      pushMinNew: st.mins.length
        ? L(`${val} ≤ 目前最小值 ${m}，minStack 放 ${val}。`, `${val} ≤ current min ${m}, so minStack gets ${val}.`)
        : L(`minStack 是空的，${val} 就是目前最小值，放進 minStack。`, `minStack is empty, so ${val} is the min. Push it.`),
      pushMinCopy: L(`${val} > 目前最小值 ${m}，最小值不變，minStack 再放一次 ${m}。`, `${val} > current min ${m}; the min doesn't change, so minStack gets ${m} again.`),
      popVal: L(`pop：stack 拿掉頂端的 ${top(st.stack)}。`, `pop: remove ${top(st.stack)} from the stack.`),
      popMin: L(`minStack 也同步拿掉一層（${m}），兩邊高度保持一樣。`, `minStack drops one level too (${m}), keeping both the same height.`),
      top: L(`top：回傳 stack 頂端 ${top(st.stack)}。`, `top: return the stack top, ${top(st.stack)}.`),
      getMin: L(`getMin：minStack 頂端 ${m} 就是目前最小值，O(1) 回傳。`, `getMin: the minStack top, ${m}, is the current minimum. Return it in O(1).`),
    };
    return map[act];
  },
  whyWrong(st, act) {
    const { name, val } = parse(st.ops[st.i]);
    const m = top(st.mins);
    if (name === 'push' && st.phase === 1) {
      if (act === 'pushMinNew') return L(`${val} 比目前最小值 ${m} 大，最小值還是 ${m}。minStack 要複製 ${m}。`, `${val} is bigger than the current min ${m}; the min stays ${m}. Copy ${m}.`);
      if (act === 'pushMinCopy')
        return st.mins.length
          ? L(`${val} 比目前最小值 ${m} 小，新的最小值是 ${val}。`, `${val} is smaller than the current min ${m}; the new min is ${val}.`)
          : L(`minStack 是空的，沒有東西可以複製。${val} 就是目前最小值。`, `minStack is empty, so there's nothing to copy. ${val} is the min.`);
      return L('stack 放好了，接著處理 minStack。', 'The stack is done; now update minStack.');
    }
    if (name === 'pop' && st.phase === 1) return L('stack pop 了，minStack 也要同步 pop。', 'The stack popped; minStack must pop too.');
    if (act === 'getMin' && name === 'top') return L('top 要回傳的是 stack 頂端（最後放進去的），不是最小值。', 'top returns the stack top (the last pushed), not the minimum.');
    if (act === 'top' && name === 'getMin')
      return L(`stack 頂端是最後放的 ${top(st.stack)}，不一定最小。最小值要看 minStack 頂端。`, `The stack top is just the last pushed (${top(st.stack)}), not necessarily the min. Read the minStack top.`);
    return L(`現在的操作是 "${st.ops[st.i]}"。`, `The current op is "${st.ops[st.i]}".`);
  },
  hints(st) {
    const { name, val } = parse(st.ops[st.i]);
    if (name === 'push' && st.phase === 1)
      return [L('新數字和目前最小值比，誰比較小？', 'Which is smaller: the new value or the current min?'), L(`新數字 ${val}，minStack 頂端 ${st.mins.length ? top(st.mins) : '（空）'}。`, `New ${val}, minStack top ${st.mins.length ? top(st.mins) : '(empty)'}.`)];
    return [L(`現在的操作是 "${st.ops[st.i]}"。`, `The current op is "${st.ops[st.i]}".`), L('stack 和 minStack 要一起動嗎？', 'Do the stack and minStack move together?')];
  },
  scene(st) {
    const { ops, i, stack, mins, out } = st;
    const done = i >= ops.length;
    const marks: Record<number, CellMark> = {};
    ops.forEach((_, k) => {
      if (k < i) marks[k] = 'done';
    });
    if (!done) marks[i] = 'focus';
    const cur = done ? null : parse(ops[i]);
    return [
      {
        kind: 'array',
        id: 'ops',
        label: L('操作（↓x = push x，min = getMin；由左往右）', 'ops (↓x = push x, min = getMin; left to right)'),
        values: ops.map((o) => {
          const { name, val } = parse(o);
          return name === 'push' ? `↓${val}` : name === 'getMin' ? 'min' : name;
        }),
        pointers: done ? [] : [{ name: '▶', index: i, color: 'a' }],
        marks,
        dragPrefix: 'o',
        dragMask: ops.map((_, k) => !done && k === i && cur?.name === 'push'),
        dragLabels: ops.map((o) => String(parse(o).val)),
      },
      { kind: 'stack', id: 'stack', label: L('stack', 'stack'), items: stack, dragPrefix: done ? undefined : 's' },
      { kind: 'stack', id: 'mins', label: L('minStack（每層 = 到這層為止的最小值）', 'minStack (min so far at each level)'), items: mins, dragPrefix: done ? undefined : 'm' },
      { kind: 'set', id: 'out', label: L('輸出（top / getMin 的結果）', 'output (top / getMin results)'), items: out.map((v, k) => `${k + 1}: ${v}`) },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'toStack', label: L('➡ 放進 stack', '➡ Push onto stack'), tone: 'info' },
          { id: 'toMin', label: L('➡ 放進 minStack', '➡ Push onto minStack'), tone: 'info' },
          { id: 'trash', label: L('🗑️ pop', '🗑️ Pop'), tone: 'trash' },
          { id: 'outZone', label: L('📤 回傳', '📤 Return'), tone: 'good' },
        ],
      },
    ];
  },
  drag: {
    instructions: L(
      '照順序執行操作。push：先把數字拖到「放進 stack」，再決定 minStack 要放新數字還是複製自己的頂端（把 minStack 頂端拖到「放進 minStack」）。pop：兩個堆疊的頂端都拖進 🗑️。top / getMin：把對的頂端拖到 📤 回傳。',
      'Run the ops in order. push: drag the value to "Push onto stack", then decide whether minStack gets the new value or a copy of its own top (drag the minStack top to "Push onto minStack"). pop: drag both tops into 🗑️. top / getMin: drag the right top to 📤 Return.',
    ),
    moves(st) {
      const s = `s:${st.stack.length - 1}`;
      const m = `m:${st.mins.length - 1}`;
      const o = `o:${st.i}`;
      const where: Record<string, { from: string; to: string }> = {
        pushVal: { from: o, to: 'toStack' },
        pushMinNew: { from: o, to: 'toMin' },
        pushMinCopy: { from: m, to: 'toMin' },
        popVal: { from: s, to: 'trash' },
        popMin: { from: m, to: 'trash' },
        top: { from: s, to: 'outZone' },
        getMin: { from: m, to: 'outZone' },
      };
      return minStack.correct(st).map((a) => ({ action: a, ...where[a] }));
    },
    whyWrong(st, from, to) {
      const [kind, idxS] = from.split(':');
      const idx = Number(idxS);
      const { name } = parse(st.ops[st.i]);
      if (kind === 's' && idx !== st.stack.length - 1) return L('只能拿 stack 的頂端。', 'Only the stack top can be taken.');
      if (kind === 'm' && idx !== st.mins.length - 1) return L('只能拿 minStack 的頂端。', 'Only the minStack top can be taken.');
      // map the attempted drag to the action it would mean
      let act = '';
      if (kind === 'o') act = to === 'toStack' ? 'pushVal' : to === 'toMin' ? 'pushMinNew' : '';
      if (kind === 's') act = to === 'trash' ? 'popVal' : to === 'outZone' ? 'top' : '';
      if (kind === 'm') act = to === 'trash' ? 'popMin' : to === 'outZone' ? 'getMin' : to === 'toMin' ? 'pushMinCopy' : '';
      if (!act) {
        if (name === 'push' && st.phase === 0) return L('push：先把數字拖到「放進 stack」。', 'push: first drag the value to "Push onto stack".');
        return L('這個方塊不能放在那裡。', "That tile doesn't go there.");
      }
      if (name === 'push' && st.phase === 0 && act === 'pushMinNew') return L('先放 stack，再處理 minStack。', 'Do the stack first, then minStack.');
      if (name === 'pop' && st.phase === 0 && act === 'popMin') return L('先 pop stack，再 pop minStack。', 'Pop the stack first, then minStack.');
      return minStack.whyWrong(st, act) ?? L('這一步不對。', 'Not quite.');
    },
  },
  result: (st) => L(`輸出：[${st.out.join(', ')}]`, `Output: [${st.out.join(', ')}]`),
  code: `class MinStack:
    def __init__(self):
        self.stack = []
        self.minStack = []

    def push(self, val: int) -> None:
        self.stack.append(val)
        val = min(val, self.minStack[-1] if self.minStack else val)
        self.minStack.append(val)

    def pop(self) -> None:
        self.stack.pop()
        self.minStack.pop()

    def top(self) -> int:
        return self.stack[-1]

    def getMin(self) -> int:
        return self.minStack[-1]`,
  lineOf: { init: 3, pushVal: 7, pushMinNew: 9, pushMinCopy: 9, popVal: 12, popMin: 13, top: 16, getMin: 19 },
  answer: (st) => st.out,
  verify({ ops }, ans) {
    const s: number[] = [];
    const exp: number[] = [];
    for (const op of ops) {
      const { name, val } = parse(op);
      if (name === 'push') s.push(val);
      else if (name === 'pop') s.pop();
      else if (name === 'top') exp.push(top(s));
      else exp.push(Math.min(...s));
    }
    return JSON.stringify(ans) === JSON.stringify(exp);
  },
};
