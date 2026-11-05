import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { L, type L10n, type Lang } from './core/types';

const KEY = 'algosim.lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    /* storage unavailable */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (s: L10n) => string;
}

const Ctx = createContext<LangCtx>({ lang: 'zh', setLang: () => {}, t: (s) => s.zh });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  }, [lang]);
  const t = useCallback((s: L10n) => s[lang], [lang]);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

/** UI strings. */
export const ui = {
  tagline: L('親手操作每一步，把演算法練到直覺。', 'Step through every move yourself until the algorithm feels obvious.'),
  categories: L('題目分類', 'Categories'),
  problems: L('題目', 'Problems'),
  roadmap: L('NeetCode 150 路線圖', 'NeetCode 150 roadmap'),
  available: L('已上線', 'available'),
  comingSoon: L('即將推出', 'Coming soon'),
  all: L('全部', 'All'),
  difficulty: L('難度', 'Difficulty'),
  status: L('狀態', 'Status'),
  notStarted: L('未開始', 'Not started'),
  learned: L('看過解說', 'Watched'),
  solved: L('模擬通過', 'Solved'),
  noMatch: L('沒有符合條件的題目。', 'No problems match these filters.'),
  clearFilters: L('清除篩選', 'Clear filters'),
  back: L('← 題目列表', '← All problems'),
  learnMode: L('解說', 'Walkthrough'),
  practiceMode: L('練習', 'Practice'),
  input: L('輸入', 'Input'),
  example: L('範例', 'Example'),
  random: L('隨機', 'Random'),
  custom: L('自訂', 'Custom'),
  apply: L('套用', 'Apply'),
  cancel: L('取消', 'Cancel'),
  invalidJson: L('JSON 格式錯誤', 'Invalid JSON'),
  insight: L('解題關鍵', 'Key idea'),
  showInsight: L('顯示解題關鍵', 'Show key idea'),
  hideInsight: L('隱藏解題關鍵', 'Hide key idea'),
  openLeetCode: L('在 LeetCode 開啟', 'Open on LeetCode'),
  step: L('步驟', 'Step'),
  play: L('播放', 'Play'),
  pause: L('暫停', 'Pause'),
  prev: L('上一步', 'Previous'),
  next: L('下一步', 'Next'),
  first: L('回到開頭', 'First'),
  last: L('跳到最後', 'Last'),
  speed: L('速度', 'Speed'),
  tryIt: L('換我練習 →', 'Now you try →'),
  yourMove: L('下一步該做什麼？', 'What is the next move?'),
  hint: L('提示', 'Hint'),
  mistakes: L('失誤', 'Mistakes'),
  steps: L('步數', 'Steps'),
  restart: L('重來', 'Restart'),
  log: L('步驟紀錄', 'Move log'),
  done: L('完成！', 'Done!'),
  perfect: L('零失誤，太強了！', 'Zero mistakes, excellent!'),
  againRandom: L('換一組隨機測資再挑戰', 'Try again with a random input'),
  watchWalkthrough: L('看解說', 'Watch walkthrough'),
  pythonCode: L('Python 解法', 'Python solution'),
  keyboardLearn: L('鍵盤：← → 切換步驟，空白鍵播放', 'Keys: ← → to step, Space to play'),
  keyboardPractice: L('鍵盤：數字鍵選擇操作，H 顯示提示', 'Keys: number keys to choose, H for a hint'),
  empty: L('（空）', '(empty)'),
  top: L('頂端', 'top'),
  notFound: L('找不到這一題。', 'Problem not found.'),
  bestMistakes: L('最佳紀錄', 'Best'),
  footer: L(
    '題目清單參考 NeetCode 150；題目敘述為本站自行改寫，完整題目請至 LeetCode。',
    'Problem list follows NeetCode 150. Descriptions are our own summaries; see LeetCode for full statements.',
  ),
};
