# AlgoSim — 演算法手動模擬練習

把 NeetCode 150 的演算法變成「一步一步親手操作」的練習。每一題有兩種模式：

- **▶ 解說**：自動播放每一步，配上文字說明，同步標出 Python 程式碼正在執行的那一行。
- **✋ 練習（手動模擬）**：直接把畫面上的方塊拖到正確位置，例如把今天的溫度拖進 stack、把頂端拖到 res 結算。拿錯方塊或放錯位置，方塊會彈回去並說明原因；放對了才會前進。手機上可以拖曳，也可以先點方塊、再點目的地。提示分三層：概念 → 要拿的方塊發光 → 示範拖曳路徑。（目前「每日溫度」是拖曳版，其他題暫時還是按鈕版。）

輸入可以用範例、🎲 隨機產生，或自訂 JSON。換一組測資，就不能靠背答案過關。介面支援繁體中文和英文。

## 目前題目（MVP）

| 分類 | 題目 |
|---|---|
| 雙指標 | 125 Valid Palindrome · 167 Two Sum II · 11 Container With Most Water |
| 滑動視窗 | 121 Best Time to Buy and Sell Stock · 3 Longest Substring Without Repeating Characters |
| 堆疊 | 20 Valid Parentheses · 150 Evaluate Reverse Polish Notation · 739 Daily Temperatures |
| 二分搜尋 | 704 Binary Search · 153 Find Minimum in Rotated Sorted Array |

首頁會列出 NeetCode 150 全部 18 個分類，標出各分類已上線的題數，也可以依分類、難度、進度篩選。進度存在瀏覽器的 localStorage。

## 開發

```bash
npm install
npm run dev      # 本機開發
npm test         # 每題用 300 組隨機測資驗證
npm run build
```

推上 `main` 後，GitHub Actions 會自動部署到 GitHub Pages。第一次要先到 Settings → Pages，把 Source 設成「GitHub Actions」。

## 架構

```
src/core/types.ts      Problem 介面：一題就是一個小型狀態機
src/core/engine.ts     buildTrace（解說模式）、judge（練習模式判斷對錯）、hintsFor
src/problems/*.ts      每題一個檔案
src/components/        Scene（陣列、長條圖、堆疊、集合、變數）、CodePanel、Learn/Practice 模式
```

每一題要實作的東西：

- `init(input)`：產生初始狀態
- `options(state)`：要顯示的操作按鈕
- `correct(state)`：目前這一步「哪些操作算對」，可以有多個
- `apply(state, action)`：執行操作，回傳下一個狀態
- `explain` / `whyWrong` / `hints`：雙語的說明文字
- `scene(state)`：要畫出的圖層
- `code` + `lineOf`：Python 解法，以及每個操作對應到哪一行
- `verify(input, answer)`：用暴力解交叉驗證答案
- `drag`（選填）：拖曳規則。`moves(state)` 列出正確的「從哪拖到哪」，`whyWrong(state, from, to)` 說明錯在哪。場景圖層用 `dragPrefix` / `dropPrefix` / `dropId` 標記可拖與可放的位置

解說模式就是一直執行 `correct(state)[0]`，所以隨機測資不用額外寫任何東西就能播放。

### 新增一題

1. 在 `src/problems/` 新增檔案，實作 `Problem<I, S>`
2. 加進 `src/problems/index.ts` 的 `PROBLEMS`
3. `npm test` 會自動用隨機測資檢查：每條合法路徑都能得到正確答案，每個按鈕都有回饋文字

## 授權說明

題目清單參考 NeetCode 150。題目敘述是本站自己改寫的摘要，完整題目請到 LeetCode 查看。
