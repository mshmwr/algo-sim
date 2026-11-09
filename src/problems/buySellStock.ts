import { randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
import { err, isIntArray, isObj } from './helpers';

type I = { prices: number[] };
type S = { p: number[]; l: number; r: number; best: number };

export const buySellStock: Problem<I, S> = {
  id: 'best-time-to-buy-and-sell-stock',
  number: 121,
  category: 'sliding-window',
  difficulty: 'Easy',
  title: L('買賣股票的最佳時機', 'Best Time to Buy and Sell Stock'),
  description: L(
    '已知每天的股價，選一天買入、之後某天賣出，求最大利潤（不能獲利就是 0）。',
    'Given daily prices, buy on one day and sell on a later day. Find the maximum profit, or 0 if no profit is possible.',
  ),
  insight: L(
    'L 是買入日，R 是賣出日。R 一路往右掃：比買入價高就算利潤；遇到更低的價格，就把買入日換到那天。',
    'L is the buy day and R is the sell day. Sweep R to the right: if the price is higher than the buy price, compute the profit; if it is lower, buying that day is better, so move L there.',
  ),
  examples: [{ prices: [7, 1, 5, 3, 6, 4] }, { prices: [7, 6, 4, 3, 1] }, { prices: [3, 8, 2, 5, 9, 1, 4] }],
  random: () => ({ prices: Array.from({ length: randInt(6, 10) }, () => randInt(1, 15)) }),
  validate(x) {
    if (!isObj(x) || !isIntArray(x.prices, 2, 20) || x.prices.some((v) => v < 0 || v > 100))
      return err('需要 {"prices": [0–100 的整數...]}，長度 2–20', 'Expected {"prices": [ints 0–100]}, length 2–20');
    return null;
  },
  formatInput: (i) => `prices = [${i.prices.join(', ')}]`,

  init: ({ prices }) => ({ p: prices, l: 0, r: 1, best: 0 }),
  isDone: (st) => st.r >= st.p.length,
  options: () => [
    { id: 'profit', label: L('計算利潤，R 右移', 'Take profit, move R →') },
    { id: 'newBuy', label: L('買入日換到 R（L = R）', 'Buy on day R instead (L = R)') },
  ],
  correct({ p, l, r }) {
    if (p[r] > p[l]) return ['profit'];
    if (p[r] < p[l]) return ['newBuy'];
    return ['newBuy', 'profit'];
  },
  apply(st, a) {
    if (a === 'profit') return { ...st, best: Math.max(st.best, st.p[st.r] - st.p[st.l]), r: st.r + 1 };
    return { ...st, l: st.r, r: st.r + 1 };
  },
  explain({ p, l, r, best }, a) {
    if (p[r] === p[l])
      return L(`價格 ${p[r]} 和買入價一樣，利潤 0，兩種做法都可以。`, `Price ${p[r]} equals the buy price. The profit is 0, so either move works.`);
    if (a === 'profit') {
      const d = p[r] - p[l];
      const nb = d > best;
      return L(
        `第 ${r} 天價格 ${p[r]} 比買入價 ${p[l]} 高，利潤 ${d}${nb ? '，刷新最大利潤！' : '。'}R 右移。`,
        `Day ${r} price ${p[r]} is above the buy price ${p[l]}: profit ${d}${nb ? ', a new best!' : '.'} Move R right.`,
      );
    }
    return L(
      `第 ${r} 天價格 ${p[r]} 比目前的買入價 ${p[l]} 更低，之後改從這天買更划算。L 移到 R。`,
      `Day ${r} price ${p[r]} is lower than the buy price ${p[l]}. Buying here is better for any future sale, so move L to R.`,
    );
  },
  whyWrong({ p, l, r }, a) {
    if (a === 'newBuy')
      return L(`${p[r]} 比買入價 ${p[l]} 高，換到更貴的買入日只會讓之後的利潤變少。`, `${p[r]} is higher than the buy price ${p[l]}. Switching to a pricier buy day only lowers future profits.`);
    return L(`${p[r]} 比買入價 ${p[l]} 低，這筆交易會賠錢。改在這天買比較好。`, `${p[r]} is below the buy price ${p[l]}, so this trade loses money. Buying on this day is better.`);
  },
  hints: ({ p, l, r }) => [
    L('比較今天（R）的價格和買入日（L）的價格。', 'Compare the price on day R with the buy price on day L.'),
    L(`買入價 prices[L] = ${p[l]}，今天 prices[R] = ${p[r]}。`, `Buy price prices[L] = ${p[l]}, today prices[R] = ${p[r]}.`),
  ],
  scene({ p, l, r, best }) {
    const n = p.length;
    const inRange = r < n;
    const marks: Record<number, CellMark> = {};
    for (let k = 0; k < Math.min(r, n); k++) marks[k] = k === l ? 'focus' : 'done';
    if (inRange) marks[r] = 'focus';
    return [
      {
        kind: 'array',
        id: 'p',
        label: L('prices（R 是今天；拖曳今天的價格）', "prices (R is today; drag today's price)"),
        values: p,
        bars: true,
        pointers: [
          { name: 'L', index: l, color: 'a' },
          ...(inRange ? [{ name: 'R', index: r, color: 'b' as const }] : []),
        ],
        window: inRange ? [l, r] : null,
        marks,
        dragPrefix: 'p',
        dragMask: p.map((_, k) => inRange && k >= r),
      },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'prices[L]', value: p[l] },
          { name: 'prices[R]', value: inRange ? p[r] : '—' },
          { name: 'maxP', value: best, highlight: true },
        ],
      },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'buy', label: L(`🛒 買入（目前：第 ${l} 天，${p[l]}）`, `🛒 Buy (now: day ${l}, ${p[l]})`), tone: 'info' },
          { id: 'sell', label: L('💰 賣出（算利潤）', '💰 Sell (take profit)'), tone: 'good' },
        ],
      },
    ];
  },
  drag: {
    instructions: L(
      '一天一天往後看。今天比買入價高，就把今天的價格拖到 💰 賣出算利潤；比買入價低，就拖到 🛒 買入，改成今天買。',
      "Go day by day. If today is above the buy price, drag today's price to 💰 Sell to take the profit; if it's lower, drag it to 🛒 Buy to buy today instead.",
    ),
    moves({ p, l, r }) {
      const sell = { action: 'profit', from: `p:${r}`, to: 'sell' };
      const buy = { action: 'newBuy', from: `p:${r}`, to: 'buy' };
      if (p[r] > p[l]) return [sell];
      if (p[r] < p[l]) return [buy];
      return [buy, sell];
    },
    whyWrong({ p, l, r }, from, to) {
      const k = Number(from.split(':')[1]);
      if (k !== r)
        return L(`還沒到第 ${k} 天。一天一天往後看，今天是第 ${r} 天（${p[r]}）。`, `Day ${k} hasn't come yet. Go day by day; today is day ${r} (${p[r]}).`);
      if (to === 'sell')
        return L(
          `今天 ${p[r]} 比買入價 ${p[l]} 低，賣了會賠錢。這麼便宜，應該改成今天買。`,
          `Today's ${p[r]} is below the buy price ${p[l]}, so selling loses money. It's cheap, so buy today instead.`,
        );
      return L(
        `今天 ${p[r]} 比買入價 ${p[l]} 貴，換成更貴的買入價只會讓之後的利潤變少。試試看今天賣出能賺多少。`,
        `Today's ${p[r]} is above the buy price ${p[l]}. A pricier buy only lowers future profits. See how much selling today makes.`,
      );
    },
  },
  result: (st) => L(`最大利潤 = ${st.best}`, `Max profit = ${st.best}`),
  code: `def maxProfit(self, prices: List[int]) -> int:
    l, r = 0, 1
    maxP = 0
    while r < len(prices):
        if prices[l] < prices[r]:
            profit = prices[r] - prices[l]
            maxP = max(maxP, profit)
        else:
            l = r
        r += 1
    return maxP`,
  lineOf: { init: 2, profit: 7, newBuy: 9 },
  answer: (st) => st.best,
  verify({ prices }, ans) {
    let m = 0;
    for (let i = 0; i < prices.length; i++) for (let j = i + 1; j < prices.length; j++) m = Math.max(m, prices[j] - prices[i]);
    return ans === m;
  },
};
