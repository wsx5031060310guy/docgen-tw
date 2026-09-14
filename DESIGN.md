# DocGen TW 設計規範

## 實際 tokens

- 品牌：`--primary: var(--indigo-800)`、`--primary-soft: var(--indigo-100)`。
- 紙張：`--bg: var(--cream-50)`、`--cream-100`、`--cream-200`。
- 簽署 CTA：`--accent: var(--stamp)`、hover `--stamp-dark`。
- 表面：`--bg-elev: #fff`、`--bg-soft: var(--zinc-50)`。
- 文字：`--ink`、`--ink-soft`、`--ink-muted`。
- 邊框：`--line: var(--zinc-200)`、`--line-soft: var(--zinc-100)`。
- 字體：`--font-sans` 為 UI；`--font-display`／`--font-serif` 為標題與契約。
- 圓角：6／8／12／16px；卡片預設 `--radius-lg`。
- 陰影：卡片使用 Level-1 `--shadow-sm`；浮層才提高層級。

## 乙方簽署頁

- 內容最大寬 1180px、外距 24px、8px 間距階。
- 桌機 ≥960px：`1fr 360px` 雙欄，24px gap；文件自然頁面捲動。
- 桌機行動卡 sticky，`top: 88px`，`max-height: calc(100vh - 104px)` 內捲（面板不得比視窗高，否則簽署鈕要捲到頁尾才看得到）；卡內 24px padding、20px gap。
- 簽署頁上的說明／helper／stepper 文字一律 `--ink-soft`（`--ink-muted` 在白底只有 2.5:1，不過 AA）。
- 卡片使用 1px hairline、Level-1 淡陰影；不用額外品牌色。
- 手機 <960px：寄件人卡 → 文件卡 → 表單卡。
- 手機文件預設 60vh 內捲，可展開全文；底部 sticky 僅放狀態與簽署按鈕。
- 手機頁底保留 96px，所有可點元素最小高度 44px，主 CTA 至少 48px。
- 長契約標題降低字距與字級；載入、錯誤、成功狀態皆保留可見回饋。

## 參考

- VoltAgent awesome-design-md `stripe/DESIGN.md`，commit `8147538`。
- 只取版型、8px 間距、hairline、Level-1 陰影、32px 行動區原則。
- 顏色與字體一律使用 DocGen TW tokens。
