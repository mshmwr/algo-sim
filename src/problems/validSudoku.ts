import { pick, randInt } from '../core/engine';
import { L, TAP, type CellMark, type Layer, type Problem } from '../core/types';
import { err, isObj } from './helpers';

type I = { board: string[] };
/** cells = filled positions in row-major order; c = next one to check. */
type S = { board: string[]; cells: [number, number][]; c: number; done: boolean; result: boolean | null; bad: [number, number] | null };

const boxOf = (r: number, c: number) => Math.floor(r / 3) * 3 + Math.floor(c / 3);
/** Which earlier filled cell (if any) conflicts with cell k, and why. */
function conflict(st: S, k: number): { with: [number, number]; kind: 'row' | 'col' | 'box' } | null {
  const [r, c] = st.cells[k];
  const v = st.board[r][c];
  for (let x = 0; x < k; x++) {
    const [r2, c2] = st.cells[x];
    if (st.board[r2][c2] !== v) continue;
    if (r2 === r) return { with: [r2, c2], kind: 'row' };
    if (c2 === c) return { with: [r2, c2], kind: 'col' };
    if (boxOf(r2, c2) === boxOf(r, c)) return { with: [r2, c2], kind: 'box' };
  }
  return null;
}
const KIND = { row: L('同一列', 'the same row'), col: L('同一行', 'the same column'), box: L('同一個 3×3 宮', 'the same 3×3 box') };

const SOLVED = ['534678912', '672195348', '198342567', '859761423', '426853791', '713924856', '961537284', '287419635', '345286179'];

