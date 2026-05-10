"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { Icon } from "@/components/Icon";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";

type Order = {
  merchantTradeNo: string;
  status: string;
  amount: number;
  itemName: string;
  paymentMethod?: string | null;
  paymentDate?: string | null;
};

function SuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const orderNo = params.get("order");
  const [data, setData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNo) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    async function poll() {
      attempts += 1;
      const res = await fetch(`/api/payment/status?order=${orderNo}`);
      if (!res.ok) {
        if (!cancelled) setLoading(false);
        return;
      }
      const json: Order = await res.json();
      if (cancelled) return;
      setData(json);
      if (json.status === "PENDING" && attempts < 12) setTimeout(poll, 2500);
      else setLoading(false);
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [orderNo]);

  const status = (data?.status || (loading ? "PENDING" : "PENDING")).toUpperCase();
  const cfg: Record<string, { color: string; bg: string; icon: string; title: string; sub: string; spin?: boolean }> = {
    PAID: { color: "var(--green-500)", bg: "var(--green-50)", icon: "check", title: "付款成功", sub: "感謝你！合約額度已加值至帳戶。" },
    PENDING: {
      color: "var(--amber-600)", bg: "#fffbeb", icon: "loader",
      title: "處理中", sub: "正在向 NewebPay 確認交易，請稍候...", spin: true,
    },
    FAILED: { color: "var(--red-500)", bg: "var(--red-50)", icon: "x", title: "付款失敗", sub: "請確認卡片資訊或聯繫客服。" },
  };
  const c = cfg[status] || cfg.PENDING;

  return (
    <main
      className="page"
      style={{ background: "var(--bg-soft)", minHeight: "calc(100vh - 60px)", padding: "48px 32px" }}
    >
      <div className="container-narrow" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div
          className="card"
          style={{ padding: 36, textAlign: "center", background: c.bg, borderColor: "transparent" }}
        >
          <div
            className={status === "PAID" ? "pulse-ring" : ""}
            style={{
              width: 76, height: 76, borderRadius: "50%",
              background: c.color, color: "#fff",
              display: "grid", placeItems: "center", margin: "0 auto 16px",
            }}
          >
            <Icon name={c.icon} size={34} stroke={3} className={c.spin ? "spin" : ""} />
          </div>
          <h1 style={{ fontSize: 32 }}>{c.title}</h1>
          <p style={{ color: "var(--ink-soft)", marginTop: 8 }}>{c.sub}</p>
          <div className="row gap-2" style={{ justifyContent: "center", marginTop: 18 }}>
            <PaymentStatusBadge status={status} />
          </div>
        </div>

        {data && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "12px 18px", borderBottom: "1px solid var(--line)",
                fontSize: 13, color: "var(--ink-muted)", letterSpacing: "0.06em", textTransform: "uppercase",
              }}
            >
              訂單明細
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr
                  style={{
                    background: "var(--bg-soft)", color: "var(--ink-muted)",
                    fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase",
                  }}
                >
                  {["編號", "項目", "金額", "狀態", "付款方式"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)" }}>{data.merchantTradeNo}</td>
                  <td style={{ padding: "14px 16px" }}>{data.itemName}</td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontFamily: "var(--font-mono)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    NT$ {data.amount}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <PaymentStatusBadge status={status} />
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--ink-soft)" }}>
                    {data.paymentMethod || "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {status === "PAID" && (
          <div className="row gap-3" style={{ justifyContent: "center" }}>
            <button className="btn btn-stamp btn-lg" onClick={() => router.push("/contracts/new")}>
              <Icon name="sparkles" size={14} />
              開始建立第一份合約
            </button>
            <button className="btn btn-ghost" onClick={() => router.push("/")}>
              <Icon name="home" size={14} />
              回首頁
            </button>
          </div>
        )}
        {status === "FAILED" && (
          <div className="row gap-3" style={{ justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => router.push("/checkout")}>
              重新付款
            </button>
            <button className="btn btn-ghost">聯繫客服</button>
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
      <Suspense fallback={<div style={{ padding: 40 }}>載入中…</div>}>
        <SuccessInner />
      </Suspense>
    </>
  );
}
