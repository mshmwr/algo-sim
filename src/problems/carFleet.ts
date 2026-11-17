import { randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';

type I = { target: number; position: number[]; speed: number[] };
/** cars sorted by position, closest to target first; i = next car; fleets = arrival times of fleet leaders. */
type S = { target: number; cars: { p: number; s: number; t: number }[]; i: number; fleets: number[] };

const fmt = (t: number) => (Number.isInteger(t) ? String(t) : t.toFixed(2).replace(/0+$/, ''));
const top = (a: number[]) => a[a.length - 1];

export const carFleet: Problem<I, S> = {
  id: 'car-fleet',
  number: 853,
  category: 'stack',
  difficulty: 'Medium',
  title: L('車隊', 'Car Fleet'),
  description: L(
    '單線道上的車都開往 target，不能超車：追上前車就只能跟著前車的速度，變成同一個車隊。問最後有幾個車隊抵達終點。',
    'Cars drive toward target on a one-lane road and cannot pass: a car that catches up joins the car ahead as one fleet. How many fleets arrive?',
  ),
  insight: L(
    '算出每台車「自己開到終點要幾小時」。從最靠近終點的車開始看：如果一台車的時間 ≤ 前面車隊的時間，它會在終點前追上，併入前面的車隊；否則它追不上，自己是一個新車隊。',
    "Compute each car's solo time to reach target. Go from the car closest to target: if a car's time ≤ the fleet ahead's time, it catches up before the end and merges; otherwise it can't catch up and starts a new fleet.",
  ),
  complexity: {
    time: 'O(n log n)',
    space: 'O(n)',
    why: L(
      '主要成本是依位置排序 O(n log n)；之後每台車只處理一次。堆疊最多存 n 個車隊。暴力模擬每個時間點的車輛位置會更慢也更難處理小數時間。',
      'Sorting by position dominates at O(n log n); afterwards each car is handled once. The stack holds up to n fleets. Simulating positions over time is slower and awkward with fractional times.',
    ),
  },
  examples: [
    { target: 12, position: [10, 8, 0, 5, 3], speed: [2, 4, 1, 1, 3] },
    { target: 10, position: [3], speed: [3] },
    { target: 100, position: [0, 2, 4], speed: [4, 2, 1] },
  ],
  random() {
    const target = randInt(10, 16);
    const n = randInt(4, 6);
    const ps = new Set<number>();
    while (ps.size < n) ps.add(randInt(0, target - 1));
    const position = [...ps];
    return { target, position, speed: position.map(() => randInt(1, 4)) };
  },
  validate(x) {
    if (!isObj(x) || typeof x.target !== 'number' || !isIntArray(x.position, 1, 12) || !isIntArray(x.speed, 1, 12) || x.position.length !== x.speed.length)
      return err('需要 {"target": 整數, "position": [...], "speed": [...]}，長度相同、1–12', 'Expected {"target": int, "position": [...], "speed": [...]} of equal length 1–12');
    if (new Set(x.position).size !== x.position.length) return err('位置不能重複', 'Positions must be distinct');
    if (x.position.some((p) => p < 0 || p >= (x.target as number)) || x.speed.some((s) => s <= 0)) return err('位置要在 0 到 target 之間，速度要 > 0', 'Positions must be in [0, target) and speeds > 0');
    return null;
  },
  formatInput: (i) => `target = ${i.target}, position = [${i.position.join(', ')}], speed = [${i.speed.join(', ')}]`,

  init({ target, position, speed }) {
    const cars = position.map((p, k) => ({ p, s: speed[k], t: (target - p) / speed[k] })).sort((a, b) => b.p - a.p);
    return { target, cars, i: 0, fleets: [] };
  },
  isDone: (st) => st.i >= st.cars.length,
  options: () => [
    { id: 'push', label: L('自成新車隊', 'Start a new fleet') },
    { id: 'merge', label: L('併入前面的車隊', 'Join the fleet ahead') },
  ],
  correct: ({ cars, i, fleets }) => (fleets.length && cars[i].t <= top(fleets) ? ['merge'] : ['push']),
  apply: (st, act) => ({ ...st, i: st.i + 1, fleets: act === 'push' ? [...st.fleets, st.cars[st.i].t] : st.fleets }),
  explain({ cars, i, fleets }, act) {
    const c = cars[i];
    if (act === 'merge')
      return L(
        `位置 ${c.p} 的車自己要 ${fmt(c.t)} 小時，比前面車隊的 ${fmt(top(fleets))} 小時快（或一樣），會在終點前追上，併入前面的車隊。`,
        `The car at ${c.p} needs ${fmt(c.t)} h alone, no slower than the fleet ahead (${fmt(top(fleets))} h), so it catches up and joins that fleet.`,
      );
    return fleets.length
      ? L(`位置 ${c.p} 的車要 ${fmt(c.t)} 小時，比前面車隊的 ${fmt(top(fleets))} 小時慢，追不上，自成一個新車隊。`, `The car at ${c.p} needs ${fmt(c.t)} h, slower than the fleet ahead (${fmt(top(fleets))} h). It can't catch up: a new fleet.`)
      : L(`位置 ${c.p} 是最靠近終點的車，前面沒有車，它是第一個車隊（${fmt(c.t)} 小時）。`, `The car at ${c.p} is closest to target with nothing ahead: the first fleet (${fmt(c.t)} h).`);
  },
  whyWrong({ cars, i, fleets }, act) {
    const c = cars[i];
    if (act === 'merge')
      return fleets.length
        ? L(`這台車要 ${fmt(c.t)} 小時，比前面車隊的 ${fmt(top(fleets))} 小時慢，到終點前追不上。`, `This car needs ${fmt(c.t)} h, slower than the fleet ahead (${fmt(top(fleets))} h); it won't catch up before the end.`)
        : L('前面沒有車隊可以併入。', 'There is no fleet ahead to join.');
    return L(
      `這台車只要 ${fmt(c.t)} 小時，前面車隊要 ${fmt(top(fleets))} 小時：它會在終點前追上，被迫跟著前車，變成同一個車隊。`,
      `This car needs only ${fmt(c.t)} h while the fleet ahead needs ${fmt(top(fleets))} h: it catches up before the end and becomes part of that fleet.`,
    );
  },
  hints: ({ cars, i, fleets }) => [
    L('比較這台車自己開到終點的時間，和前面車隊（stack 頂端）的時間。', "Compare this car's solo time with the fleet ahead (stack top)."),
    L(`這台車 ${fmt(cars[i].t)} 小時，前面車隊 ${fleets.length ? fmt(top(fleets)) + ' 小時' : '（沒有）'}。`, `This car ${fmt(cars[i].t)} h, fleet ahead ${fleets.length ? fmt(top(fleets)) + ' h' : '(none)'}.`),
  ],
  scene({ target, cars, i, fleets }) {
    const done = i >= cars.length;
    const marks: Record<number, CellMark> = {};
    cars.forEach((_, k) => {
      if (k < i) marks[k] = 'done';
    });
    if (!done) marks[i] = 'focus';
    return [
      {
        kind: 'array',
        id: 'pos',
        label: L(`車的位置（依離終點 ${target} 由近到遠排序）`, `car positions (sorted closest to target ${target} first)`),
        values: cars.map((c) => c.p),
        marks,
      },
      { kind: 'array', id: 'spd', label: L('速度', 'speed'), values: cars.map((c) => c.s), marks },
      {
        kind: 'array',
        id: 'time',
        label: L('自己開到終點要幾小時（拖這一列）', 'solo hours to target (drag these)'),
        values: cars.map((c) => fmt(c.t)),
        pointers: done ? [] : [{ name: 'car', index: i, color: 'a' }],
        marks,
        dragPrefix: done ? undefined : 't',
        dragMask: cars.map((_, k) => k >= i),
      },
      {
        kind: 'stack',
        id: 'fleets',
        label: L('stack（每個車隊的到達時間）', 'stack (arrival time of each fleet)'),
        items: fleets.map(fmt),
        itemDropPrefix: done ? undefined : 'f',
      },
      { kind: 'vars', id: 'v', vars: [{ name: 'fleets', value: fleets.length, highlight: true }] },
      { kind: 'zones', id: 'zones', zones: [{ id: 'stack', label: L('🆕 自成新車隊（push）', '🆕 New fleet (push)'), tone: 'info' }] },
    ];
  },
  drag: {
    instructions: L(
      '從最靠近終點的車開始：追得上前面的車隊（時間 ≤ stack 頂端），就把它的時間拖到頂端那塊上面併入；追不上，就拖到「🆕 自成新車隊」。',
      "Start from the car closest to target: if it can catch the fleet ahead (time ≤ stack top), drop its time on the top tile to merge; otherwise drop it on \"🆕 New fleet\".",
    ),
    moves(st) {
      const [a] = carFleet.correct(st);
      return a === 'merge' ? [{ action: a, from: `t:${st.i}`, to: `f:${st.fleets.length - 1}` }] : [{ action: a, from: `t:${st.i}`, to: 'stack' }];
    },
    whyWrong(st, from, to) {
      const k = Number(from.split(':')[1]);
      if (k !== st.i) return L(`要從最靠近終點的車開始，一台一台處理。現在是位置 ${st.cars[st.i].p} 的車。`, `Go one car at a time from the closest to target. It's the car at ${st.cars[st.i].p} now.`);
      if (to.startsWith('f:') && Number(to.split(':')[1]) !== st.fleets.length - 1) return L('只能併入正前方的車隊（stack 頂端）。', 'A car can only join the fleet directly ahead (the stack top).');
      return carFleet.whyWrong(st, to === 'stack' ? 'push' : 'merge') ?? L('這一步不對。', 'Not quite.');
    },
  },
  result: (st) => L(`共 ${st.fleets.length} 個車隊`, `${st.fleets.length} fleet(s)`),
  code: `def carFleet(self, target: int, position: List[int], speed: List[int]) -> int:
    pair = sorted(zip(position, speed), reverse=True)
    stack = []  # arrival time of each fleet
    for p, s in pair:
        t = (target - p) / s
        if stack and t <= stack[-1]:
            continue  # catches up: joins the fleet ahead
        stack.append(t)
    return len(stack)`,
  lineOf: { init: 2, merge: 7, push: 8 },
  answer: (st) => st.fleets.length,
  verify({ target, position, speed }, ans) {
    const cars = position.map((p, k) => [p, (target - p) / speed[k]] as const).sort((a, b) => b[0] - a[0]);
    let count = 0;
    let slowest = -Infinity;
    for (const [, t] of cars) if (t > slowest) {
      count++;
      slowest = t;
    }
    return ans === count;
  },
};