export const validSudoku: Problem<I, S> = {
  id: 'valid-sudoku',
  number: 36,
  category: 'arrays-hashing',
  difficulty: 'Medium',
  title: L('有效的數獨', 'Valid Sudoku'),
  description: L('檢查目前填了一部分的 9×9 數獨盤面是否合法：每一列、每一行、每個 3×3 宮裡的數字都不能重複（空格不用管）。', 'Check whether a partly filled 9×9 Sudoku board is valid: no digit repeats within a row, a column, or a 3×3 box (ignore blanks).'),
  insight: L(
    '開 27 個 set：9 列、9 行、9 宮各一個。宮的編號 = (列 // 3) × 3 + (行 // 3)。逐格檢查填了的數字：如果它已經在自己那一列、那一行或那一宮的 set 裡，就不合法；否則三個 set 都加進去。',
    'Use 27 sets: one per row, column and box. Box index = (row // 3) × 3 + (col // 3). For each filled digit, if it is already in its row, column or box set, the board is invalid; otherwise add it to all three.',
  ),
  complexity: {
    time: 'O(81) = O(1)',
    space: 'O(81) = O(1)',
    why: L('盤面固定 9×9，每格查三個 set、各 O(1)。如果是 n×n 的盤面，就是 O(n²)。分別檢查每列、每行、每宮也一樣是 O(n²)，只是要掃三遍。', 'The board is fixed at 9×9 and each cell does three O(1) lookups. For an n×n board this is O(n²). Checking rows, columns and boxes separately is also O(n²), just three passes.'),
  },
  examples: [
    { board: ['53..7....', '6..195...', '.98....6.', '8...6...3', '4..8.3..1', '7...2...6', '.6....28.', '...419..5', '....8..79'] },
    { board: ['83..7....', '6..195...', '.98....6.', '8...6...3', '4..8.3..1', '7...2...6', '.6....28.', '...419..5', '....8..79'] },
    { board: ['.........', '..5...3..', '.........', '.........', '...5.....', '.........', '..3......', '.........', '.........'] },
  ],
  random() {
    const board = SOLVED.map((row) => [...row].map((ch) => (Math.random() < 0.22 ? ch : '.')).join(''));
    if (Math.random() < 0.5) {
      const r = randInt(0, 8);
      const c = randInt(0, 8);
      const row = [...board[r]];
      row[c] = pick([...'123456789']);
      board[r] = row.join('');
    }
    return { board };
  },
  validate(x) {
    if (!isObj(x) || !Array.isArray(x.board) || x.board.length !== 9 || !x.board.every((r) => typeof r === 'string' && /^[1-9.]{9}$/.test(r)))
      return err('需要 {"board": 9 個長度 9 的字串，用 1–9 和 . }', 'Expected {"board": 9 strings of length 9 using 1–9 and .}');
    return null;
  },
  formatInput: (i) => `board = [${i.board.map((r) => JSON.stringify(r)).join(', ')}]`,

  init({ board }) {
    const cells: [number, number][] = [];
    board.forEach((row, r) => [...row].forEach((ch, c) => ch !== '.' && cells.push([r, c])));
    return { board, cells, c: 0, done: false, result: null, bad: null };
  },
  isDone: (st) => st.done,
  options: () => [
    { id: 'ok', label: L('沒衝突，記錄', 'No conflict: record') },
    { id: 'false', label: L('有衝突，回傳 False', 'Conflict: return False') },
    { id: 'true', label: L('全部合法，回傳 True', 'All valid: return True') },
  ],
  correct: (st) => (st.c >= st.cells.length ? ['true'] : conflict(st, st.c) ? ['false'] : ['ok']),
  apply(st, a) {
    if (a === 'ok') return { ...st, c: st.c + 1 };
    if (a === 'true') return { ...st, done: true, result: true };
    return { ...st, done: true, result: false, bad: conflict(st, st.c)?.with ?? null };
  },
  explain(st, a) {
    if (a === 'true') return L('每個填了的數字都檢查過，沒有重複，盤面合法。', 'Every filled digit is checked with no repeats: the board is valid.');
    const [r, c] = st.cells[st.c];
    const v = st.board[r][c];
    if (a === 'ok') return L(`(${r}, ${c}) 的 ${v}：第 ${r} 列、第 ${c} 行、第 ${boxOf(r, c)} 宮都還沒有 ${v}，記錄到三個 set。`, `${v} at (${r}, ${c}): row ${r}, column ${c} and box ${boxOf(r, c)} have no ${v} yet. Record it in all three sets.`);
    const cf = conflict(st, st.c)!;
    return L(`(${r}, ${c}) 的 ${v} 和 (${cf.with[0]}, ${cf.with[1]}) 的 ${v} 在${KIND[cf.kind].zh}，重複了！回傳 False。`, `${v} at (${r}, ${c}) repeats the ${v} at (${cf.with[0]}, ${cf.with[1]}) in ${KIND[cf.kind].en}. Return False.`);
  },
  whyWrong(st, a) {
    if (st.c >= st.cells.length) return L('全部都檢查完了，沒有重複。', 'Everything is checked with no repeats.');
    if (a === 'true') return L('還有數字沒檢查。', 'Some digits are still unchecked.');
    const [r, c] = st.cells[st.c];
    const v = st.board[r][c];
    const cf = conflict(st, st.c);
    if (cf) return L(`(${cf.with[0]}, ${cf.with[1]}) 已經有 ${v}，在${KIND[cf.kind].zh}。`, `(${cf.with[0]}, ${cf.with[1]}) already holds ${v} in ${KIND[cf.kind].en}.`);
    return L(`第 ${r} 列、第 ${c} 行、第 ${boxOf(r, c)} 宮都還沒有 ${v}。`, `Row ${r}, column ${c} and box ${boxOf(r, c)} don't have ${v} yet.`);
  },
  hints(st) {
    if (st.c >= st.cells.length) return [L('還有沒檢查的數字嗎？', 'Any digit left to check?'), L('沒有了。', 'None.')];
    const [r, c] = st.cells[st.c];
    return [L('看這個數字所在的列、行、3×3 宮，有沒有同樣的數字已經出現過。', 'Check its row, column and 3×3 box for the same digit already seen.'), L(`(${r}, ${c}) = ${st.board[r][c]}，第 ${boxOf(r, c)} 宮。`, `(${r}, ${c}) = ${st.board[r][c]}, box ${boxOf(r, c)}.`)];
  },
  scene(st): Layer[] {
    const { board, cells, c, done, bad } = st;
    const cur = c < cells.length ? cells[c] : null;
    const layers: Layer[] = board.map((row, r) => {
      const marks: Record<number, CellMark> = {};
      [...row].forEach((ch, col) => {
        if (ch === '.') return;
        const k = cells.findIndex(([rr, cc]) => rr === r && cc === col);
        if (k < c) marks[col] = 'done';
      });
      if (cur && cur[0] === r) marks[cur[1]] = done ? 'bad' : 'focus';
      if (bad && bad[0] === r) marks[bad[1]] = 'bad';
      return {
        kind: 'array',
        id: `row${r}`,
        label: L(r === 0 ? '盤面（灰色 = 已檢查）' : '', r === 0 ? 'board (grey = checked)' : ''),
        values: [...row].map((ch) => (ch === '.' ? '' : ch)),
        marks,
        compact: true,
        sepEvery: 3,
        gapBefore: r > 0 && r % 3 === 0,
        dragPrefix: `r${r}`,
        dragMask: [...row].map((_, col) => !done && !!cur && cur[0] === r && cur[1] === col),
      };
    });
    layers.push({
      kind: 'zones',
      id: 'zones',
      zones: [
        { id: 'ok', label: L('✓ 沒衝突，記錄', '✓ No conflict: record'), tone: 'info' },
        { id: 'no', label: L('✗ 有衝突（False）', '✗ Conflict (False)'), tone: 'bad' },
        { id: 'yes', label: L('🏁 全部合法（True）', '🏁 All valid (True)'), tone: 'good' },
      ],
    });
    return layers;
  },
  drag: {
    instructions: L('逐格檢查發亮的數字：它所在的列、行、3×3 宮都沒有重複，就拖到 ✓ 記錄；有重複就拖到 ✗。全部檢查完點 🏁。', 'Check the highlighted digit: if its row, column and 3×3 box have no repeat, drag it to ✓; otherwise to ✗. When all are checked, tap 🏁.'),
    tapZones: ['yes'],
    moves(st) {
      const [a] = validSudoku.correct(st);
      if (a === 'true') return [{ action: a, from: TAP, to: 'yes' }];
      const [r, c] = st.cells[st.c];
      return [{ action: a, from: `r${r}:${c}`, to: a === 'ok' ? 'ok' : 'no' }];
    },
    whyWrong: (st, _from, to) => validSudoku.whyWrong(st, to === 'ok' ? 'ok' : to === 'no' ? 'false' : 'true') ?? L('這一步不對。', 'Not quite.'),
  },
  result: (st) => L(`回傳 ${st.result ? 'True' : 'False'}`, `Returned ${st.result ? 'True' : 'False'}`),
  code: `def isValidSudoku(self, board: List[List[str]]) -> bool:
    rows, cols, boxes = defaultdict(set), defaultdict(set), defaultdict(set)
    for r in range(9):
        for c in range(9):
            v = board[r][c]
            if v == ".":
                continue
            b = (r // 3) * 3 + c // 3
            if v in rows[r] or v in cols[c] or v in boxes[b]:
                return False
            rows[r].add(v); cols[c].add(v); boxes[b].add(v)
    return True`,
  lineOf: { init: 2, ok: 11, false: 10, true: 12 },
  answer: (st) => st.result,
  verify({ board }, ans) {
    const ok = (cells: string[]) => {
      const d = cells.filter((x) => x !== '.');
      return new Set(d).size === d.length;
    };
    const g = board.map((r) => [...r]);
    let valid = true;
    for (let i = 0; i < 9; i++) {
      if (!ok(g[i]) || !ok(g.map((r) => r[i]))) valid = false;
      const br = Math.floor(i / 3) * 3;
      const bc = (i % 3) * 3;
      if (!ok([0, 1, 2].flatMap((dr) => [0, 1, 2].map((dc) => g[br + dr][bc + dc])))) valid = false;
    }
    return ans === valid;
  },
};
