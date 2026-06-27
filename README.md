# DocGen TW · 台灣法律合約自動產生平台

> 3 分鐘產出附完整中華民國法條依據的合約，雙方電子簽署留存 IP、時間戳與簽名雜湊，並整合藍新金流與催款／到期提醒。

DocGen TW 是台灣場景導向的合約自動化平台，主軸為「範本填寫 → 版本化合約 → 雙方簽署 → 提醒與支付升級」。

專案狀態：
- 架構完整，具備 API、前端、資料模型、外部整合與部署/維運文件。
- 可部署到 Vercel，`DEPLOY.md` 提供生產核對清單。

## 📚 專案文件
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)：系統架構、技術棧、資料模型（含 ER 圖）。
- [`docs/FLOWS.md`](docs/FLOWS.md)：主要業務流程、關鍵時序與路由映射。
- [`docs/PAGES.md`](docs/PAGES.md)：頁面路由、API 端點、授權狀態總覽。
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md)：安裝、環境變數、啟動、部署與維運。

## 快速開始
```bash
npm install
npm run dev
```

## 專案簡介

DocGen TW 是一套針對台灣使用情境設計的法律文件自動化 SaaS。使用者從 10 種常用範本（承攬、NDA、借貸、委任、勞動、租賃、買賣、催款通知書、存證信函草稿、自訂空白）逐欄填表即可產出合約，每一條款都附上對應法令引用。合約支援甲乙雙方線上電子簽署、PDF 匯出存證、規則式（可選 AI 增強）風險檢查，以及案件資料夾、付款里程碑與到期 Email 自動提醒。付費解鎖透過藍新金流（NewebPay）結帳，並提供 Bearer Token 形式的公開 API。

> 免責：本平台提供文件自動化與風險提示，依現行法律一般情形編製，**不取代執業律師意見**。

## 核心功能

- **10 種台灣法律範本**：定義於 `lib/templates.ts`，每個範本含動態欄位、分組、`{{欄位}}` 樣板填充與逐條法令依據（`legal` 陣列）。
- **動態表單 + 即時預覽**：`/contracts/new` 左側填表、右側即時預覽（`components/ContractPreview.tsx`、`Stepper.tsx`），數字自動轉國字大寫（`lib/numberToChinese.ts`）。
- **雙方電子簽署**：手寫簽名板（`components/SignaturePad.tsx`，`react-signature-canvas`），收件方透過簽署連結 `/contracts/[id]/sign?token=...` 簽署；留存簽署時間戳、IP 與 SHA-256 簽名雜湊。合約生命週期 `UNSIGNED → SENDER_SIGNED → AWAITING_RECIPIENT → FULLY_SIGNED`（`lib/services/signing_service.ts`、`lib/contract-store.ts`）。
- **PDF 產出與存證**：`@react-pdf/renderer` 伺服器端渲染（`lib/pdf/render.tsx`），`GET /api/contracts/[id]/pdf` 下載。簽名圖存 Vercel Blob，未設 token 時 dev 下 fallback 至 `public/signatures/`。
- **合約風險檢查**：規則式檢查（`lib/risk-rules.ts`、`risk-rules-text.ts`，含利率上限、永久保密、外國管轄等規則），可選 OpenRouter LLM 增強（`lib/llm-risk.ts` / `openrouter.ts`，預設 `google/gemini-2.5-pro:free`），介面在 `/check`，並可產生可分享連結 `/shared/check/[id]`。
- **案件資料夾 + 里程碑**：`/cases` 管理案件、附件（Case / CaseAttachment），合約可掛 Milestone 付款／交付節點（`lib/milestone-parser.ts`、`case-store.ts`）。
- **到期自動提醒**：每日 Cron `GET /api/cron/reminders`（`vercel.json` 排程 `0 1 * * *`）對 D-7 / D-1 / D-0 / D+1 里程碑寄 Email（Mailgun），逾期可一鍵生成催款通知書草稿，並觸發使用者自訂 webhook（Slack / Discord / Make / n8n / Zapier）。
- **金流與訂閱**：藍新金流結帳（`/checkout` → `POST /api/payment/newebpay/checkout`），背景 `notify` 與前景 `return` 回呼，`Order` / `BillingProfile` 記錄付款與方案（FREE / Pro NT$299 月、Pack NT$499／90 天、單份解鎖 NT$99）。
- **使用者認證**：Email Magic Link 登入（`POST /api/auth/email/start` → `verify`，15 分鐘一次性連結，cookie uid），無密碼。
- **公開 API**：`POST /api/v1/contracts`，`Authorization: Bearer dk_<key>`，沿用 FREE/PRO 額度與速率限制（`lib/rate-limit.ts`）；API Key 僅存 SHA-256 雜湊（`lib/api-keys.ts`），於 `/settings` 管理。
- **後台**：`/admin`（共享金鑰 `ADMIN_KEY` 認證，`lib/admin-auth.ts`），含合約／用量／推薦／webhook 重送與 CSV 匯出（`/api/admin/*`）。
- **雙語 (i18n)**：`zh-TW`（預設）與 `en`（`/en/*`），語系由 `proxy.ts` 注入 `x-pathname` header + `lib/i18n/*` 解析。
- **律師媒合**：免責頁的律師轉介表單與 CTA（`LawyerReferral` 模型、`/api/referrals`）。
- **SEO**：`app/sitemap.ts`、`robots.ts`、`components/JsonLd.tsx`（Organization / SoftwareApplication / WebSite 結構化資料）。

