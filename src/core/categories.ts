import { L, type CategoryId, type L10n } from './types';

export interface Category {
  id: CategoryId;
  name: L10n;
  /** Number of problems in this category in the NeetCode 150 list. */
  total: number;
}

/** Ordered like the NeetCode roadmap. Totals sum to 150. */
export const CATEGORIES: Category[] = [
  { id: 'arrays-hashing', name: L('陣列與雜湊', 'Arrays & Hashing'), total: 9 },
  { id: 'two-pointers', name: L('雙指標', 'Two Pointers'), total: 5 },
  { id: 'sliding-window', name: L('滑動視窗', 'Sliding Window'), total: 6 },
  { id: 'stack', name: L('堆疊', 'Stack'), total: 7 },
  { id: 'binary-search', name: L('二分搜尋', 'Binary Search'), total: 7 },
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
