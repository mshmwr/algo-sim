import type { CategoryId, Problem } from '../core/types';
import { binarySearch } from './binarySearch';
import { buySellStock } from './buySellStock';
import { containerWater } from './containerWater';
import { dailyTemperatures } from './dailyTemperatures';
import { evalRPN } from './evalRPN';
import { findMinRotated } from './findMinRotated';
import { longestSubstring } from './longestSubstring';
import { twoSumII } from './twoSumII';
import { validParentheses } from './validParentheses';
import { validPalindrome } from './validPalindrome';

/** All playable problems, in NeetCode roadmap order within each category. */
export const PROBLEMS: Problem[] = [
  validPalindrome,
  twoSumII,
  containerWater,
  buySellStock,
  longestSubstring,
  validParentheses,
  evalRPN,
  dailyTemperatures,
  binarySearch,
  findMinRotated,
];

export const problemById = (id: string) => PROBLEMS.find((p) => p.id === id);
export const problemsIn = (c: CategoryId) => PROBLEMS.filter((p) => p.category === c);

const LEETCODE_SLUG: Record<string, string> = {
  'two-sum-ii': 'two-sum-ii-input-array-is-sorted',
};
export const leetcodeUrl = (p: Problem) => `https://leetcode.com/problems/${LEETCODE_SLUG[p.id] ?? p.id}/`;
