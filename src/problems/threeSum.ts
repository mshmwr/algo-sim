import { randInt } from '../core/engine';
import { L, type CellMark, type DragMove, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';

type I = { nums: number[] };
/** i = pivot index; l / r = two-pointer ends inside (i, n). */
type S = { a: number[]; i: number; l: number; r: number; res: number[][] };

const sum3 = ({ a, i, l, r }: S) => a[i] + a[l] + a[r];

/** Move the pivot to the next index with a different value, resetting l / r. */
function nextPivot(a: number[], i: number): Pick<S, 'i' | 'l' | 'r'> {
  let j = i + 1;
  while (j < a.length && a[j] === a[j - 1]) j++;
  return { i: j, l: j + 1, r: a.length - 1 };
}

const key = (t: number[]) => t.join(',');

export const threeSum: Problem<I, S> = {
  id: '3sum',
  number: 15,
  category: 'two-pointers',
  difficulty: 'Medium',
  title: L('三數之和', '3Sum'),
  description: L(
    '找出所有「三個數加起來等於 0」的組合，同樣的組合只能出現一次。',
    'Find every unique triplet of numbers that adds up to 0. No duplicate triplets.',
  ),
  insight: L(
    '先排序。固定一個 pivot nums[i]，在它右邊用「兩數之和 II」的雙指標找另外兩個數，讓三數和等於 0。遇到和前一個相同的 pivot 就跳過，避免重複組合。',
    'Sort first. Fix a pivot nums[i], then run the Two Sum II two-pointer scan to its right to make the sum 0. Skip a pivot equal to the previous one to avoid duplicate triplets.',
  ),
  complexity: {
    time: 'O(n²)',
    space: 'O(1)',
    why: L(
      '排序 O(n log n)；外層每個 pivot 跑一次 O(n) 的雙指標，總共 O(n²)。除了輸出和排序本身，只用幾個索引。暴力解試每一組三個數是 O(n³)。',
      'Sorting is O(n log n); each pivot runs an O(n) two-pointer scan, so O(n²) overall. Apart from the output and the sort itself, only a few indices are stored. Trying every triple is O(n³).',
    ),
  },
  examples: [{ nums: [-1, 0, 1, 2, -1, -4] }, { nums: [0, 0, 0, 0] }, { nums: [-2, 0, 1, 1, 2] }],
  random: () => ({ nums: Array.from({ length: randInt(6, 9) }, () => randInt(-4, 4)) }),
  validate(x) {
    if (!isObj(x) || !isIntArray(x.nums, 3, 14) || x.nums.some((v) => Math.abs(v) > 50))
      return err('需要 {"nums": [-50～50 的整數...]}，長度 3–14', 'Expected {"nums": [ints -50..50]}, length 3–14');
    return null;
  },
  formatInput: (i) => `nums = [${i.nums.join(', ')}]`,

  init({ nums }) {
    const a = [...nums].sort((x, y) => x - y);
    return { a, i: 0, l: 1, r: a.length - 1, res: [] };
  },
  isDone: (st) => st.i > st.a.length - 3,
  options: () => [
    { id: 'moveL', label: L('丟掉左端（L 右移）', 'Discard left end (L →)') },
    { id: 'moveR', label: L('丟掉右端（R 左移）', 'Discard right end (R ←)') },
    { id: 'record', label: L('記錄這組，L 右移', 'Record triplet, L →') },
    { id: 'nextI', label: L('換下一個 pivot', 'Next pivot') },
  ],
  correct(st) {
    if (st.l >= st.r) return ['nextI'];
    const s = sum3(st);
    return s < 0 ? ['moveL'] : s > 0 ? ['moveR'] : ['record'];
  },
  apply(st, act) {
    if (act === 'nextI') return { ...st, ...nextPivot(st.a, st.i) };
    if (act === 'moveL') return { ...st, l: st.l + 1 };
    if (act === 'moveR') return { ...st, r: st.r - 1 };
    const res = [...st.res, [st.a[st.i], st.a[st.l], st.a[st.r]]];
    let l = st.l + 1;
    while (l < st.r && st.a[l] === st.a[l - 1]) l++;
    return { ...st, res, l };
  },
  explain(st, act) {
    const { a, i, l, r } = st;
    if (act === 'nextI') {
      const nx = nextPivot(a, i).i;
      const skipped = nx - i - 1;
      return L(
        `L 和 R 相遇，pivot ${a[i]} 的組合都找完了，換下一個 pivot${skipped > 0 ? `（跳過 ${skipped} 個重複的 ${a[i]}）` : ''}。`,
        `L and R met, so pivot ${a[i]} is done. Move to the next pivot${skipped > 0 ? ` (skipping ${skipped} duplicate ${a[i]})` : ''}.`,
      );
    }
    const s = sum3(st);
    const expr = `${a[i]} + ${a[l]} + ${a[r]} = ${s}`;
    if (act === 'moveL') return L(`${expr} < 0，太小。${a[l]} 配最大的數都不夠，丟掉它（L 右移）。`, `${expr} < 0: too small. ${a[l]} can't work even with the largest number. Discard it (L →).`);
    if (act === 'moveR') return L(`${expr} > 0，太大。${a[r]} 配最小的數都太大，丟掉它（R 左移）。`, `${expr} > 0: too big. ${a[r]} overshoots even with the smallest number. Discard it (R ←).`);
    return L(`${expr}！記錄 [${a[i]}, ${a[l]}, ${a[r]}]，L 右移並跳過重複的值。`, `${expr}! Record [${a[i]}, ${a[l]}, ${a[r]}], then move L past duplicates.`);
  },
  whyWrong(st, act) {
    if (st.l >= st.r) return L('L 和 R 已經相遇，這個 pivot 找完了。', 'L and R have met; this pivot is finished.');
    const s = sum3(st);
    if (act === 'nextI') return L('L < R，這個 pivot 還有組合沒找完。', 'L < R: this pivot still has pairs to check.');
    if (s === 0) return L('三數和剛好是 0，先記錄這組！', 'The sum is exactly 0. Record this triplet first!');
    if (act === 'record') return L(`三數和是 ${s}，不是 0。`, `The sum is ${s}, not 0.`);
    if (act === 'moveL') return L(`和 ${s} 已經大於 0，丟掉左端的小數只會更大。`, `The sum ${s} is already above 0; dropping the small left end makes it bigger.`);
    return L(`和 ${s} 小於 0，丟掉右端的大數只會更小。`, `The sum ${s} is below 0; dropping the big right end makes it smaller.`);
  },
  hints: (st) =>
    st.l >= st.r
      ? [L('L 和 R 還有空間可以找嗎？', 'Is there anything left between L and R?'), L(`L = ${st.l}，R = ${st.r}。`, `L = ${st.l}, R = ${st.r}.`)]
      : [
          L('把 pivot、左端、右端三個數加起來，和 0 比較。', 'Add the pivot, the left end and the right end, then compare with 0.'),
          L(`${st.a[st.i]} + ${st.a[st.l]} + ${st.a[st.r]} = ${sum3(st)}`, `${st.a[st.i]} + ${st.a[st.l]} + ${st.a[st.r]} = ${sum3(st)}`),
        ],
  scene(st) {
    const { a, i, l, r, res } = st;
    const done = i > a.length - 3;
    const marks: Record<number, CellMark> = {};
    a.forEach((_, k) => {
      if (k < i) marks[k] = 'gone';
      else if (k === i) marks[k] = 'good';
      else if (k < l || k > r) marks[k] = 'done';
    });
    if (!done && l < r) {
      marks[l] = 'focus';
      marks[r] = 'focus';
    }
    const pointers: { name: string; index: number; color: 'a' | 'b' | 'c' }[] = done
      ? []
      : [
          { name: 'i', index: i, color: 'c' },
          ...(l < a.length ? [{ name: 'L', index: l, color: 'a' as const }] : []),
          { name: 'R', index: r, color: 'b' },
        ];
    return [
      {
        kind: 'array',
        id: 'a',
        label: L('nums（已排序；綠色是 pivot）', 'nums (sorted; green is the pivot)'),
        values: a,
        pointers,
        marks,
        dragPrefix: 'n',
        dropPrefix: 'n',
        dragMask: a.map((_, k) => !done && k >= i),
        dropMask: a.map((_, k) => !done && k > i),
      },
      {
        kind: 'vars',
        id: 'v',
        vars: [{ name: 'nums[i] + nums[L] + nums[R]', value: !done && l < r ? sum3(st) : '—', highlight: true }],
      },
      { kind: 'set', id: 'res', label: L('res（找到的組合）', 'res (triplets found)'), items: res.map((t) => `[${t.join(', ')}]`) },
      {
        kind: 'zones',
        id: 'zones',
        zones: [{ id: 'trash', label: L('🗑️ 丟掉（端點或用完的 pivot）', '🗑️ Discard (an end, or a finished pivot)'), tone: 'trash' }],
      },
    ];
  },
  drag: {
    instructions: L(
      '算 pivot + 左端 + 右端：太小就把左端丟進 🗑️，太大就丟右端；等於 0 就把左端拖到右端上面配對記錄。L 和 R 相遇後，把 pivot 丟進 🗑️，換下一個。',
      'Add pivot + left end + right end: too small, drag the left end into 🗑️; too big, the right end; exactly 0, drag the left end onto the right end to record it. When L and R meet, drag the pivot into 🗑️ to move on.',
    ),
    moves(st) {
      const { i, l, r } = st;
      if (l >= r) return [{ action: 'nextI', from: `n:${i}`, to: 'trash' }];
      const s = sum3(st);
      if (s < 0) return [{ action: 'moveL', from: `n:${l}`, to: 'trash' }];
      if (s > 0) return [{ action: 'moveR', from: `n:${r}`, to: 'trash' }];
      const m: DragMove[] = [
        { action: 'record', from: `n:${l}`, to: `n:${r}` },
        { action: 'record', from: `n:${r}`, to: `n:${l}` },
      ];
      return m;
    },
    whyWrong(st, from, to) {
      const { a, i, l, r } = st;
      const k = Number(from.split(':')[1]);
      if (l >= r) {
        if (k === i) return L('把 pivot 丟進 🗑️，換下一個。', 'Drag the pivot into 🗑️ to move on.');
        return L(`L 和 R 已經相遇，pivot ${a[i]} 的組合都找完了。把 pivot 丟掉，換下一個。`, `L and R have met; pivot ${a[i]} is finished. Discard the pivot to move on.`);
      }
      const s = sum3(st);
      if (k === i) return L(`pivot ${a[i]} 還有組合沒找完（L < R），先別丟。`, `Pivot ${a[i]} still has pairs to check (L < R). Keep it.`);
      if (k !== l && k !== r)
        return L(`${a[k]} 不在兩端。現在只比較左端 ${a[l]} 和右端 ${a[r]}。`, `${a[k]} isn't at either end. Compare only the left end ${a[l]} and the right end ${a[r]}.`);
      if (to === 'trash') {
        if (s === 0) return L(`${a[i]} + ${a[l]} + ${a[r]} = 0，剛好！把左端拖到右端上面記錄下來。`, `${a[i]} + ${a[l]} + ${a[r]} = 0! Drag the left end onto the right end to record it.`);
        if (k === l) return L(`和 ${s} 已經大於 0。丟掉左端的小數，換上更大的數，和只會更大。該丟的是右端 ${a[r]}。`, `The sum ${s} is above 0. Dropping the small left end brings in a bigger number. Discard the right end ${a[r]}.`);
        return L(`和 ${s} 還小於 0。丟掉右端的大數，和只會更小。該丟的是左端 ${a[l]}。`, `The sum ${s} is below 0. Dropping the big right end makes it smaller. Discard the left end ${a[l]}.`);
      }
      const j = Number(to.split(':')[1]);
      const other = k === l ? r : l;
      if (j !== other) return L(`要和另一端的 ${a[other]} 配對。`, `Pair it with ${a[other]} at the other end.`);
      return L(`${a[i]} + ${a[l]} + ${a[r]} = ${s}，不等於 0，不能記錄。`, `${a[i]} + ${a[l]} + ${a[r]} = ${s}, not 0, so it can't be recorded.`);
    },
  },
  result: (st) => L(`共 ${st.res.length} 組：${st.res.map((t) => `[${t.join(', ')}]`).join(' ') || '（無）'}`, `${st.res.length} triplet(s): ${st.res.map((t) => `[${t.join(', ')}]`).join(' ') || '(none)'}`),
  code: `def threeSum(self, nums: List[int]) -> List[List[int]]:
    res = []
    nums.sort()
    for i, a in enumerate(nums):
        if i > 0 and a == nums[i - 1]:
            continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            threeSum = a + nums[l] + nums[r]
            if threeSum > 0:
                r -= 1
            elif threeSum < 0:
                l += 1
            else:
                res.append([a, nums[l], nums[r]])
                l += 1
                while nums[l] == nums[l - 1] and l < r:
                    l += 1
    return res`,
  lineOf: { init: 3, nextI: 4, moveR: 11, moveL: 13, record: 15 },
  answer: (st) => st.res,
  verify({ nums }, ans) {
    const exp = new Set<string>();
    for (let x = 0; x < nums.length; x++)
      for (let y = x + 1; y < nums.length; y++)
        for (let z = y + 1; z < nums.length; z++)
          if (nums[x] + nums[y] + nums[z] === 0) exp.add(key([nums[x], nums[y], nums[z]].sort((p, q) => p - q)));
    const got = (ans as number[][]).map((t) => key([...t].sort((p, q) => p - q)));
    return got.length === new Set(got).size && got.length === exp.size && got.every((g) => exp.has(g));
  },
};
