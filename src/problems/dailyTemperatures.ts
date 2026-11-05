import { randInt } from '../core/engine';
import { L, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';

type I = { temperatures: number[] };
type S = { t: number[]; i: number; stack: number[]; res: number[] };

export const dailyTemperatures: Problem<I, S> = {
  id: 'daily-temperatures',
  number: 739,
  category: 'stack',
  difficulty: 'Medium',
  title: L('每日溫度', 'Daily Temperatures'),
  description: L(
    '對每一天，算出要再等幾天才會遇到更高的溫度；如果之後都不會更熱，就填 0。',
    'For each day, count how many days you must wait for a warmer temperature. If no warmer day comes, use 0.',
  ),
  insight: L(
    '用單調遞減堆疊存「還在等更熱日子」的那些天。今天比頂端那天熱，就幫它結算並彈出，一直彈到不比頂端熱為止，再把今天放進去。',
    'Keep a monotonically decreasing stack of days still waiting for a warmer day. While today is warmer than the top, settle and pop it. Then push today.',
  ),
  examples: [
    { temperatures: [73, 74, 75, 71, 69, 72, 76, 73] },
    { temperatures: [30, 40, 50, 60] },
    { temperatures: [30, 60, 90] },
  ],
  random: () => ({ temperatures: Array.from({ length: randInt(6, 9) }, () => randInt(30, 39)) }),
  validate(x) {
    if (!isObj(x) || !isIntArray(x.temperatures, 1, 16) || x.temperatures.some((v) => v < 0 || v > 120))
      return err('需要 {"temperatures": [0–120 的整數...]}，長度 1–16', 'Expected {"temperatures": [ints 0–120]}, length 1–16');
    return null;
  },
  formatInput: (i) => `temperatures = [${i.temperatures.join(', ')}]`,

  init: ({ temperatures }) => ({ t: temperatures, i: 0, stack: [], res: temperatures.map(() => 0) }),
  isDone: (st) => st.i >= st.t.length,
  options: () => [
    { id: 'pop', label: L('結算頂端那天並彈出（pop）', 'Settle the top day and pop') },
    { id: 'push', label: L('今天放進堆疊，i 右移（push）', 'Push today, move i →') },
  ],
  correct: ({ t, i, stack }) => (stack.length > 0 && t[i] > t[stack[stack.length - 1]] ? ['pop'] : ['push']),
  apply(st, a) {
    if (a === 'pop') {
      const j = st.stack[st.stack.length - 1];
      const res = [...st.res];
      res[j] = st.i - j;
      return { ...st, stack: st.stack.slice(0, -1), res };
    }
    return { ...st, stack: [...st.stack, st.i], i: st.i + 1 };
  },
  explain({ t, i, stack }, a) {
    const j = stack[stack.length - 1];
    if (a === 'pop')
      return L(
        `今天（第 ${i} 天）${t[i]}° 比頂端第 ${j} 天的 ${t[j]}° 熱。第 ${j} 天等了 ${i - j} 天，記下 res[${j}] = ${i - j} 並彈出。`,
        `Today (day ${i}) at ${t[i]}° is warmer than day ${j} at ${t[j]}° on top. Day ${j} waited ${i - j} day(s): set res[${j}] = ${i - j} and pop.`,
      );
    if (stack.length === 0)
      return L(`堆疊是空的。把第 ${i} 天（${t[i]}°）放進去，等待更熱的一天。`, `The stack is empty. Push day ${i} (${t[i]}°) to wait for a warmer day.`);
    return L(
      `今天 ${t[i]}° 沒有比頂端的 ${t[j]}° 熱，不能結算。把今天放進堆疊（堆疊保持遞減）。`,
      `Today at ${t[i]}° is not warmer than ${t[j]}° on top, so nothing settles. Push today (the stack stays decreasing).`,
    );
  },
  whyWrong({ t, i, stack }, a) {
    const j = stack[stack.length - 1];
    if (a === 'pop')
      return stack.length === 0
        ? L('堆疊是空的，沒有東西可以彈出。', 'The stack is empty. There is nothing to pop.')
        : L(`今天 ${t[i]}° 沒有比頂端的 ${t[j]}° 熱，頂端那天還沒等到更熱的日子。`, `Today at ${t[i]}° is not warmer than ${t[j]}° on top. That day is still waiting.`);
    return L(`今天 ${t[i]}° 比頂端的 ${t[j]}° 熱！要先幫頂端那天結算，不然它會一直等下去。`, `Today at ${t[i]}° is warmer than ${t[j]}° on top! Settle that day first, or it will wait forever.`);
  },
  hints: ({ t, i, stack }) => [
    L('今天的溫度比堆疊頂端那天熱嗎？', "Is today's temperature warmer than the day on top of the stack?"),
    L(
      `今天 ${t[i]}°，頂端：${stack.length ? `第 ${stack[stack.length - 1]} 天 ${t[stack[stack.length - 1]]}°` : '（空）'}`,
      `Today ${t[i]}°, top: ${stack.length ? `day ${stack[stack.length - 1]} at ${t[stack[stack.length - 1]]}°` : '(empty)'}`,
    ),
  ],
  scene({ t, i, stack, res }) {
    const marks: Record<number, 'focus' | 'done'> = {};
    for (const j of stack) marks[j] = 'done';
    if (i < t.length) marks[i] = 'focus';
    return [
      {
        kind: 'array',
        id: 't',
        label: L('temperatures', 'temperatures'),
        values: t,
        bars: true,
        pointers: [{ name: 'i', index: i, color: 'a' }],
        marks,
      },
      { kind: 'stack', id: 'stack', label: L('stack（溫度 @ 第幾天）', 'stack (temp @ day)'), items: stack.map((j) => `${t[j]} @ ${j}`) },
      { kind: 'array', id: 'res', label: L('res', 'res'), values: res },
    ];
  },
  result: (st) => L(`res = [${st.res.join(', ')}]`, `res = [${st.res.join(', ')}]`),
  code: `def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
    res = [0] * len(temperatures)
    stack = []  # pair: (temp, index)
    for i, t in enumerate(temperatures):
        while stack and t > stack[-1][0]:
            stackT, stackInd = stack.pop()
            res[stackInd] = i - stackInd
        stack.append((t, i))
    return res`,
  lineOf: { init: 2, pop: 7, push: 8 },
  answer: (st) => st.res,
  verify({ temperatures: t }, ans) {
    const exp = t.map((v, i) => {
      for (let j = i + 1; j < t.length; j++) if (t[j] > v) return j - i;
      return 0;
    });
    return JSON.stringify(ans) === JSON.stringify(exp);
  },
};