## 技術棧

| 類別 | 使用技術 |
|---|---|
| 框架 | Next.js 16.2.4（App Router）、React 19.2.4 |
| 語言 | TypeScript 5 |
| 樣式 / UI | Tailwind CSS v4、shadcn（base-nova）、@base-ui/react、lucide-react、`class-variance-authority`、`tailwind-merge`、`tw-animate-css` |
| 資料庫 / ORM | PostgreSQL（Neon）、Prisma 6 + `@prisma/client` |
| 檔案儲存 | Vercel Blob（`@vercel/blob`） |
| PDF | `@react-pdf/renderer` |
| 簽名 | `react-signature-canvas` |
| 金流 | NewebPay（藍新金流，`lib/payment/newebpay.ts`，自研 HTTP，無 SDK） |
| Email | Mailgun（`lib/mailgun.ts`，自研 HTTP，無 SDK） |
| AI（選用） | OpenRouter（預設 `google/gemini-2.5-pro:free`） |
| 測試 | Vitest 4（`@vitest/coverage-v8`） |
| 部署 | Vercel（含 Cron） |

## 目錄結構

```
docgen-tw/
├── app/
│   ├── page.tsx                  # 首頁（範本畫廊 / 定價 / 流程）
│   ├── layout.tsx                # 根 layout + metadata + JSON-LD
│   ├── contracts/                # 建立 / 檢視 / 簽署 / 版本
│   ├── cases/                    # 案件資料夾
│   ├── check/                    # 合約風險檢查
│   ├── checkout/ · payment/      # 結帳與付款結果
│   ├── admin/ · settings/        # 後台 / 帳號設定
│   ├── en/                       # 英文版頁面
│   └── api/                      # 路由 handlers（contracts / cases / milestones
│                                 #   / payment / auth / billing / admin / cron / v1 …）
├── components/                   # React UI 元件（SignaturePad、Stepper、TopNav …）
├── lib/
│   ├── templates.ts              # 10 種合約範本定義（核心）
│   ├── contract-store.ts · case-store.ts
│   ├── payment/                  # newebpay.ts · pricing.ts
│   ├── pdf/render.tsx            # PDF 渲染
│   ├── risk-rules*.ts · llm-risk.ts · openrouter.ts
│   ├── mailgun.ts · notify.ts · webhooks.ts
│   ├── api-keys.ts · billing.ts · rate-limit.ts · admin-auth.ts
│   └── i18n/                     # 多語系字典與 locale 解析
├── data/templates/contract_types.json
├── prisma/schema.prisma          # 12 個 model（Contract / Case / Milestone / Order …）
├── tests/                        # Vitest 單元測試（newebpay / risk-rules / csv …）
├── proxy.ts                      # 注入 x-pathname header（locale 用）
├── vercel.json                   # Cron 排程
├── DEPLOY.md                     # 部署 checklist
└── next.config.ts · prisma.config.ts · vitest.config.ts
```

## 本機開發

