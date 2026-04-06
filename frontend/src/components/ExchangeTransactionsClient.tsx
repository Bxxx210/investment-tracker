"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

type ExchangeTransaction = {
  id: number;
  date: string;
  thbAmount: number;
  foreignAmount: number;
  currency: string;
  midRate: number | null;
  actualRate: number;
  spread: number | null;
  note?: string | null;
};

type SaveResponse = {
  message?: string;
  parsed?: {
    date: string;
    thbAmount: number;
    foreignAmount: number;
    currency: string;
    midRate: number | null;
    actualRate: number;
    spread: number | null;
    note: string | null;
  };
};

type PreviewResponse = SaveResponse;

const examplePrompts = [
  "แลกเงิน 1000 อัตรา 32.3",
  "แลกเงิน USD 100 วันที่ 2026-04-06 เรต 33.5",
  "แลก 2500 บาท เป็น SGD เรต 25.4 หมายเหตุ โอนผ่านธนาคาร",
];

function formatMoney(value: number) {
  return value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatRate(value: number) {
  return value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as
      | { message?: string; detail?: unknown }
      | undefined;

    if (data?.detail && typeof data.detail === "string") {
      return data.message ? `${data.message}: ${data.detail}` : data.detail;
    }

    if (data?.detail && typeof data.detail === "object") {
      const detailMessage = JSON.stringify(data.detail);
      return data.message ? `${data.message}: ${detailMessage}` : detailMessage;
    }

    return data?.message ?? "ไม่สามารถทำรายการได้";
  } catch {
    return "ไม่สามารถทำรายการได้";
  }
}

export default function ExchangeTransactionsClient() {
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState<PreviewResponse["parsed"] | null>(null);
  const [previewSource, setPreviewSource] = useState("");
  const [transactions, setTransactions] = useState<ExchangeTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/exchange-transactions", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as ExchangeTransaction[];
      setTransactions(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "ไม่สามารถโหลดรายการแลกเงินได้"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePromptChange = (value: string) => {
    setPrompt(value);
      setPreview(null);
      setPreviewSource("");
      setError(null);
      setSuccessMessage(null);
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/exchange-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "preview",
          text: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as PreviewResponse;
      setPreview(data.parsed ?? null);
      setPreviewSource(prompt);
      setSuccessMessage(data.message ?? "แปลง JSON เรียบร้อยแล้ว");
    } catch (previewError) {
      setPreview(null);
      setPreviewSource("");
      setError(
        previewError instanceof Error
          ? previewError.message
          : "ไม่สามารถแปลงรายการได้"
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!preview || previewSource !== prompt) {
        throw new Error("กรุณากดดูตัวอย่าง JSON ก่อนบันทึก");
      }

      const response = await fetch("/api/exchange-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "save",
          transaction: preview,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as SaveResponse;
      setPrompt("");
      setSuccessMessage(
        data.message ??
          `บันทึกแล้ว: ฿${formatMoney(data.parsed?.thbAmount ?? 0)}`
      );
      await loadTransactions();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "ไม่สามารถบันทึกรายการแลกเงินได้"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">
              Exchange
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              พิมพ์ข้อความ แล้วให้ Gemini แปลงเป็นรายการแลกเงิน
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              ตัวอย่าง: &quot;แลกเงิน 1000 mid 32.1 actual 32.3&quot; ระบบจะส่งไป Gemini เพื่อ parse เป็น JSON แล้วบันทึกลง backend ให้อัตโนมัติ
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            API:{" "}
            <span className="font-semibold">POST /api/exchange-transactions</span>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">
              ข้อความรายการแลกเงิน
            </span>
              <textarea
                name="prompt"
                value={prompt}
                onChange={(event) => handlePromptChange(event.target.value)}
                rows={8}
                placeholder="เช่น แลกเงิน 1000 mid 32.1 actual 32.3"
                className="rounded-3xl border border-white/10 bg-slate-950/50 px-4 py-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              />
            </label>

          <div className="grid gap-3 sm:grid-cols-3">
            {examplePrompts.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPrompt(item)}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-left text-xs leading-5 text-slate-300 transition hover:border-cyan-400/30 hover:bg-white/5 hover:text-white"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6 text-sm">
              {error ? <p className="text-rose-300">{error}</p> : null}
              {successMessage ? (
                <p className="text-emerald-300">{successMessage}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void handlePreview()}
                disabled={isPreviewing || prompt.trim().length === 0}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPreviewing ? "กำลังสร้าง JSON..." : "ดูตัวอย่าง JSON"}
              </button>
              <button
                type="submit"
                disabled={isSaving || !preview || previewSource !== prompt}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-cyan-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "กำลังบันทึก..." : "บันทึกจาก JSON"}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 rounded-[1.75rem] border border-cyan-400/20 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">
                Preview
              </p>
              <h4 className="mt-2 text-lg font-semibold text-white">
                JSON ที่ Gemini แปลงไว้
              </h4>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              {preview ? "พร้อมบันทึก" : "รอการแปลง"}
            </span>
          </div>

          <pre className="mt-4 overflow-x-auto rounded-3xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-200">
            {preview
              ? JSON.stringify(preview, null, 2)
              : "กด \"ดูตัวอย่าง JSON\" เพื่อให้ Gemini แปลงข้อความก่อนบันทึก"}
          </pre>

          {previewSource ? (
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Preview จากข้อความล่าสุด: {previewSource}
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-xl sm:p-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              History
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              รายการที่บันทึกไว้
            </h3>
          </div>
          <button
            type="button"
            onClick={() => void loadTransactions()}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            รีเฟรช
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {isLoading ? (
            <p className="text-sm text-slate-400">กำลังโหลดรายการ...</p>
          ) : transactions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
              ยังไม่มีรายการแลกเงิน
            </div>
          ) : (
            transactions.map((transaction) => (
              <article
                key={transaction.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/20 hover:bg-white/10"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-medium text-cyan-200">
                        #{transaction.id}
                      </span>
                      <span className="text-sm text-slate-300">
                        {transaction.date}
                      </span>
                      <span className="text-sm text-slate-500">
                        {transaction.currency}
                      </span>
                    </div>
                    <p className="text-base font-semibold text-white">
                      ฿{formatMoney(transaction.thbAmount)}
                    </p>
                    <p className="text-sm text-slate-300">
                      {formatMoney(transaction.foreignAmount)}{" "}
                      {transaction.currency} · mid{" "}
                      {transaction.midRate === null
                        ? "-"
                        : formatRate(transaction.midRate)}
                      {" · actual "}
                      {formatRate(transaction.actualRate)}
                      {" · spread "}
                      {transaction.spread === null
                        ? "-"
                        : formatRate(transaction.spread)}
                    </p>
                  </div>
                </div>
                {transaction.note ? (
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {transaction.note}
                  </p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
