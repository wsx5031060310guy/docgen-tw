# 操作與業務流程

## 1) 建立合約與寄出簽署連結
```mermaid
flowchart TD
  U[使用者] -->|編輯欄位、輸入簽名| PageNew["/contracts/new"]
  PageNew -->|"POST /api/contracts"| ApiContracts["app/api/contracts/route.ts"]
  ApiContracts -->|buildContractDocument| Tmpl["lib/templates.ts"]
  ApiContracts -->|createContract| Store["lib/contract-store.ts"]
  ApiContracts -->|persistSignaturePng| SignSvc["lib/services/signing_service.ts"]
  ApiContracts -->|parseMilestonesFromValues| MS["lib/milestone-parser.ts"]
  ApiContracts -->|"incrementUsage / getBillingStatus"| Billing["lib/billing.ts"]
  ApiContracts -->|回傳 signingToken + recipientSignUrl| PageNew
```

使用者在 `/contracts/new` 產生草稿並送出後，後端先判斷 `uid` 與額度，再建立 `Contract`、簽名圖、可選自動里程碑。回傳資料含 `signingToken` 與簽署連結。

## 2) 收件方簽署流程
```mermaid
sequenceDiagram
  autonumber
  participant S as 收件方
  participant SignPage as /contracts/[id]/sign
  participant SignFetch as /api/contracts/[id]/sign-fetch
  participant RecipientSign as /api/contracts/[id]/recipient-sign
  participant Notify as lib/notify.ts + lib/webhooks.ts

  S->>SignPage: 開啟簽署連結（含 token）
  SignPage->>SignFetch: GET /api/contracts/{id}/sign-fetch?token=...
  SignFetch-->>SignPage: 回傳合約資料 + 進度
  S->>RecipientSign: POST /api/contracts/{id}/recipient-sign（token + signature）
  RecipientSign->>RecipientSign: recordRecipientSignature
  RecipientSign-->>S: 回傳簽署完成
  RecipientSign-->>Notify: after() notifyFullySigned + fireUserWebhook（非同步）
```

收件方需憑 token 進入，不需登入。簽署成功後會更新 `Contract.signingStatus`，並觸發 PDF/郵件通知與 webhook。

## 3) 合約風險檢查流程
```mermaid
flowchart TD
  U[使用者] -->|貼上條文| CheckPage["/check"]
  CheckPage -->|"POST /api/check-text"| CheckText["app/api/check-text/route.ts"]
  CheckText -->|runTextOnlyRiskCheck| RuleCheck["lib/risk-rules-text.ts"]
  CheckText -->|runLlmRiskCheck| LlmCheck["lib/llm-risk.ts"]
  CheckText -->|summarizeRisk| Summarize["lib/risk-rules-text.ts"]
  CheckText -->|需要 shareId| DB[("PostgreSQL<br/>sharedCheck")]
  CheckText -->|summary + findings + shareId| CheckPage
```

`/check` 會做規則式掃描並可選啟用 LLM 強化。`/api/check-text` 具備 IP Rate Limit，超過上限會回傳 429。

## 4) 付款啟動到訂閱啟用
```mermaid
flowchart TD
  U["/checkout/"] -->|"POST /api/payment/newebpay/checkout"| Checkout["/api/payment/newebpay/checkout"]
  Checkout -->|buildCheckoutPayload| NPay["lib/payment/newebpay.ts"]
  Checkout -->|寫入 Order| DB[(Order)]
  NPay -->|回傳 gateway params| Gateway[NewebPay]
  Gateway -->|"POST /api/payment/newebpay/return"| Return["app/api/payment/newebpay/return"]
  Gateway -->|"POST /api/payment/newebpay/notify"| Notify["app/api/payment/newebpay/notify"]
  Notify -->|activatePro| Billing["lib/billing.ts"]
  Notify -->|回傳 0| Gateway
  Return -->|導回| PaymentSuccess["/payment/success"]
```

`/checkout` 建立 `Order` 後導向藍新付款。實際付款狀態以伺服器 `notify` 為準，成功時透過 `activatePro` 更新 `BillingProfile`。

## 5) 到期提醒 cron 與 webhook 重試
```mermaid
flowchart TD
  Cron[Vercel Cron<br/>/api/cron/reminders] -->|GET| Reminders[app/api/cron/reminders/route.ts]
  Reminders -->|listMilestonesNeedingReminder| Milestones[lib/case-store.ts]
  Reminders -->|markOverdue| Milestones
  Reminders -->|sendEmail| Mailgun[lib/mailgun.ts]
  Reminders -->|fireUserWebhook / retryPendingWebhooks| Webhook[lib/webhooks.ts]
  Reminders -->|deleteMany sharedCheck| DB[(SharedCheck)]
```

排程每日執行 D7/D1/D0/D+1 提醒，並對未過期未送出的 webhook 做重試，最後回傳本次發送/跳過結果。
