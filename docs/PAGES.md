# 頁面 / 路由 / 模組清單

## Web 路由（頁面）

| 路徑 | 用途 | 是否需登入 |
|---|---|---|
| `/` | 首頁、範本列表、導覽 | 否 |
| `/refund` | 退款頁（靜態） | 否 |
| `/check` | 合約條文風險檢查頁 | 否 |
| `/en` | 英文首頁 | 否 |
| `/en/check` | 英文風險檢查頁 | 否 |
| `/disclaimer` | 免責聲明與律師轉介入口 | 否 |
| `/en/disclaimer` | 英文免責/律師轉介入口 | 否 |
| `/contracts` | 合約列表（依照 API 回傳顯示） | 否（資料可透過 GET 取得） |
| `/contracts/new` | 建立合約（範本填表） | 否（會建立/讀取 `docgen_uid`） |
| `/contracts/[id]` | 合約明細與里程碑 | 否（GET 無 owner filter） |
| `/contracts/[id]/versions` | 修改紀錄與版本差異 | 需 `uid`，不符時回傳空清單 |
| `/contracts/[id]/sign` | 收件方簽署頁 | 不需登入，需 token |
| `/cases` | 案件清單 | 否 |
| `/cases/[id]` | 案件細節/上傳附件 | 否 |
| `/templates/[id]` | 中文範本預覽/複製 | 否 |
| `/en/templates/[id]` | 英文範本預覽/複製 | 否 |
| `/admin` | 管理後台 | 否（需 `?key=` 或 cookie） |
| `/settings` | 帳號設定、Web API 金鑰、magic link | 否（無 UID 則可讀取匿名 profile） |
| `/terms` | 服務條款 | 否 |
| `/privacy` | 隱私權 | 否 |
| `/payment/success` | 付款完成結果頁 | 否 |
| `/shared/check/[id]` | 風險檢查分享頁 | 否 |

## API 端點

| 方法 | 路徑 | 用途 | 存取規則 |
|---|---|---|---|
| `GET` | `/api/admin/overview` | 後台總覽 | `ADMIN_KEY` 或授權 cookie（`lib/admin-auth.ts`） |
| `GET` | `/api/admin/webhooks` | 後台 webhook 串流紀錄 | 管理者 |
| `POST` | `/api/admin/webhooks/retry` | 管理者手動重試 pending webhook | 管理者 |
| `GET` | `/api/admin/contracts` | 後台合約清單 | 管理者 |
| `PATCH` | `/api/admin/contracts` | 變更合約 `uid/caseId` | 管理者 |
| `DELETE` | `/api/admin/contracts` | 刪除合約（可 `force`） | 管理者 |
| `GET` | `/api/admin/export/{type}` | 匯出 CSV（contracts/orders/referrals/usage/deliveries） | 管理者 |
| `GET` | `/api/admin/usage` | 用量與付費 KPI | 管理者 |
| `GET` | `/api/admin/referrals` | 轉介案件清單 | 管理者 |
| `PATCH` | `/api/admin/referrals` | 更新轉介狀態/備註 | 管理者 |
| `GET` | `/api/auth/email/verify` | magic link 驗證並綁定 UID | 公開 |
| `POST` | `/api/auth/email/start` | 寄送 magic link（15 分鐘） | 公開（無登入需求） |
| `GET` | `/api/billing/status` | 取得 UID/方案/用量 | 公開，必要時回寫 `docgen_uid` |
| `GET` | `/api/billing/profile` | 讀取 BillingProfile | 公開（無 UID 時回寫匿名 UID） |
| `PATCH` | `/api/billing/profile` | 更新 email / webhook 設定 | 需 `docgen_uid` |
| `GET` | `/api/billing/api-keys` | 列出 API Key | 需 `docgen_uid` |
| `POST` | `/api/billing/api-keys` | 建立 API Key | 需 `docgen_uid` |
| `DELETE` | `/api/billing/api-keys` | 收回 API Key | 需 `docgen_uid` |
| `POST` | `/api/check-text` | 條文風險檢查 | 公開 + IP rate limit |
| `POST` | `/api/risk-check` | 表單欄位風險檢查 | 公開 |
| `POST` | `/api/clause-suggest` | AI 條款建議 | 公開 |
| `GET` | `/api/contracts` | 合約清單（目前無 owner filter） | 公開 |
| `POST` | `/api/contracts` | 建立合約 | 需 `docgen_uid`，必要時自動產生 |
| `GET` | `/api/contracts/[id]` | 查某一合約（含里程碑） | 公開 |
| `PATCH` | `/api/contracts/[id]` | 連結 case / 更新 `expiryDate` | 目前無身份驗證 |
| `GET` | `/api/contracts/[id]/sign-fetch` | 依 token 讀取收件簽署資料 | token 驗證 |
| `POST` | `/api/contracts/[id]/recipient-sign` | 收件方上傳簽名 | token 驗證 |
| `GET` | `/api/contracts/[id]/pdf` | 下載合約 PDF | token 驗證 + 簽署狀態檢查 |
| `GET` | `/api/contracts/[id]/versions` | 版本清單（含當前值） | UID（不符不回錯，回空） |
| `PATCH` | `/api/contracts/[id]/values` | 送件人更新欄位、建立版本快照 | sender uid 驗證 |
| `POST` | `/api/cases` | 建立案件 | 公開 |
| `GET` | `/api/cases` | 讀取案件列表 | 公開 |
| `GET` | `/api/cases/[id]` | 讀取單一案件 | 公開 |
| `PATCH` | `/api/cases/[id]` | 案件掛上 contractId | 公開 |
| `POST` | `/api/cases/[id]/attachments` | 上傳案件附件到 Vercel Blob | 公開 |
| `POST` | `/api/milestones` | 建立里程碑 | 公開 |
| `PATCH` | `/api/milestones/[id]` | 更新里程碑狀態 | 公開 |
| `GET` | `/api/milestones/[id]/dunning-prefill` | 根據到期/逾期生成催款預填值 | 公開 |
| `GET` | `/api/payment/status` | 查詢 `merchantTradeNo` 狀態 | 公開 |
| `POST` | `/api/payment/newebpay/checkout` | 建立 NewebPay 訂單參數 | 需 UID（無則自建） |
| `POST` | `/api/payment/newebpay/return` | 付費回傳頁面導向 | 由支付 callback 呼叫 |
| `POST` | `/api/payment/newebpay/notify` | 支付結果最終授權 | 無條件（第三方回呼） |
| `POST` | `/api/referrals` | 提交律師轉介表單 | 公開 |
| `POST` | `/api/v1/contracts` | 對外合約 API（Rate Limit） | `Authorization: Bearer dk_*` |
| `GET` | `/api/cron/reminders` | 每日提醒與 webhook 重試 | `CRON_SECRET`（未設定時可直接叫） |

## 註記
- `app/api/cases`、`app/api/cases/[id]`、`/api/milestones`、`/api/contracts/[id]` 目前皆未做完整使用者隔離；若要做多租戶，需補強 `uid` 權限控管。
