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

## 全站 UI 契約

- UI 字級採 opt-in 命名 class：頁標 `--text-title` 28/1.3、區標 `--text-section` 20/1.4、小標 `--text-subsection` 16/1.5，皆 weight 600；正文 `--text-body` 16/1.6、次要 `--text-secondary` 14/1.6、helper/chip `--text-helper` 12/1.5。價格展示僅用 `.dg-price` 32px。
- UI 文字（含 placeholder、helper、metadata、未啟用 stepper）使用 `--ink` 或 `--ink-soft`。`--ink-muted` 僅供裝飾、分隔線與真正 disabled 狀態，不作一般文字色。
- 布局間距採 `--space-1/2/3/4/5/6/8`（8/16/24/32/40/48/64px）。4px 僅圖文微距及 chip 4×8；1px hairline、44px 觸控目標不屬間距階。已驗收簽署流程 20px gap 暫留，待該頁專批處理。
- `.dg-page-shell` 為 1180px border-box 版心，桌機水平 padding 24px、手機 16px；`.dg-page-shell--reading` 880px、`.dg-page-shell--form` 760px。頁首、section、stack、toolbar 使用對應 `.dg-*` 命名 class，避免巢狀版心重複 padding。
- `.card` 固定 1px `--line`、12px、Level-1；hover 不浮高、不位移。內容 padding 24px，compact 16px。selected/featured 使用 1px 語意邊框，不改盒模型。
- `.btn` 最小 44px，`.btn-lg` 最小 48px；導頁使用 Link/a，操作使用 button。disabled 與 `aria-disabled=true` 不啟動，pending 同時提供文字與 `aria-busy`。
- input/select/textarea 最小 44px、16px 字；visible label 對唯一 id，helper/error 由 `aria-describedby` 關聯，error 同時設 `aria-invalid`。一般 helper 使用 `--ink-soft`。
- `.dg-state` 支援 loading/empty/error/success；一般更新用 polite status，需處理錯誤用 alert。`.dg-notice--*` 以文字與語意色雙重表達，不只靠顏色。
- focus 使用 `:focus-visible` 清楚外框；互動目標至少 44px。`prefers-reduced-motion` 關閉非必要動畫。

## 相容與例外

- 舊 `.container`、heading、button、card、field class 保留；新頁逐批 opt-in，不全站硬改。
- `ContractPreview` 是文件表面：使用 `.dg-document-*` 與契約字體，不套 UI 字級；紙紋、章節編號、長標題 24px/短標題 30px、scale、簽名圖尺寸與座標保留。
- 簽署頁沿用 20px 已驗收 gap、59px `SignTopBar`、桌機 `top: 88px` / `max-height: calc(100vh - 104px)`、手機文件 60vh 與頁底 96px。不得以全域間距替換破壞基準。

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

## P19 全站收尾基準（2026-09-14）

- 全站驗收盤點涵蓋 22 個非 admin 頁面：`/`、`/check`、`/checkout`、`/payment/success`、`/contracts`、`/contracts/new`、`/contracts/[id]`、`/contracts/[id]/sign`、`/contracts/[id]/versions`、`/cases`、`/cases/[id]`、`/settings`、`/templates/[id]`、`/shared/check/[id]`、`/terms`、`/privacy`、`/refund`、`/disclaimer`、`/en`、`/en/check`、`/en/disclaimer`、`/en/templates/[id]`。
- 未知路由使用全站 `not-found`；未預期 render/data error 使用全站 `error`。兩者提供中英可讀 fallback 與回首頁路徑。`error` 的重試只呼叫 Next `unstable_retry()` 重取 segment，不直接呼叫付款、寄信、webhook 或其他 POST。
- 分享快照保留 segment 級 loading/error/not-found；missing、expired、缺 DB 與 DB failure 外觀一致，但效期、`noindex`、views increment 語意不變。
- 已移除 repo 零引用的 `.pulse-ring`、`.dg-sign-bottom-grid`、`.dg-autosave-indicator`、`.nav-trust`，以及依 inline style 結構猜測版型的 `#pricing > div[style*=auto-fit]`。手機全域 heading `!important` 已移除；頁面字級由 `.dg-page-title`、`.dg-section-title`、`.dg-subsection-title` 明示。

### 有意保留例外

- `app/admin` 不納入 22 頁視覺改造；只接受全域 token/base CSS，需以 smoke 確認無新增破壞。
- `.container`、`.container-narrow` 與既有 `.gap-*` 保留相容。`.gap-1`、`.gap-3` 仍有首頁／英文頁／導覽引用，不重新定義。
- `ContractPreview`／簽署 UI 的 `!important` 僅用於覆寫既有 inline 文件尺寸、紙張 padding、簽名表面與長短標題；PDF renderer 不共用這些 CSS，禁止藉收尾批改 PDF。
- `no-texture` 與 `prefers-reduced-motion` 的 `!important` 分別確保顯式移除紙紋及停用動態；屬使用者偏好優先級。
- 其餘手機 `!important` 暫留於仍有 inline style 或舊 selector specificity 的相容宿主（舊 container、付款列、首頁 trust/filter、TopNav、PlanCard、設定 raw key）。後續只能在宿主完成命名化後逐項移除。

### 簽署頁回歸基準

- 桌機：1180px 版心、文件 `minmax(0, 1fr)`＋操作欄 360px、24px gap；操作欄 `top: 88px`、`max-height: calc(100vh - 104px)` 並可內捲。
- 手機：寄件人 → 文件 → 表單；文件預設 60vh 可展開，固定底部 CTA 可達，頁底保留 96px。
- 長／短標題、六頁合約、未簽／已簽、錯誤／成功與下載失敗皆以此基準比對。V/S 與 web-ui-validator 報告由驗收者另行簽核，不以 tsc/vitest 代替。
- 本分支的四個英文頁目前仍有 inline heading 與一般文字 `--ink-muted`；這不是有意例外。移除全域手機 heading 強制規則後，22 頁視覺簽核前須退回英文頁批次命名化並重驗。
