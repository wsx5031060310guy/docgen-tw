# 系統架構

## 專案總覽
DocGen TW 是以 Next.js App Router 為基礎的台灣法律文件自動化服務，核心目標是：使用者可用表單套用合約範本、送出後產生含法條參考的合約，並支援雙方電子簽署、里程碑提醒、付款升級與 API 簽約串接。服務主要提供給個人接案者、律師團隊與小型商務主體。

## 技術棧

| 類別 | 使用技術 | 依據 |
|---|---|---|
| 應用框架 | `next` `react` | `package.json` `dependencies`、`app/` 路由模式 |
| 語言 | `TypeScript` | `package.json` `devDependencies` |
| ORM / 資料 | `prisma` + `@prisma/client`、`PostgreSQL` | `package.json`、`prisma/schema.prisma` |
| API 風格 | Next.js App Router Route Handlers（`app/api/**/route.ts`） | `app/api` 檔案實作 |
| 文件存放 | `@vercel/blob` | `lib/signing_service.ts`（簽名圖片） |
| PDF | `@react-pdf/renderer` | `lib/pdf/render.tsx` |
| 金流 | 自研 NewebPay 串接 | `lib/payment/newebpay.ts` |
| Mail | Mailgun HTTP | `lib/mailgun.ts` |
| AI/風險檢查（選用） | OpenRouter、Smart Router、`llm-risk.ts` | `lib/openrouter.ts`、`lib/router-client.ts` |
| 部署 | Vercel（含 Cron） | `vercel.json`、`README`、`DEPLOY.md` |
| 測試 | Vitest | `package.json` scripts、`tests/` |

## 架構圖
```mermaid
flowchart TB
  U((終端使用者)) -->|"瀏覽/簽署/查詢"| FE["Next.js 前端頁面<br/>/app/*"]
  U -->|第三方整合請求| API["API 路由<br/>/app/api/*"]

  FE --> API
  API -->|"Prisma 查詢/寫入"| DB[("PostgreSQL / Prisma Client")]
  API -->|"簽名檔上傳/讀取"| Blob["Vercel Blob<br/>@vercel/blob"]
  API -->|PDF 渲染| PDF["@react-pdf/renderer<br/>lib/pdf/render.tsx"]
  API -->|Email 寄送| Mailgun[Mailgun API]
  API -->|付款建立與回呼| NewebPay["NewebPay<br/>交易 API"]
  API -->|AI 建議/風險| OpenRouter["OpenRouter / Smart Router"]
  API -->|Webhook 呼叫| Webhook[使用者自訂 Webhook URL]
  API -->|Webhook 重試與排程| Cron["Vercel Cron<br/>/api/cron/reminders"]
  Cron --> API

  API -->|部署| Vercel["Vercel Runtime<br/>next start / next build"]
```

## 主要目錄結構

| 目錄/檔案 | 用途 |
|---|---|
| `app/` | App Router 頁面與 API Route Handlers（`app/page.tsx`、`app/api/.../route.ts`） |
| `app/api/cron/reminders` | 每日到期提醒與 webhook 重試入口 |
| `app/api/admin/*` | 管理員後台 API（合約/用量/推薦/Webhook） |
| `app/api/v1/contracts` | 對外公開 API（API Key） |
| `components/` | 客戶端 UI 元件（簽名筆、表單步驟、預覽等） |
| `lib/` | 核心商務/資料邏輯（合約、案件、付款、風險、Webhook、Email、JWT 無） |
| `lib/payment/` | NewebPay 參數組裝、簽章與解碼 | 
| `lib/i18n/` | 中文/英文字典與路由文案 |
| `prisma/schema.prisma` | 資料模型定義 |
| `prisma.config.ts` | Prisma 設定（`DATABASE_URL`） |
| `DEPLOY.md` | Vercel/Neon/支付的部署檢核清單 |
| `proxy.ts` | locale proxy 與路徑標頭 |
| `next.config.ts` | Next.js 執行緒與 headers 設定 |

## 資料模型（Prisma）
```mermaid
erDiagram
    CONTRACT {
        string id PK
        string templateId
        string uid
        string signingStatus
        datetime createdAt
        datetime updatedAt
    }
    CONTRACT_VERSION {
        string id PK
        string contractId FK
        int version
        json values
        datetime createdAt
    }
    CASE {
        string id PK
        string title
        string status
        datetime createdAt
        datetime updatedAt
    }
    CASE_ATTACHMENT {
        string id PK
        string caseId FK
        string filename
        datetime createdAt
    }
    MILESTONE {
        string id PK
        string contractId FK
        string kind
        string status
        datetime dueDate
        datetime createdAt
    }
    SHARED_CHECK {
        string id PK
        datetime expiresAt
        int views
    }
    LAWYER_REFERRAL {
        string id PK
        string status
        datetime createdAt
    }
    ORDER {
        string id PK
        string merchantTradeNo UK
        string contractId FK
        string uid
        string status
        datetime createdAt
    }
    BILLING_PROFILE {
        string uid PK
        string plan
        datetime periodEnd
    }
    API_KEY {
        string id PK
        string uid
        string hashedKey UK
        string prefix
    }
    MAGIC_LINK {
        string id PK
        string tokenHash UK
        string email
        string uid
        datetime expiresAt
    }
    WEBHOOK_DELIVERY {
        string id PK
        string uid
        string event
        string url
        boolean ok
        boolean succeeded
        datetime createdAt
    }
    USAGE {
        string id PK
        string uid
        string month
        int count
    }

    CASE ||--o{ CONTRACT : contains
    CONTRACT ||--o{ CONTRACT_VERSION : has
    CONTRACT ||--o{ MILESTONE : has
    CASE ||--o{ CASE_ATTACHMENT : has
    CONTRACT ||--o{ ORDER : referenced_by

    BILLING_PROFILE }o--o{ ORDER : "uid（非外鍵關聯）"
    BILLING_PROFILE }o--o{ API_KEY : "uid（非外鍵關聯）"
    BILLING_PROFILE }o--o{ WEBHOOK_DELIVERY : "uid（非外鍵關聯）"
    BILLING_PROFILE }o--o{ USAGE : "uid（非外鍵關聯）"
```

> 註：部分帳務/權限關聯（例如 `uid` 對應）是以欄位值串接，未使用 Prisma 明確 `@relation`。以程式邏輯仍會同時以 `uid` 進行關聯查詢與保護。
