import { pick, randInt } from '../core/engine';
import { L, type Problem } from '../core/types';
import { err, isObj, showChar } from './helpers';

type I = { s: string };
type S = { s: string; l: number; r: number; done: boolean; result: boolean | null };

const alnum = (c: string) => /^[a-z0-9]$/i.test(c);
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export const validPalindrome: Problem<I, S> = {
  id: 'valid-palindrome',
  number: 125,
  category: 'two-pointers',
  difficulty: 'Easy',
  title: L('有效回文', 'Valid Palindrome'),
  description: L(
    '只看英文字母與數字、忽略大小寫，判斷字串正著讀和反著讀是否一樣。',
    'Considering only letters and digits and ignoring case, decide whether the string reads the same forwards and backwards.',
  ),
  insight: L(
    'L 從左、R 從右往中間走：遇到標點空白就跳過，遇到英數就互相比較。只要有一對不同就不是回文。',
    'Walk L from the left and R from the right: skip punctuation and spaces, compare letters/digits. One mismatch means it is not a palindrome.',
  ),
  examples: [{ s: 'race a car' }, { s: "No 'x' in Nixon" }, { s: 'A man, a plan, a canal: Panama' }],
  random() {
    const letters = 'abcxyz';
    const half = Array.from({ length: randInt(2, 5) }, () => pick(letters));
    const core = [...half, ...(Math.random() < 0.5 ? [pick(letters)] : []), ...[...half].reverse()];
    if (Math.random() < 0.4) core[randInt(0, core.length - 1)] = pick('mnq');
    const out: string[] = [];
    for (const c of core) {
      if (Math.random() < 0.25) out.push(pick([' ', ',', '!', ':']));
      out.push(Math.random() < 0.3 ? c.toUpperCase() : c);
    }
    if (Math.random() < 0.4) out.push(pick(['!', '?', '.']));
    return { s: out.join('') };
  },
  validate(x) {
    if (!isObj(x) || typeof x.s !== 'string') return err('需要 {"s": "字串"}', 'Expected {"s": "string"}');
    if (x.s.length > 40) return err('字串最長 40 個字元', 'String must be at most 40 characters');
    return null;
  },
  formatInput: (i) => `s = ${JSON.stringify(i.s)}`,

  init: ({ s }) => ({ s, l: 0, r: s.length - 1, done: false, result: null }),
  isDone: (st) => st.done,
  options: () => [
    { id: 'skipL', label: L('L 右移（跳過）', 'Move L → (skip)') },
    { id: 'skipR', label: L('R 左移（跳過）', 'Move R ← (skip)') },
    { id: 'shrink', label: L('兩端內縮', 'Move both inward') },
    { id: 'false', label: L('回傳 False', 'Return False') },
    { id: 'true', label: L('回傳 True', 'Return True') },
  ],
  correct({ s, l, r }) {
    if (l >= r) return ['true'];
    const a = !alnum(s[l]);
    const b = !alnum(s[r]);
    if (a || b) return [...(a ? ['skipL'] : []), ...(b ? ['skipR'] : [])];
    return same(s[l], s[r]) ? ['shrink'] : ['false'];
  },
  apply(st, a) {
    switch (a) {
      case 'skipL':
        return { ...st, l: st.l + 1 };
      case 'skipR':
        return { ...st, r: st.r - 1 };
      case 'shrink':
        return { ...st, l: st.l + 1, r: st.r - 1 };
      default:
        return { ...st, done: true, result: a === 'true' };
    }
  },
  explain({ s, l, r }, a) {
    const cl = showChar(s[l] ?? '');
    const cr = showChar(s[r] ?? '');
    switch (a) {
      case 'skipL':
        return L(`s[L] = '${cl}' 不是英數字，L 右移跳過它。`, `s[L] = '${cl}' is not alphanumeric, so L skips it.`);
      case 'skipR':
        return L(`s[R] = '${cr}' 不是英數字，R 左移跳過它。`, `s[R] = '${cr}' is not alphanumeric, so R skips it.`);
      case 'shrink':
        return L(
          `'${cl}' 和 '${cr}' 相同（忽略大小寫），兩端同時往內縮。`,
          `'${cl}' and '${cr}' match (ignoring case), so both pointers move inward.`,
        );
      case 'false':
        return L(`'${cl}' ≠ '${cr}'，不是回文，回傳 False。`, `'${cl}' ≠ '${cr}', not a palindrome. Return False.`);
      default:
        return L(
          'L 和 R 已經相遇（L ≥ R），每一對都相同，回傳 True。',
          'L and R have met (L ≥ R) and every pair matched. Return True.',
        );
    }
  },
  whyWrong({ s, l, r }, a) {
    if (l >= r) return L('L 和 R 已經相遇，迴圈結束了，沒有發現不同的字元。', 'L and R have met. The loop is over and no mismatch was found.');
    if (a === 'true') return L('L < R，還有字元沒比較完。', 'L < R. There are still characters to compare.');
    if (a === 'skipL' && alnum(s[l])) return L(`s[L] = '${s[l]}' 是英數字，不能跳過。`, `s[L] = '${s[l]}' is alphanumeric. Don't skip it.`);
    if (a === 'skipR' && alnum(s[r])) return L(`s[R] = '${s[r]}' 是英數字，不能跳過。`, `s[R] = '${s[r]}' is alphanumeric. Don't skip it.`);
    if (!alnum(s[l]) || !alnum(s[r]))
      return L('先跳過非英數字元，標點和空白不算數。', 'Skip non-alphanumeric characters first. Punctuation and spaces do not count.');
    if (a === 'shrink') return L(`'${s[l]}' 和 '${s[r]}' 不同，不能內縮。`, `'${s[l]}' and '${s[r]}' differ. You can't move inward.`);
    if (a === 'false') return L(`'${s[l]}' 和 '${s[r]}' 忽略大小寫後是相同的。`, `'${s[l]}' and '${s[r]}' are the same when ignoring case.`);
    return null;
  },
  hints: ({ s, l, r }) => [
    L('先看 L 和 R 指到的字元：是英數字嗎？', 'Look at the characters under L and R: are they letters or digits?'),
    l < r
      ? L(`s[L] = '${showChar(s[l])}'，s[R] = '${showChar(s[r])}'。`, `s[L] = '${showChar(s[l])}', s[R] = '${showChar(s[r])}'.`)
      : L('比較一下 L 和 R 的位置。', 'Compare the positions of L and R.'),
  ],
  scene({ s, l, r, done, result }) {
    const marks: Record<number, 'good' | 'bad' | 'focus' | 'done'> = {};
    if (done && result === false) {
      marks[l] = 'bad';
      marks[r] = 'bad';
    } else if (l < r && alnum(s[l]) && alnum(s[r])) {
      marks[l] = 'focus';
      marks[r] = 'focus';
    }
    return [
      {
        kind: 'array',
        id: 's',
        label: L('字串 s', 'string s'),
        values: [...s].map(showChar),
        pointers: [
          { name: 'L', index: l, color: 'a' },
          { name: 'R', index: r, color: 'b' },
        ],
        active: l <= r ? [l, r] : null,
        marks,
      },
      {
        kind: 'vars',
        id: 'v',
        vars: [
          { name: 'L', value: l },
          { name: 'R', value: r },
          { name: 'return', value: result === null ? '—' : result ? 'True' : 'False', highlight: done },
        ],
      },
    ];
  },
  result: (st) => L(`回傳 ${st.result ? 'True' : 'False'}`, `Returned ${st.result ? 'True' : 'False'}`),
  code: `def isPalindrome(self, s: str) -> bool:
    l, r = 0, len(s) - 1
    while l < r:
        while l < r and not s[l].isalnum():
            l += 1
        while l < r and not s[r].isalnum():
            r -= 1
        if s[l].lower() != s[r].lower():
            return False
        l, r = l + 1, r - 1
    return True`,
  lineOf: { init: 2, skipL: 5, skipR: 7, false: 9, shrink: 10, true: 11 },
  answer: (st) => st.result,
  verify({ s }, ans) {
    const clean = [...s].filter(alnum).map((c) => c.toLowerCase()).join('');
    return ans === (clean === [...clean].reverse().join(''));
  },
};
