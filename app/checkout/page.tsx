"use client";

import { useState } from "react";
import { CONTRACT_PLANS } from "@/lib/payment/pricing";

export default function CheckoutPage() {
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function pay(planCode: string) {
    setSubmitting(planCode);
    try {
      const res = await fetch("/api/payment/ecpay/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: planCode }),
      });
      if (!res.ok) {
        alert("建立訂單失敗");
        return;
      }
      const { endpoint, params } = await res.json();

      const form = document.createElement("form");
      form.method = "POST";
      form.action = endpoint;
      Object.entries(params as Record<string, string>).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">解鎖完整合約</h1>
      <p className="text-gray-600 mb-8">
        透過綠界（ECPay）完成付款後即可下載完整合約 PDF 並儲存簽署紀錄。
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.values(CONTRACT_PLANS).map((plan) => (
          <div
            key={plan.code}
            className="border rounded-xl p-6 flex flex-col bg-white shadow-sm"
          >
            <h2 className="text-lg font-semibold">{plan.name}</h2>
            <p className="mt-2 text-3xl font-bold">
              NT$ {plan.amount}
              {plan.code === "pro" && (
                <span className="text-sm font-normal text-gray-500"> / 月</span>
              )}
            </p>
            <p className="mt-2 text-sm text-gray-600 flex-1">{plan.description}</p>
            <button
              type="button"
              onClick={() => pay(plan.code)}
              disabled={submitting !== null}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting === plan.code ? "前往付款..." : "立即付款"}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-gray-500">
        測試模式：使用綠界官方測試商店代號 2000132，可用測試卡號
        4311-9522-2222-2222（有效期/CVV 任填，OTP 1234）。正式環境請於 .env 設定
        ECPAY_MERCHANT_ID / HASH_KEY / HASH_IV 並將 ECPAY_ENV 設為 production。
      </p>
    </main>
  );
}
