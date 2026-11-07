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
    for (let k = 0; k < Math.min(i, t.length); k++) marks[k] = 'done';
    if (i < t.length) marks[i] = 'focus';
    return [
      {
        kind: 'array',
        id: 't',
        label: L('temperatures（每一塊都可以拖曳）', 'temperatures (every tile can be dragged)'),
        values: t,
        bars: true,
        pointers: [{ name: 'i', index: i, color: 'a' }],
        marks,
        dragPrefix: 't',
        dragLabels: t.map((v) => `${v}°`),
      },
      {
        kind: 'stack',
        id: 'stack',
        label: L('stack', 'stack'),
        items: stack.map((j) => `${t[j]}°`),
        itemSub: stack.map((j) => L(`第 ${j} 天`, `day ${j}`)),
        dragPrefix: 's',
        dropId: 'stack',
      },
      { kind: 'array', id: 'res', label: L('res（要等幾天）', 'res (days to wait)'), values: res, dropPrefix: 'res' },
    ];
  },
  drag: {
    instructions: L(
      '把「今天」的溫度拖進 stack；或把 stack 頂端那塊拖到 res 裡「那一天」的格子結算。也可以先點方塊，再點目的地。',
      "Drag today's temperature into the stack, or drag the stack's top tile onto that day's res cell to settle it. You can also tap a tile, then tap its destination.",
    ),
    moves({ t, i, stack }) {
      const top = stack[stack.length - 1];
      if (stack.length > 0 && t[i] > t[top]) return [{ action: 'pop', from: `s:${stack.length - 1}`, to: `res:${top}` }];
      return [{ action: 'push', from: `t:${i}`, to: 'stack' }];
    },
    whyWrong({ t, i, stack }, from, to) {
      const [kind, idxS] = from.split(':');
      const idx = Number(idxS);
      const topPos = stack.length - 1;
      const top = stack[topPos];
      const needPop = stack.length > 0 && t[i] > t[top];
      if (kind === 't') {
        if (idx < i)
          return L(`第 ${idx} 天（${t[idx]}°）已經處理過了。現在輪到第 ${i} 天（${t[i]}°）。`, `Day ${idx} (${t[idx]}°) was already handled. It's day ${i} (${t[i]}°) now.`);
        if (idx > i)
          return L(`還沒輪到第 ${idx} 天。我們由左往右一天一天看，現在是第 ${i} 天（${t[i]}°）。`, `Day ${idx} hasn't come yet. We scan left to right, and it's day ${i} (${t[i]}°) now.`);
        if (needPop)
          return L(
            `今天 ${t[i]}° 比頂端第 ${top} 天的 ${t[top]}° 熱！先幫頂端那天結算：把頂端那塊拖到 res[${top}]。`,
            `Today at ${t[i]}° is warmer than day ${top} at ${t[top]}° on top! Settle that day first: drag the top tile onto res[${top}].`,
          );
        return L(
          'res 記錄的是「某一天等了幾天」。今天才剛開始等，要先放進 stack。',
          'res records how long a day waited. Today has only just started waiting, so it goes into the stack.',
        );
      }
      // dragging a stack tile
      if (idx !== topPos) return L('只能拿 stack 最上面那一塊。', 'You can only take the tile on top of the stack.');
      if (!needPop)
        return L(
          `今天 ${t[i]}° 沒有比頂端的 ${t[top]}° 熱，頂端那天還要繼續等，現在不能結算。`,
          `Today at ${t[i]}° is not warmer than ${t[top]}° on top. That day keeps waiting, so it can't be settled yet.`,
        );
      if (to === 'stack')
        return L(`頂端那天等到更熱的日子了，要把它拖到 res[${top}] 結算。`, `The top day found a warmer day. Drag it onto res[${top}] to settle it.`);
      const k = Number(to.split(':')[1]);
      return L(
        `這塊是第 ${top} 天的溫度，結果要寫在 res[${top}]，不是 res[${k}]。`,
        `This tile is day ${top}'s temperature, so its answer goes in res[${top}], not res[${k}].`,
      );
    },
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
