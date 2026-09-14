"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BillingBanner } from "@/components/BillingBanner";
import { Icon } from "@/components/Icon";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { TopNav } from "@/components/TopNav";
import { COMPANY } from "@/lib/company";

type Order = {
  merchantTradeNo: string;
  status: string;
  amount: number;
  itemName: string;
  paymentMethod?: string | null;
  paymentDate?: string | null;
};

type QueryPhase = "checking" | "pending" | "paid" | "failed" | "timeout" | "http-error" | "network-error" | "unknown";
type DisplayPhase = QueryPhase | "missing";

const STATE_CONTENT: Record<DisplayPhase, { icon: string; title: string; description: string; tone: string; spin?: boolean }> = {
  checking: { icon: "loader", title: "正在確認付款結果", description: "正在向 NewebPay 查詢伺服器端的訂單狀態。", tone: "info", spin: true },
  pending: { icon: "loader", title: "付款尚待確認", description: "伺服器目前回傳 PENDING；頁面會每 2.5 秒自動重查。", tone: "warning", spin: true },
  paid: { icon: "check", title: "付款成功", description: "感謝你！合約額度已加值至帳戶。", tone: "success" },
  failed: { icon: "x", title: "付款失敗", description: "伺服器已確認交易失敗。請重新付款或聯繫客服。", tone: "error" },
  timeout: { icon: "clock", title: "確認付款結果逾時", description: "已完成 12 次查詢，但伺服器仍回傳 PENDING。這不代表付款失敗，可稍後重新查詢。", tone: "warning" },
  "http-error": { icon: "alertOctagon", title: "訂單查詢失敗", description: "付款查詢服務回傳錯誤，無法確認目前狀態。", tone: "error" },
  "network-error": { icon: "alertOctagon", title: "無法連線查詢", description: "網路連線失敗，尚未確認付款結果。請檢查連線後重試。", tone: "error" },
  unknown: { icon: "alert", title: "無法辨識付款狀態", description: "伺服器回傳未支援的狀態。請重新查詢或聯繫客服。", tone: "warning" },
  missing: { icon: "alert", title: "缺少訂單編號", description: "網址沒有 order 參數，因此未發出付款狀態查詢。", tone: "warning" },
};

function OrderStatus({ order, phase }: { order: Order | null; phase: DisplayPhase }) {
  const status = order?.status.toUpperCase();
  if (status === "PAID" || status === "PENDING" || status === "FAILED") {
    return <PaymentStatusBadge status={status} />;
  }
  if (status) return <span className="chip chip-zinc dg-payment-status">{status} · 未知狀態</span>;
  if (phase === "checking") {
    return <span className="chip chip-zinc dg-payment-status" role="status" aria-busy="true">查詢中</span>;
  }
  return null;
}

