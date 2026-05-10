# DocGen TW — Vercel 部署 Checklist

## 1. Neon Postgres
1. https://neon.tech 開新 DB（region SG/AP 最佳）
2. 複製 `Pooled connection string`
3. Vercel Project Settings → Environment Variables：
   - `DATABASE_URL` = pooled URL（含 `?sslmode=require`）

## 2. Vercel Blob（簽名圖儲存）
1. Vercel Dashboard → Storage → Create Blob Store → 命名 `docgen-signatures` → connect 到 docgen-tw
2. `BLOB_READ_WRITE_TOKEN` 會自動注入；本地 dev 可：
   ```
   vercel env pull .env.local
   ```
3. 沒設 token 時自動 fallback 到 `public/signatures/`（dev only）

## 3. NewebPay（藍新金流）
四個必要 env（去除前後空白）：
- `NEWEBPAY_MERCHANT_ID`
- `NEWEBPAY_HASH_KEY` （32 bytes）
- `NEWEBPAY_HASH_IV`  （16 bytes）
- `NEWEBPAY_API_BASE` = `https://core.newebpay.com`（**production**）/ `https://ccore.newebpay.com`（sandbox）

⚠️ TradeSha 公式：`SHA256("HashKey={KEY}&{tradeInfoHex}&HashIV={IV}")` — **沒有** `TradeInfo=` 前綴。`tests/newebpay.test.ts` 已鎖此規則。

## 4. 站台 URL
- `NEXT_PUBLIC_SITE_URL` = `https://docgen-tw.vercel.app`（用於收件方簽署連結 origin）

## 5. 部署
```bash
# 連接 repo（首次）
vercel link

# Push schema 到 Neon（首次或 schema 改動）
DATABASE_URL="<neon url>" npx prisma db push

# 部署到 production
vercel --prod
```

## 6. 部署後驗證
1. `GET /` → 模板畫廊載入
2. `POST /api/contracts` → 建立合約 → 確認 Neon `Contract` 表有資料
3. 簽名圖 url 是 `https://*.public.blob.vercel-storage.com/...`（不是 `/signatures/...`）
4. `/checkout` → 任選方案 → 跳到 `core.newebpay.com` 而非 sandbox
5. NewebPay 測試卡：`4000-2211-1111-1111` / 任意未來月份 / 任意 3 碼 CVV
6. 付款回 `/payment/success?order=...` → 顯示「已付款」
7. 收件方用 `/contracts/[id]/sign?token=...` 完成簽署 → DB `signingStatus = FULLY_SIGNED`

## Smoke Test 腳本（local）
```bash
npm test              # NewebPay TradeSha regression
npm run build         # tsc + next build
```