需求：Node.js 20+、一個 PostgreSQL 連線字串（建議 [Neon](https://neon.tech)）。

```bash
# 1. 安裝依賴（postinstall 會自動跑 prisma generate）
npm install

# 2. 設定環境變數（見下方）
#    本機可用 Vercel CLI 拉線上變數：
vercel env pull .env.local

# 3. 推送 schema 到資料庫
npm run db:push

# 4. 啟動開發伺服器
npm run dev
```

開啟 http://localhost:3000。

其他指令：

```bash
npm run build      # prisma generate + prisma db push + next build
npm run start      # 啟動 production server
npm run lint       # ESLint
npm test           # Vitest（含 NewebPay TradeSha regression）
npm run db:migrate # prisma migrate deploy
```

> 多數功能（建立合約、認證、里程碑）在未連資料庫時會回傳 503 或降級，請先設好 DB 連線。OpenRouter / Mailgun / Blob / NewebPay 未設定時各自 graceful fallback 或回報「未設定」，不會中斷主流程。

## 環境變數

以實際 `process.env` 引用整理（本專案 `.gitignore` 排除所有 `.env*`，未附 `.env.example`）。

### 資料庫（必填）

| 變數 | 必填 | 說明 |
|---|---|---|
| `DATABASE_POSTGRES_PRISMA_URL` | ✅ | Prisma 應用查詢用的 **pooled** 連線（`schema.prisma` `url`，Vercel + Neon 整合自動注入） |
| `DATABASE_URL_UNPOOLED` | ✅ | migration 用的 **direct** 連線（`schema.prisma` `directUrl`） |
| `DATABASE_URL` | ✅ | 應用層判斷「DB 是否已設定」的旗標（多處 API gating 與 `prisma.config.ts` 讀取）；通常與 pooled URL 同值 |

> Vercel 的 Neon 整合會自動注入前兩者；本機請手動補齊（三者可指向同一 Neon DB）。

### 金流 — NewebPay 藍新（啟用付費時必填）

| 變數 | 必填 | 說明 |
|---|---|---|
| `NEWEBPAY_MERCHANT_ID` | ⬜ | 商店代號 |
| `NEWEBPAY_HASH_KEY` | ⬜ | HashKey（32 bytes） |
| `NEWEBPAY_HASH_IV` | ⬜ | HashIV（16 bytes） |
| `NEWEBPAY_API_BASE` | ⬜ | `https://core.newebpay.com`（正式）/ `https://ccore.newebpay.com`（測試） |

> TradeSha 公式為 `SHA256("HashKey={KEY}&{tradeInfoHex}&HashIV={IV}")`，**無** `TradeInfo=` 前綴；`tests/newebpay.test.ts` 鎖定此規則。

### Email — Mailgun（簽署完成 / 登入連結 / 到期提醒；未設則略過寄信）

| 變數 | 必填 | 說明 |
|---|---|---|
| `MAILGUN_API_KEY` | ⬜ | API Key |
| `MAILGUN_DOMAIN` | ⬜ | 寄件網域 |
| `MAILGUN_FROM` | ⬜ | 寄件者（預設 `DocGen TW <noreply@{domain}>`） |
| `MAILGUN_API_BASE` | ⬜ | 預設 `https://api.mailgun.net/v3`（EU 區改 `api.eu.mailgun.net`） |

### 檔案儲存 — Vercel Blob

| 變數 | 必填 | 說明 |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | ⬜ | 簽名圖儲存；Vercel 連 Blob Store 後自動注入。未設時 dev 下 fallback 至 `public/signatures/` |

### AI 風險檢查（選用）

| 變數 | 必填 | 說明 |
|---|---|---|
| `OPENROUTER_API_KEY` | ⬜ | 啟用 `/check` 的 LLM 增強；未設則只跑規則式檢查 |
| `OPENROUTER_MODEL` | ⬜ | 預設 `google/gemini-2.5-pro:free` |
| `SMART_ROUTER_URL` | ⬜ | 自架智慧路由端點（`lib/router-client.ts`） |

### 站台 URL / Cron / 後台 / 通知

| 變數 | 必填 | 說明 |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | ⬜ | 站台對外 URL（簽署連結、metadata、回呼 origin）。預設 `https://docgen-tw.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | ⬜ | 站台 URL（部分連結 origin 使用） |
| `CRON_SECRET` | ⬜ | 保護 `/api/cron/reminders`；未設時該端點開放（僅建議 dev） |
| `ADMIN_KEY` | ⬜ | `/admin` 後台共享金鑰；未設時後台一律拒絕 |
| `ADMIN_ALERT_WEBHOOK` | ⬜ | 系統告警 webhook |
| `WEBHOOK_FAIL_ALERT_THRESHOLD` | ⬜ | webhook 連續失敗告警門檻 |
| `REFERRAL_NOTIFY_TO` | ⬜ | 律師媒合表單通知收件信箱 |

## 部署（Vercel）

完整步驟見 [`DEPLOY.md`](DEPLOY.md)。摘要：

1. **資料庫**：在 Vercel 接上 Neon 整合（自動注入 `DATABASE_POSTGRES_PRISMA_URL` / `DATABASE_URL_UNPOOLED`），並補上 `DATABASE_URL`。
2. **Blob**：Vercel → Storage → 建立 Blob Store 並 connect 至專案，`BLOB_READ_WRITE_TOKEN` 自動注入。
3. **金流 / Email**：於 Project Settings → Environment Variables 填入 NewebPay 與 Mailgun 變數（去除前後空白）。
4. **Cron**：`vercel.json` 已定義 `/api/cron/reminders` 每日 `0 1 * * *`，建議設 `CRON_SECRET` 保護。
5. **部署**：

   ```bash
   vercel link
   vercel --prod
   ```

   `build` script 會自動 `prisma generate` + `prisma db push` + `next build`。

部署後驗證清單（範本畫廊、建立合約寫入 DB、簽名圖 URL、結帳導向、雙方簽署達 `FULLY_SIGNED` 等）見 `DEPLOY.md` §6。

## 授權

Private — All rights reserved.（本倉庫 `private: true`，未附 LICENSE 檔案。）