function SuccessInner() {
  const params = useSearchParams();
  const orderNo = params.get("order");
  const [order, setOrder] = useState<Order | null>(null);
  const [phase, setPhase] = useState<QueryPhase>("checking");
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryRun, setQueryRun] = useState(0);

  useEffect(() => {
    if (!orderNo) return;

    const currentOrderNo = orderNo;
    let cancelled = false;
    let attempts = 0;
    let timerId: number | undefined;
    const controller = new AbortController();

    async function poll() {
      attempts += 1;
      try {
        const response = await fetch(`/api/payment/status?order=${encodeURIComponent(currentOrderNo)}`, { signal: controller.signal });
        if (cancelled) return;
        if (!response.ok) {
          setQueryError(`HTTP ${response.status}`);
          setPhase("http-error");
          return;
        }

        const nextOrder = (await response.json()) as Order;
        if (cancelled) return;
        setOrder(nextOrder);
        setQueryError(null);
        const status = nextOrder.status.toUpperCase();

        if (status === "PAID") {
          setPhase("paid");
          return;
        }
        if (status === "FAILED") {
          setPhase("failed");
          return;
        }
        if (status !== "PENDING") {
          setPhase("unknown");
          return;
        }
        if (attempts >= 12) {
          setPhase("timeout");
          return;
        }

        setPhase("pending");
        timerId = window.setTimeout(() => void poll(), 2500);
      } catch (error) {
        if (cancelled || (error as Error).name === "AbortError") return;
        setQueryError((error as Error).message);
        setPhase("network-error");
      }
    }

    timerId = window.setTimeout(() => void poll(), 0);
    return () => {
      cancelled = true;
      if (timerId !== undefined) window.clearTimeout(timerId);
      controller.abort();
    };
  }, [orderNo, queryRun]);

  const displayPhase: DisplayPhase = orderNo ? phase : "missing";
  const content = STATE_CONTENT[displayPhase];
  const isPolling = displayPhase === "checking" || displayPhase === "pending";

  function retryQuery() {
    if (!orderNo) return;
    setQueryError(null);
    setPhase("checking");
    setQueryRun((run) => run + 1);
  }

  return (
    <main className="page dg-payment-result-page">
      <div className="dg-page-shell dg-page-shell--reading dg-payment-result-shell">
        <section
          className={`card dg-card-body dg-payment-result-card dg-payment-result-card--${content.tone}`}
          aria-labelledby="payment-result-title"
          aria-live="polite"
          aria-busy={isPolling || undefined}
        >
          <div className={`dg-payment-result-icon dg-payment-result-icon--${content.tone}`} aria-hidden="true">
            <Icon name={content.icon} size={24} stroke={2.5} className={content.spin ? "spin" : ""} />
          </div>
          <div className="dg-payment-result-copy">
            <h1 id="payment-result-title" className="dg-page-title">{content.title}</h1>
            <p className="dg-text-secondary">{content.description}</p>
            {queryError && <p className="field-error" role="alert">查詢錯誤：{queryError}</p>}
          </div>
          <OrderStatus order={order} phase={displayPhase} />
        </section>

        {order && (
          <div className="card dg-payment-details-card">
            <div className="dg-table-wrap" role="region" aria-label="訂單明細，可水平捲動" tabIndex={0}>
              <table className="dg-table dg-payment-details-table">
                <caption>訂單明細</caption>
                <thead>
                  <tr>
                    <th scope="col">編號</th>
                    <th scope="col">項目</th>
                    <th scope="col">金額</th>
                    <th scope="col">狀態</th>
                    <th scope="col">付款方式</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>{order.merchantTradeNo}</code></td>
                    <td>{order.itemName}</td>
                    <td className="dg-payment-amount">NT$ {order.amount}</td>
                    <td><OrderStatus order={order} phase={displayPhase} /></td>
                    <td>{order.paymentMethod || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {displayPhase === "paid" && order?.status.toUpperCase() === "PAID" && (
          <>
            <BillingBanner />
            <div className="dg-actions dg-payment-result-actions">
              <Link className="btn btn-stamp btn-lg" href="/contracts/new"><Icon name="sparkles" size={14} />開始建立合約</Link>
              <Link className="btn btn-soft" href="/settings"><Icon name="zap" size={13} />設定 webhook 通知</Link>
              <Link className="btn btn-ghost" href="/"><Icon name="home" size={14} />回首頁</Link>
            </div>
          </>
        )}

        {displayPhase === "failed" && (
          <div className="dg-actions dg-payment-result-actions">
            <Link className="btn btn-primary" href="/checkout">重新付款</Link>
            <a className="btn btn-ghost" href={`mailto:${COMPANY.email}`}>聯繫客服</a>
          </div>
        )}

        {(["timeout", "http-error", "network-error", "unknown"] as DisplayPhase[]).includes(displayPhase) && (
          <div className="dg-actions dg-payment-result-actions">
            <button type="button" className="btn btn-primary" onClick={retryQuery}>重新查詢</button>
            <a className="btn btn-ghost" href={`mailto:${COMPANY.email}`}>聯繫客服</a>
          </div>
        )}

        {displayPhase === "missing" && (
          <div className="dg-actions dg-payment-result-actions">
            <Link className="btn btn-primary" href="/checkout">返回付款方案</Link>
            <a className="btn btn-ghost" href={`mailto:${COMPANY.email}`}>聯繫客服</a>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <>
      <TopNav />
      <Suspense fallback={<main className="page dg-payment-result-page"><div className="dg-page-shell dg-page-shell--reading dg-payment-result-shell"><div className="dg-state dg-state--loading" role="status" aria-busy="true">付款結果載入中…</div></div></main>}>
        <SuccessInner />
      </Suspense>
    </>
  );
}
