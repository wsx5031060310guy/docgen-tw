"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Order = {
  merchantTradeNo: string;
  status: string;
  amount: number;
  itemName: string;
  paymentMethod?: string | null;
  paymentDate?: string | null;
};

function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const order = searchParams.get("order");
  const [data, setData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!order) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      const res = await fetch(`/api/payment/status?order=${order}`);
      if (!res.ok) {
        if (!cancelled) setLoading(false);
        return;
      }
      const json: Order = await res.json();
      if (cancelled) return;
      setData(json);
      if (json.status === "PENDING" && attempts < 12) {
        setTimeout(poll, 2500);
      } else {
        setLoading(false);
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [order]);

  return (
    <>
      {loading && <p>正在確認付款狀態...</p>}
      {!loading && !data && <p>找不到訂單。</p>}
      {data && (
        <div className="border rounded-xl p-6 bg-white shadow-sm space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">訂單編號</span>
            <span className="font-mono">{data.merchantTradeNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">項目</span>
            <span>{data.itemName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">金額</span>
            <span>NT$ {data.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">狀態</span>
            <span
              className={
                data.status === "PAID"
                  ? "text-green-600 font-semibold"
                  : data.status === "FAILED"
                    ? "text-red-600"
                    : "text-amber-600"
              }
            >
              {data.status === "PAID"
                ? "已付款"
                : data.status === "FAILED"
                  ? "付款失敗"
                  : "處理中"}
            </span>
          </div>
          {data.paymentMethod && (
            <div className="flex justify-between">
              <span className="text-gray-500">付款方式</span>
              <span>{data.paymentMethod}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">付款結果</h1>
      <Suspense fallback={<p>載入中...</p>}>
        <PaymentSuccessInner />
      </Suspense>
    </main>
  );
}
