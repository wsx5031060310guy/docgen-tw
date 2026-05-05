import crypto from "crypto";

export type EcpayConfig = {
  merchantId: string;
  hashKey: string;
  hashIV: string;
  endpoint: string;
};

export function getEcpayConfig(): EcpayConfig {
  const isProd = process.env.ECPAY_ENV === "production";
  return {
    merchantId: process.env.ECPAY_MERCHANT_ID || "2000132",
    hashKey: process.env.ECPAY_HASH_KEY || "5294y06JbISpM5x9",
    hashIV: process.env.ECPAY_HASH_IV || "v77hoKGq4kWxNNIS",
    endpoint: isProd
      ? "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5"
      : "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
  };
}

function ecpayUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/%2D/g, "-")
    .replace(/%5F/g, "_")
    .replace(/%2E/g, ".")
    .replace(/%21/g, "!")
    .replace(/%2A/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")");
}

export function buildCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string
): string {
  const sorted = Object.keys(params)
    .filter((k) => k !== "CheckMacValue")
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;
  const encoded = ecpayUrlEncode(raw).toLowerCase();
  return crypto.createHash("sha256").update(encoded).digest("hex").toUpperCase();
}

export function buildCheckoutParams(input: {
  merchantTradeNo: string;
  amount: number;
  itemName: string;
  tradeDesc?: string;
  returnUrl: string;
  clientBackUrl: string;
  orderResultUrl?: string;
}) {
  const { merchantId, hashKey, hashIV, endpoint } = getEcpayConfig();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const merchantTradeDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(
    now.getDate()
  )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const params: Record<string, string> = {
    MerchantID: merchantId,
    MerchantTradeNo: input.merchantTradeNo,
    MerchantTradeDate: merchantTradeDate,
    PaymentType: "aio",
    TotalAmount: String(input.amount),
    TradeDesc: input.tradeDesc || "DocGen TW Contract",
    ItemName: input.itemName,
    ReturnURL: input.returnUrl,
    ClientBackURL: input.clientBackUrl,
    ChoosePayment: "ALL",
    EncryptType: "1",
  };

  if (input.orderResultUrl) {
    params.OrderResultURL = input.orderResultUrl;
  }

  params.CheckMacValue = buildCheckMacValue(params, hashKey, hashIV);

  return { endpoint, params };
}

export function verifyCallback(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string
): boolean {
  const provided = params.CheckMacValue;
  if (!provided) return false;
  const expected = buildCheckMacValue(params, hashKey, hashIV);
  return provided.toUpperCase() === expected.toUpperCase();
}
