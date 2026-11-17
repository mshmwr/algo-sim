import { pick, randInt } from '../core/engine';
import { L, type CellMark, type Problem } from '../core/types';
import { err, isObj } from './helpers';

type I = { strs: string[] };
/** Phase 1 encodes word by word; phase 2 decodes by reading the length prefix and cutting. */
type S = { strs: string[]; w: number; enc: string; p: number; out: string[] };

const piece = (s: string) => `${s.length}#${s}`;
/** For decoding at p: index of '#', the word length, and the index of the word's last char (or '#' for empty words). */
const at = (enc: string, p: number) => {
  const hash = enc.indexOf('#', p);
  const len = Number(enc.slice(p, hash));
  return { hash, len, end: hash + len };
};

export const encodeDecode: Problem<I, S> = {
  id: 'encode-and-decode-strings',
  number: 271,
  category: 'arrays-hashing',
  difficulty: 'Medium',
  title: L('字串的編碼與解碼', 'Encode and Decode Strings'),
  description: L('把一串字串編碼成「一個」字串，之後還要能完整解碼回原本的清單（字串裡可能有任何字元）。', 'Encode a list of strings into one string that can be decoded back exactly, even if the strings contain any characters.'),
  insight: L(
    '每個字串前面寫上「長度 + #」，例如 "neet" 寫成 "4#neet"。解碼時先讀到 # 前的數字，就知道接下來要剛好切幾個字，不用擔心字串裡也有 #。',
    'Prefix each string with its length and a #, so "neet" becomes "4#neet". When decoding, read the number before #, then cut exactly that many characters, so a # inside a string never confuses it.',
  ),
  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    why: L('n 是所有字元的總數。編碼、解碼都只掃一次。只用特殊分隔符（例如逗號）會在字串本身含有分隔符時出錯。', 'n is the total number of characters. Encoding and decoding are each one pass. A plain delimiter (like a comma) breaks when the strings themselves contain it.'),
  },
  examples: [{ strs: ['neet', 'code', 'love', 'you'] }, { strs: ['we', 'say', ':', 'yes'] }, { strs: ['a#b', '', '12'] }],
  random: () => ({ strs: Array.from({ length: randInt(2, 4) }, () => Array.from({ length: randInt(0, 4) }, () => pick('ab#3')).join('')) }),
  validate(x) {
    if (!isObj(x) || !Array.isArray(x.strs) || x.strs.length < 1 || x.strs.length > 6 || !x.strs.every((w) => typeof w === 'string' && w.length <= 9))
      return err('需要 {"strs": ["...", ...]}，1–6 個、每個最多 9 字', 'Expected {"strs": ["...", ...]}, 1–6 strings up to 9 chars');
    return null;
  },
  formatInput: (i) => `strs = [${i.strs.map((w) => JSON.stringify(w)).join(', ')}]`,

  init: ({ strs }) => ({ strs, w: 0, enc: '', p: 0, out: [] }),
  isDone: (st) => st.w >= st.strs.length && st.p >= st.enc.length,
  options: () => [
    { id: 'encode', label: L('編碼下一個字串', 'Encode the next string') },
    { id: 'cut', label: L('切出一個字串', 'Cut out one string') },
  ],
  correct: (st) => [st.w < st.strs.length ? 'encode' : 'cut'],
  apply(st, a) {
    if (a === 'encode') return { ...st, enc: st.enc + piece(st.strs[st.w]), w: st.w + 1 };
    const { hash, end } = at(st.enc, st.p);
    return { ...st, out: [...st.out, st.enc.slice(hash + 1, end + 1)], p: end + 1 };
  },
  explain(st, a) {
    if (a === 'encode') {
      const s = st.strs[st.w];
      return L(`"${s}" 長度 ${s.length}，寫成 "${piece(s)}" 接在後面。`, `"${s}" has length ${s.length}; append "${piece(s)}".`);
    }
    const { hash, len, end } = at(st.enc, st.p);
    const word = st.enc.slice(hash + 1, end + 1);
    return L(`讀到 # 前的長度 ${len}，從 # 後面切 ${len} 個字："${word}"。`, `The length before # is ${len}; cut ${len} chars after #: "${word}".`);
  },
  whyWrong: (st) => (st.w < st.strs.length ? L('先把所有字串編碼完。', 'Encode every string first.') : L('解碼時，切到的位置要剛好是長度標示的字數。', 'When decoding, cut exactly as many characters as the length prefix says.')),
  hints(st) {
    if (st.w < st.strs.length) return [L('每個字串寫成「長度#內容」。', 'Write each string as "length#content".'), L(`下一個是 "${st.strs[st.w]}"。`, `Next is "${st.strs[st.w]}".`)];
    const { len, end } = at(st.enc, st.p);
    return [L('先讀 # 前面的數字，那就是這個字串的長度。', 'Read the number before #: that is the string length.'), L(`長度 ${len}，最後一個字在索引 ${end}。`, `Length ${len}; its last char is at index ${end}.`)];
  },
  scene(st) {
    const { strs, w, enc, p, out } = st;
    const encoding = w < strs.length;
    const done = !encoding && p >= enc.length;
    const sm: Record<number, CellMark> = {};
    strs.forEach((_, k) => k < w && (sm[k] = 'done'));
    if (encoding) sm[w] = 'focus';
    const em: Record<number, CellMark> = {};
    [...enc].forEach((_, k) => k < p && (em[k] = 'gone'));
    if (!encoding && !done) {
      const { hash } = at(enc, p);
      for (let k = p; k <= hash; k++) em[k] = 'focus';
    }
    return [
      { kind: 'array', id: 'strs', label: L('① 原本的字串：拖到「編碼」', '① strings: drag to "Encode"'), values: strs.map((s) => (s === '' ? '""' : s)), marks: sm, dragPrefix: encoding ? 's' : undefined, dragMask: strs.map((_, k) => k >= w) },
      {
        kind: 'array',
        id: 'enc',
        label: L('② 編碼後的字串：拖「這個字串的最後一個字」到 ✂', "② encoded: drag the string's last character to ✂"),
        values: enc ? [...enc] : ['·'],
        marks: em,
        pointers: !encoding && !done ? [{ name: 'p', index: p, color: 'a' }] : [],
        dragPrefix: !encoding && !done ? 'e' : undefined,
        dragMask: [...enc].map((_, k) => k >= p),
      },
      { kind: 'set', id: 'out', label: L('解碼結果', 'decoded'), items: out.map((s) => JSON.stringify(s)) },
      {
        kind: 'zones',
        id: 'zones',
        zones: [
          { id: 'encode', label: L('🔒 編碼（寫成 長度#內容）', '🔒 Encode (as length#content)'), tone: 'info' },
          { id: 'cut', label: L('✂ 切到這裡為止', '✂ Cut up to here'), tone: 'good' },
        ],
      },
    ];
  },
  drag: {
    instructions: L('① 把每個字串依序拖到 🔒 編碼。② 解碼：先看 # 前的數字（長度），把「這個字串的最後一個字」拖到 ✂（長度是 0 的字串，就拖 # 本身）。', '① Drag each string to 🔒 in order. ② Decode: read the number before # (the length), then drag the string\'s last character to ✂ (for an empty string, drag the # itself).'),
    moves(st) {
      if (st.w < st.strs.length) return [{ action: 'encode', from: `s:${st.w}`, to: 'encode' }];
      return [{ action: 'cut', from: `e:${at(st.enc, st.p).end}`, to: 'cut' }];
    },
    whyWrong(st, from, to) {
      if (st.w < st.strs.length) return Number(from.split(':')[1]) !== st.w ? L('照順序一個一個編碼。', 'Encode in order.') : L('拖到 🔒 編碼。', 'Drag it to 🔒.');
      if (to !== 'cut') return L('拖到 ✂。', 'Drag it to ✂.');
      const k = Number(from.split(':')[1]);
      const { len, end } = at(st.enc, st.p);
      return k < end
        ? L(`切太短了：長度是 ${len}，最後一個字在索引 ${end}，不是 ${k}。`, `Too short: the length is ${len}, so the last char is at ${end}, not ${k}.`)
        : L(`切太長了：長度是 ${len}，最後一個字在索引 ${end}。後面的是下一個字串的長度標示。`, `Too long: the length is ${len}, so stop at ${end}; what follows is the next string's prefix.`);
    },
  },
  result: (st) => L(`編碼 "${st.enc}"，解碼回 [${st.out.map((s) => JSON.stringify(s)).join(', ')}]`, `Encoded "${st.enc}", decoded [${st.out.map((s) => JSON.stringify(s)).join(', ')}]`),
  code: `def encode(self, strs: List[str]) -> str:
    return "".join(f"{len(s)}#{s}" for s in strs)

def decode(self, s: str) -> List[str]:
    res, i = [], 0
    while i < len(s):
        j = s.index("#", i)
        length = int(s[i:j])
        res.append(s[j + 1 : j + 1 + length])
        i = j + 1 + length
    return res`,
  lineOf: { init: 2, encode: 2, cut: 9 },
  answer: (st) => st.out,
  verify: ({ strs }, ans) => JSON.stringify(ans) === JSON.stringify(strs),
};
