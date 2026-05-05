"use client";

import { use, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { SignaturePad } from "@/components/ui/SignaturePad";

function SignInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();

  const [signature, setSignature] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800">
        簽署連結遺失 token，請向發送方索取完整連結。
      </div>
    );
  }

  async function submit() {
    if (!signature) {
      setError("請先簽名再送出");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${id}/recipient-sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          signature,
          recipientName: recipientName.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "簽署失敗，請聯絡發送方");
        return;
      }
      setDone(true);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded border border-green-400 bg-green-50 p-6 text-green-900">
        <h2 className="text-lg font-semibold">✓ 簽署完成</h2>
        <p className="mt-2 text-sm">本合約已雙方簽署完成。系統已記錄您的簽名與時間戳。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded border bg-amber-50 p-4 text-sm text-amber-900">
        <strong>請仔細閱讀合約內容後再簽署。</strong>
        簽署即代表您已詳閱並同意所有條款，本平台會記錄您的 IP 位址、時間戳與簽名雜湊作為日後爭議時的舉證。
      </div>

      <label className="block">
        <span className="text-sm font-medium">您的姓名（選填，用於合約落款）</span>
        <input
          type="text"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2"
          placeholder="例：王小明"
        />
      </label>

      <div>
        <h3 className="mb-2 text-sm font-medium">在下方框內簽名</h3>
        <SignaturePad onSave={setSignature} />
        {signature && (
          <p className="mt-2 text-xs text-green-700">✓ 簽名已暫存，按下方「正式簽署」送出</p>
        )}
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={submitting || !signature}
        className="rounded bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 disabled:bg-zinc-400"
      >
        {submitting ? "簽署中..." : "正式簽署"}
      </button>
    </div>
  );
}

export default function RecipientSignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">合約簽署</h1>
      <Suspense fallback={<p>載入中...</p>}>
        <SignInner id={id} />
      </Suspense>
    </main>
  );
}
