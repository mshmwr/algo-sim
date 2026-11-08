import { pick, randInt } from '../core/engine';
import { L, TAP, type CellMark, type Problem } from '../core/types';
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
        return L(`左端的 '${cl}' 不是英數字，丟掉它（L 右移一格）。`, `'${cl}' on the left is not alphanumeric. Discard it (L moves right).`);
      case 'skipR':
        return L(`右端的 '${cr}' 不是英數字，丟掉它（R 左移一格）。`, `'${cr}' on the right is not alphanumeric. Discard it (R moves left).`);
      case 'shrink':
        return L(
          `'${cl}' 和 '${cr}' 相同（忽略大小寫），配對成功，兩端往內縮。`,
          `'${cl}' and '${cr}' match (ignoring case). Paired! Both ends move inward.`,
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
    const n = s.length;
    const marks: Record<number, CellMark> = {};
    for (let k = 0; k < n; k++) {
      if (k >= l && k <= r) continue;
      marks[k] = alnum(s[k]) ? 'good' : 'gone';
    }
    if (done && result === false) {
      marks[l] = 'bad';
      marks[r] = 'bad';
    } else if (done && l === r) marks[l] = 'good';
    const live = [...s].map((_, k) => !done && k >= l && k <= r);
    return [
      {
        kind: 'array',
        id: 's',
        label: L('字串 s（拖曳最外側的字元）', 'string s (drag the outermost characters)'),
        values: [...s].map(showChar),
        pointers: done
          ? []
          : [
              { name: 'L', index: l, color: 'a' },
              { name: 'R', index: r, color: 'b' },
            ],
        marks,
        dragPrefix: 'c',
        dropPrefix: 'c',
        dragMask: live,
        dropMask: live,
      },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'trash', label: L('🗑️ 丟掉（空白、標點）', '🗑️ Discard (spaces, punctuation)'), tone: 'trash' },
          { id: 'no', label: L('✗ 不是回文', '✗ Not a palindrome'), tone: 'bad' },
          { id: 'yes', label: L('✓ 是回文', '✓ Palindrome'), tone: 'good' },
        ],
      },
    ];
  },
  drag: {
    instructions: L(
      '處理最外側的兩個字元：空白和標點拖進 🗑️；兩個字母相同就把一個拖到另一個上面配對；不同就拖進 ✗。全部配對完，點 ✓。',
      'Work on the two outermost characters: drag spaces and punctuation into 🗑️; if the two letters match, drag one onto the other to pair them; if not, drag one into ✗. When everything is paired, tap ✓.',
    ),
    tapZones: ['yes', 'no'],
    moves({ s, l, r }) {
      if (l >= r) {
        const m = [{ action: 'true', from: TAP, to: 'yes' }];
        if (l === r) m.push({ action: 'true', from: `c:${l}`, to: 'yes' });
        return m;
      }
      const a = !alnum(s[l]);
      const b = !alnum(s[r]);
      if (a || b)
        return [...(a ? [{ action: 'skipL', from: `c:${l}`, to: 'trash' }] : []), ...(b ? [{ action: 'skipR', from: `c:${r}`, to: 'trash' }] : [])];
      if (same(s[l], s[r]))
        return [
          { action: 'shrink', from: `c:${l}`, to: `c:${r}` },
          { action: 'shrink', from: `c:${r}`, to: `c:${l}` },
        ];
      return [
        { action: 'false', from: `c:${l}`, to: 'no' },
        { action: 'false', from: `c:${r}`, to: 'no' },
        { action: 'false', from: TAP, to: 'no' },
      ];
    },
    whyWrong({ s, l, r }, from, to) {
      const q = (c: string) => `'${showChar(c)}'`;
      const pending =
        l < r
          ? !alnum(s[l]) || !alnum(s[r])
            ? L('最外側還有空白或標點要先丟掉。', 'There is still a space or punctuation mark at an outer end to discard first.')
            : same(s[l], s[r])
              ? L(`${q(s[l])} 和 ${q(s[r])} 相同，要先把它們配對。`, `${q(s[l])} and ${q(s[r])} match. Pair them first.`)
              : L(`${q(s[l])} 和 ${q(s[r])} 不同。`, `${q(s[l])} and ${q(s[r])} differ.`)
          : L('', '');
      if (l >= r) {
        if (to === 'no') return L('所有字母都配對成功了，沒有發現不同的地方。', 'Every letter pair matched. No mismatch was found.');
        return L('比較已經結束，點 ✓ 是回文。', 'Comparing is finished. Tap ✓ Palindrome.');
      }
      if (from === TAP) {
        if (to === 'yes') return L(`還有字元沒比完。${pending.zh}`, `Some characters are still unchecked. ${pending.en}`);
        return L(`現在還不能下結論。${pending.zh}`, `You can't conclude yet. ${pending.en}`);
      }
      const k = Number(from.split(':')[1]);
      const c = s[k];
      if (k !== l && k !== r)
        return L(
          `${q(c)} 不在最外側。現在要處理的是左端的 ${q(s[l])} 和右端的 ${q(s[r])}。`,
          `${q(c)} is not at an outer end. Work on ${q(s[l])} on the left and ${q(s[r])} on the right.`,
        );
      const other = k === l ? r : l;
      if (to === 'trash')
        return alnum(c)
          ? L(`${q(c)} 是英數字，不能丟掉，要拿來比較。`, `${q(c)} is a letter or digit. Don't discard it; it has to be compared.`)
          : L('', '');
      if (!alnum(c)) return L(`${q(c)} 是空白或標點，不算數，拖進 🗑️ 丟掉。`, `${q(c)} is a space or punctuation and doesn't count. Drag it into 🗑️.`);
      if (!alnum(s[other]))
        return L(`另一端的 ${q(s[other])} 要先丟掉，才能比較。`, `Discard ${q(s[other])} at the other end before comparing.`);
      if (to === 'yes') return L(`還有字元沒比完。${pending.zh}`, `Some characters are still unchecked. ${pending.en}`);
      if (to === 'no') return L(`${q(s[l])} 和 ${q(s[r])} 忽略大小寫後是相同的，可以配對。`, `${q(s[l])} and ${q(s[r])} are the same ignoring case. Pair them.`);
      const j = Number(to.split(':')[1]);
      if (j !== other) return L(`要和另一端的 ${q(s[other])} 配對。`, `Pair it with ${q(s[other])} at the other end.`);
      return L(`${q(s[l])} 和 ${q(s[r])} 不一樣，不能配對。`, `${q(s[l])} and ${q(s[r])} are different, so they can't be paired.`);
    },
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
