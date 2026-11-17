import { L, type CategoryId, type L10n } from './types';

export interface Category {
  id: CategoryId;
  name: L10n;
  /** Number of problems in this category in the NeetCode 150 list. */
  total: number;
  /** What the technique is. */
  definition?: L10n;
  /** When and why to reach for it. */
  purpose?: L10n;
}

/** Ordered like the NeetCode roadmap. Totals sum to 150. */
export const CATEGORIES: Category[] = [
  { id: 'arrays-hashing', name: L('陣列與雜湊', 'Arrays & Hashing'), total: 9 },
  {
    id: 'two-pointers',
    name: L('雙指標', 'Two Pointers'),
    total: 5,
    definition: L(
      '用兩個索引同時走訪同一個陣列或字串。常見有兩種：一個從頭、一個從尾往中間走；或兩個同方向、一快一慢。每一步依照比較結果決定移動哪一個。',
      'Walk one array or string with two indices at once: either one from each end moving inward, or both in the same direction at different speeds. Each step, a comparison decides which index moves.',
    ),
    purpose: L(
      '把「找一對」這類要兩層迴圈 O(n²) 的問題降到 O(n)。關鍵是每移動一次指標，就能確定排除一批不可能的答案。常見情境：已排序陣列找配對、回文檢查、從兩端收縮找最佳解。',
      'Turns "find a pair" problems that need two nested loops (O(n²)) into O(n). The key: every pointer move safely rules out a batch of impossible answers. Typical uses: pairs in a sorted array, palindrome checks, shrinking from both ends toward an optimum.',
    ),
  },
  {
    id: 'sliding-window',
    name: L('滑動視窗', 'Sliding Window'),
    total: 6,
    definition: L(
      '維護一段連續的區間 [L, R]：R 往右擴張、把新元素納入；條件不符時 L 往右收縮、把舊元素移出。視窗內的狀態（總和、字元集合、最低價⋯）隨移動增量更新，不用每次重算。',
      'Maintain a contiguous range [L, R]: R moves right to take in new elements; when a condition breaks, L moves right to drop old ones. The window state (sum, character set, lowest price…) is updated incrementally instead of recomputed.',
    ),
    purpose: L(
      '專門處理「連續子陣列／子字串」的最長、最短、最大類問題。暴力列舉所有區間要 O(n²) 甚至 O(n³)；因為每個元素最多進出視窗各一次，滑動視窗只要 O(n)。',
      'Built for longest / shortest / best contiguous subarray or substring problems. Enumerating every range costs O(n²) or O(n³); since each element enters and leaves the window at most once, a sliding window is O(n).',
    ),
  },
  {
    id: 'stack',
    name: L('堆疊', 'Stack'),
    total: 7,
    definition: L(
      '後進先出（LIFO）的資料結構：只能從頂端放入（push）和取出（pop），最後放進去的最先拿出來。',
      'A last-in, first-out (LIFO) structure: you can only push onto and pop from the top, so the most recent item comes out first.',
    ),
    purpose: L(
      '適合處理「最近一個還沒解決的東西」：括號配對、運算式求值、復原（undo）。進階用法「單調堆疊」讓堆疊保持遞增或遞減，可以在 O(n) 內替每個元素找到「下一個更大／更小的元素」，取代 O(n²) 的雙層迴圈。',
      'Use it for "the most recent thing still unresolved": bracket matching, expression evaluation, undo. A monotonic stack (kept increasing or decreasing) finds the next greater / smaller element for every item in O(n), replacing an O(n²) double loop.',
    ),
  },
  {
    id: 'binary-search',
    name: L('二分搜尋', 'Binary Search'),
    total: 7,
    definition: L(
      '在有序（或具單調性）的範圍裡，每次看正中間的元素，判斷答案在左半還是右半，丟掉另一半，直到找到答案或範圍變空。',
      'In a sorted (or monotonic) range, look at the middle element, decide whether the answer lies in the left or right half, discard the other half, and repeat until found or the range is empty.',
    ),
    purpose: L(
      '把線性搜尋 O(n) 降到 O(log n)：100 萬筆資料最多只要看約 20 次。不只能找數字，只要能回答「答案在左邊還是右邊」就能用，例如旋轉過的陣列、找第一個符合條件的位置、對答案做二分。',
      'Cuts a linear O(n) search to O(log n): about 20 looks for a million items. It works beyond finding a number: whenever you can tell "is the answer left or right?", e.g. rotated arrays, the first position meeting a condition, or binary search on the answer.',
    ),
  },
  { id: 'linked-list', name: L('鏈結串列', 'Linked List'), total: 11 },
  { id: 'trees', name: L('樹', 'Trees'), total: 15 },
  { id: 'tries', name: L('字典樹', 'Tries'), total: 3 },
  { id: 'heap', name: L('堆積 / 優先佇列', 'Heap / Priority Queue'), total: 7 },
  { id: 'backtracking', name: L('回溯', 'Backtracking'), total: 9 },
  { id: 'graphs', name: L('圖', 'Graphs'), total: 13 },
  { id: 'advanced-graphs', name: L('進階圖論', 'Advanced Graphs'), total: 6 },
  { id: 'dp-1d', name: L('一維動態規劃', '1-D Dynamic Programming'), total: 12 },
  { id: 'dp-2d', name: L('二維動態規劃', '2-D Dynamic Programming'), total: 11 },
  { id: 'greedy', name: L('貪婪', 'Greedy'), total: 8 },
  { id: 'intervals', name: L('區間', 'Intervals'), total: 6 },
  { id: 'math-geometry', name: L('數學與幾何', 'Math & Geometry'), total: 8 },
  { id: 'bit-manipulation', name: L('位元運算', 'Bit Manipulation'), total: 7 },
];

export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;
