import { randInt } from '../core/engine';
import { L, TAP, type CellMark, type DragMove, type Layer, type Problem } from '../core/types';
import { err, isObj } from './helpers';
import { sortedDistinct } from './binarySearch';

type I = { matrix: number[][]; target: number };
/** Binary search over the matrix flattened row by row: index k = row * cols + col. */
type S = { flat: number[]; cols: number; target: number; l: number; r: number; done: boolean; ans: boolean | null };

const mid = (l: number, r: number) => Math.floor((l + r) / 2);
const cellId = (k: number, cols: number) => `r${Math.floor(k / cols)}:${k % cols}`;
const idOf = (id: string, cols: number) => {
  const [row, col] = id.slice(1).split(':').map(Number);
  return row * cols + col;
};

export const searchMatrix: Problem<I, S> = {
  id: 'search-a-2d-matrix',
  number: 74,
  category: 'binary-search',
  difficulty: 'Medium',
  title: L('搜尋二維矩陣', 'Search a 2D Matrix'),
  description: L(
    '矩陣每一列由小到大，而且每一列的第一個數都比上一列的最後一個數大。判斷 target 在不在矩陣裡。',
    'Each row is sorted and each row starts above the previous row\'s last value. Decide whether target is in the matrix.',
  ),
  insight: L(
    '把矩陣一列接一列「攤平」，它就是一條排好序的陣列。對攤平後的索引 k 做二分搜尋，再用 row = k // cols、col = k % cols 換回矩陣位置。',
    'Read the matrix row after row and it is one sorted array. Binary search the flattened index k, converting back with row = k // cols and col = k % cols.',
  ),
  complexity: {
    time: 'O(log(m·n))',
    space: 'O(1)',
    why: L(
      '在 m·n 個數上做一次二分搜尋，每一步砍半。換算 row、col 只是除法和取餘數。逐格掃描是 O(m·n)；先找列再找行也是 O(log m + log n)，一樣快。',
      'One binary search over m·n values, halving each step; row/col is just division and modulo. A full scan is O(m·n); searching the row then the column is O(log m + log n), equally fast.',
    ),
  },
  examples: [
    { matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target: 3 },
    { matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target: 13 },
    { matrix: [[2, 4], [6, 8], [10, 12], [14, 16]], target: 14 },
  ],
  random() {
    const rows = randInt(2, 4);
    const cols = randInt(2, 4);
    const flat = sortedDistinct(rows * cols, 0, 60);
    const target = Math.random() < 0.6 ? flat[randInt(0, flat.length - 1)] : randInt(0, 60);
    return { matrix: Array.from({ length: rows }, (_, i) => flat.slice(i * cols, (i + 1) * cols)), target };
  },
  validate(x) {
    if (!isObj(x) || !Array.isArray(x.matrix) || x.matrix.length < 1 || x.matrix.length > 5 || typeof x.target !== 'number')
      return err('需要 {"matrix": [[...], ...], "target": 整數}，1–5 列', 'Expected {"matrix": [[...], ...], "target": int}, 1–5 rows');
    const rows = x.matrix as unknown[];
    const cols = Array.isArray(rows[0]) ? (rows[0] as unknown[]).length : 0;
    if (cols < 1 || cols > 5 || !rows.every((r) => Array.isArray(r) && r.length === cols && r.every((v) => Number.isInteger(v))))
      return err('每一列長度要相同（1–5），都是整數', 'Rows must have equal length (1–5) of integers');
    const flat = (rows as number[][]).flat();
    if (!flat.every((v, i) => i === 0 || flat[i - 1] < v)) return err('攤平後必須嚴格遞增', 'Flattened values must be strictly increasing');
    return null;
  },
  formatInput: (i) => `matrix = ${JSON.stringify(i.matrix)}, target = ${i.target}`,

  init: ({ matrix, target }) => {
    const flat = matrix.flat();
    return { flat, cols: matrix[0].length, target, l: 0, r: flat.length - 1, done: false, ans: null };
  },
  isDone: (st) => st.done,
  options: () => [
    { id: 'goLeft', label: L('往左找：R = M - 1', 'Go left: R = M - 1') },
    { id: 'goRight', label: L('往右找：L = M + 1', 'Go right: L = M + 1') },
    { id: 'found', label: L('回傳 True', 'Return True') },
    { id: 'notFound', label: L('回傳 False', 'Return False') },
  ],
  correct({ flat, target, l, r }) {
    if (l > r) return ['notFound'];
    const v = flat[mid(l, r)];
    return v === target ? ['found'] : v < target ? ['goRight'] : ['goLeft'];
  },
  apply(st, a) {
    const m = mid(st.l, st.r);
    if (a === 'goLeft') return { ...st, r: m - 1 };
    if (a === 'goRight') return { ...st, l: m + 1 };
    return { ...st, done: true, ans: a === 'found' };
  },
  explain({ flat, cols, target, l, r }, a) {
    const m = mid(l, r);
    const pos = `(${Math.floor(m / cols)}, ${m % cols})`;
    if (a === 'goRight') return L(`M = ${m} → 位置 ${pos} 的值 ${flat[m]} < ${target}，丟掉 M 和它前面的，L = M + 1。`, `M = ${m} → cell ${pos} = ${flat[m]} < ${target}. Drop M and everything before it: L = M + 1.`);
    if (a === 'goLeft') return L(`M = ${m} → 位置 ${pos} 的值 ${flat[m]} > ${target}，丟掉 M 和它後面的，R = M - 1。`, `M = ${m} → cell ${pos} = ${flat[m]} > ${target}. Drop M and everything after it: R = M - 1.`);
    if (a === 'found') return L(`位置 ${pos} 的值就是 ${target}，回傳 True。`, `Cell ${pos} is ${target}. Return True.`);
    return L('L > R，範圍空了，target 不在矩陣裡，回傳 False。', 'L > R: the range is empty, so target is not in the matrix. Return False.');
  },
  whyWrong({ flat, target, l, r }, a) {
    if (l > r) return L('L > R，範圍已經空了。', 'L > R: the range is already empty.');
    if (a === 'notFound') return L('範圍還沒空，還要繼續找。', 'The range is not empty yet.');
    const v = flat[mid(l, r)];
    if (v === target) return L(`M 的值 ${v} 就是 target！`, `The value at M, ${v}, is the target!`);
    if (a === 'found') return L(`${v} ≠ ${target}。`, `${v} ≠ ${target}.`);
    if (a === 'goLeft') return L(`M 的值 ${v} 比 target 小，它前面的都更小，答案只可能在後半。`, `M's value ${v} is below target; everything before it is smaller. The answer can only be after M.`);
    return L(`M 的值 ${v} 比 target 大，它後面的都更大，答案只可能在前半。`, `M's value ${v} is above target; everything after it is bigger. The answer can only be before M.`);
  },
  hints: ({ flat, cols, target, l, r }) => [
    L('把矩陣想成一條攤平的陣列，比較中間 M 的值和 target。', 'Think of the matrix as one flat array and compare the middle M with target.'),
    l > r ? L(`L = ${l} > R = ${r}。`, `L = ${l} > R = ${r}.`) : L(`M = ${mid(l, r)}（第 ${Math.floor(mid(l, r) / cols)} 列），值 ${flat[mid(l, r)]}，target = ${target}。`, `M = ${mid(l, r)} (row ${Math.floor(mid(l, r) / cols)}), value ${flat[mid(l, r)]}, target = ${target}.`),
  ],
  scene(st): Layer[] {
    const { flat, cols, target, l, r, done, ans } = st;
    const m = mid(l, r);
    const rows = flat.length / cols;
    const layers: Layer[] = [];
    for (let row = 0; row < rows; row++) {
      const marks: Record<number, CellMark> = {};
      const pointers: { name: string; index: number; color: 'a' | 'b' | 'c' }[] = [];
      for (let c = 0; c < cols; c++) {
        const k = row * cols + c;
        if (k < l || k > r) marks[c] = 'gone';
        if (!done && l <= r) {
          if (k === l) pointers.push({ name: 'L', index: c, color: 'a' });
          if (k === r) pointers.push({ name: 'R', index: c, color: 'b' });
          if (k === m) pointers.push({ name: 'M', index: c, color: 'c' });
        }
      }
      if (done && ans) flat.forEach((v, k) => v === target && Math.floor(k / cols) === row && (marks[k % cols] = 'good'));
      else if (!done && l <= r && Math.floor(m / cols) === row) marks[m % cols] = 'focus';
      layers.push({
        kind: 'array',
        id: `row${row}`,
        label: L(`第 ${row} 列（索引 ${row * cols}–${row * cols + cols - 1}）`, `row ${row} (index ${row * cols}–${row * cols + cols - 1})`),
        values: flat.slice(row * cols, row * cols + cols),
        pointers,
        marks,
        dragPrefix: `r${row}`,
        dragMask: Array.from({ length: cols }, (_, c) => !done && row * cols + c >= l && row * cols + c <= r),
      });
    }
    layers.push(
      { kind: 'vars', id: 'v', vars: [{ name: 'M', value: l <= r ? m : '—' }, { name: 'matrix[M]', value: l <= r ? flat[m] : '—', highlight: true }, { name: 'target', value: target }] },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'dropLeft', label: L('🗑️⬅ 丟掉前半（L … M）', '🗑️⬅ Discard first half (L … M)'), tone: 'trash' },
          { id: 'dropRight', label: L('丟掉後半（M … R）➡🗑️', 'Discard second half (M … R) ➡🗑️'), tone: 'trash' },
          { id: 'found', label: L('🎯 找到了', '🎯 Found'), tone: 'good' },
          { id: 'none', label: L('✗ 範圍空了', '✗ Range is empty'), tone: 'bad' },
        ],
      },
    );
    return layers;
  },
  drag: {
    instructions: L(
      '把矩陣當成一條攤平的陣列：比較 M 的值和 target，抓住不可能的那一半裡任一格拖進對應的 🗑️。M 就是 target 就拖到 🎯；範圍空了點 ✗。',
      "Treat the matrix as one flat array: compare M with target and drag any cell of the impossible half into its 🗑️. If M is target, drag it to 🎯; if the range is empty, tap ✗.",
    ),
    tapZones: ['none'],
    moves(st) {
      const { flat, cols, target, l, r } = st;
      if (l > r) return [{ action: 'notFound', from: TAP, to: 'none' }];
      const m = mid(l, r);
      if (flat[m] === target) return [{ action: 'found', from: cellId(m, cols), to: 'found' }];
      const out: DragMove[] = [];
      if (flat[m] < target) for (let k = l; k <= m; k++) out.push({ action: 'goRight', from: cellId(k, cols), to: 'dropLeft' });
      else for (let k = m; k <= r; k++) out.push({ action: 'goLeft', from: cellId(k, cols), to: 'dropRight' });
      return out;
    },
    whyWrong(st, from, to) {
      const { flat, cols, l, r } = st;
      if (l > r || from === TAP || to === 'none') return searchMatrix.whyWrong(st, 'notFound') ?? L('這一步不對。', 'Not quite.');
      const m = mid(l, r);
      const k = idOf(from, cols);
      if (to === 'found') return k !== m ? L(`要比對的是 M 的值 ${flat[m]}。`, `Check the value at M, ${flat[m]}.`) : (searchMatrix.whyWrong(st, 'found') ?? L('', ''));
      const act = to === 'dropLeft' ? 'goRight' : 'goLeft';
      const wrongSide = searchMatrix.correct(st)[0] !== act;
      if (wrongSide) return searchMatrix.whyWrong(st, act) ?? L('這一步不對。', 'Not quite.');
      return to === 'dropLeft' ? L(`${flat[k]} 在 M 後面，不屬於前半。`, `${flat[k]} is after M, not in the first half.`) : L(`${flat[k]} 在 M 前面，不屬於後半。`, `${flat[k]} is before M, not in the second half.`);
    },
  },
  result: (st) => L(`回傳 ${st.ans ? 'True' : 'False'}`, `Returned ${st.ans ? 'True' : 'False'}`),
  code: `def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
    ROWS, COLS = len(matrix), len(matrix[0])
    l, r = 0, ROWS * COLS - 1
    while l <= r:
        m = (l + r) // 2
        row, col = m // COLS, m % COLS
        if matrix[row][col] > target:
            r = m - 1
        elif matrix[row][col] < target:
            l = m + 1
        else:
            return True
    return False`,
  lineOf: { init: 3, goLeft: 8, goRight: 10, found: 12, notFound: 13 },
  answer: (st) => st.ans,
  verify: ({ matrix, target }, ans) => ans === matrix.flat().includes(target),
};
