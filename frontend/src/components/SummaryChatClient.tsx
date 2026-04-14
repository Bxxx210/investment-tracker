"use client";

import { useEffect, useState } from "react";

type RealizedGainItem = {
  sourceType: string;
  transactionId: number;
  closedAt: string;
  label: string;
  quantity: number;
  proceedsThb: number;
  costBasisThb: number;
  gainThb: number;
  note?: string | null;
};

type InvestmentSummary = {
  year: number;
  totalInvestedThb: number;
  totalCurrentValueThb: number;
  totalProfitLossThb: number;
  totalProfitLossPercent: number;
  taxableGainThb: number;
  estimatedTaxPayable: number;
  realizedGains: RealizedGainItem[];
  warnings: string[];
};

type ChatResponse = {
  message?: string;
  detail?: unknown;
};

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as ChatResponse | undefined;
    if (data?.detail && typeof data.detail === "object") {
      return `${data.message ?? "ไม่สามารถทำรายการได้"}: ${JSON.stringify(
        data.detail
      )}`;
    }
    if (data?.detail && typeof data.detail === "string") {
      return data.message ? `${data.message}: ${data.detail}` : data.detail;
    }
    return data?.message ?? "ไม่สามารถทำรายการได้";
  } catch {
    return "ไม่สามารถทำรายการได้";
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function summaryCard({
  label,
  value,
  subtext,
  tone = "cyan",
}: {
  label: string;
  value: string;
  subtext: string;
  tone?: "cyan" | "emerald" | "amber" | "rose";
}) {
  const toneClasses = {
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-50",
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-50",
    amber: "border-amber-400/20 bg-amber-400/10 text-amber-50",
    rose: "border-rose-400/20 bg-rose-400/10 text-rose-50",
  }[tone];

  return (
    <div className={`rounded-[1.6rem] border px-4 py-4 shadow-lg ${toneClasses}`}>
      <p className="text-xs uppercase tracking-[0.28em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs opacity-70">{subtext}</p>
    </div>
  );
}

export default function SummaryChatClient() {
  const [summary, setSummary] = useState<InvestmentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/investment/summary", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = (await response.json()) as InvestmentSummary;
        setSummary(data);
      } catch (loadError) {
        setSummary(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "ไม่สามารถโหลดสรุปการลงทุนได้"
        );
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.98))] shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <div className="border-b border-white/10 px-4 py-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
            Summary
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            สรุปพอร์ตและภาษี
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            สรุปนี้คำนวณจากธุรกรรมที่บันทึกไว้ด้วย FIFO และแสดงมูลค่าแบบบัญชี
            ไม่ใช่ราคาตลาดจริง เพราะ schema ปัจจุบันยังไม่มี market price
          </p>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-6">
          {isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-300">
              กำลังคำนวณสรุปการลงทุน...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 px-4 py-5 text-sm text-rose-50">
              {error}
            </div>
          ) : summary ? (
            <>
              {summary.warnings.length > 0 ? (
                <div className="rounded-[1.6rem] border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm text-amber-50">
                  <p className="font-semibold">หมายเหตุ</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {summary.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {summaryCard({
                  label: "เงินลงทุนรวม",
                  value: `฿${formatMoney(summary.totalInvestedThb)}`,
                  subtext: `ปี ${summary.year} - เงินต้นทั้งหมดที่เข้าสู่พอร์ต`,
                  tone: "cyan",
                })}
                {summaryCard({
                  label: "มูลค่าปัจจุบัน",
                  value: `฿${formatMoney(summary.totalCurrentValueThb)}`,
                  subtext: "มูลค่าตามบัญชีจากธุรกรรมที่บันทึกไว้",
                  tone: "emerald",
                })}
                {summaryCard({
                  label: "กำไร/ขาดทุน",
                  value: `฿${formatMoney(summary.totalProfitLossThb)} (${formatPercent(summary.totalProfitLossPercent)}%)`,
                  subtext: "คำนวณจากมูลค่าปัจจุบันลบเงินลงทุนรวม",
                  tone: summary.totalProfitLossThb >= 0 ? "amber" : "rose",
                })}
                {summaryCard({
                  label: "ภาษีประมาณการ",
                  value: `฿${formatMoney(summary.estimatedTaxPayable)}`,
                  subtext: `Taxable gain ฿${formatMoney(summary.taxableGainThb)}`,
                  tone: "rose",
                })}
              </div>

              <div className="rounded-[1.6rem] border border-white/10 bg-white/5 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Realized Gains
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-white">
                      รายการที่ถูกใช้คำนวณภาษี
                    </h4>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {summary.realizedGains.length} รายการ
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {summary.realizedGains.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/70 px-4 py-5 text-sm text-slate-400">
                      ยังไม่มีรายการขายที่ทำให้เกิดกำไร/ขาดทุนในปีนี้
                    </div>
                  ) : (
                    summary.realizedGains.map((item) => (
                      <article
                        key={`${item.sourceType}-${item.transactionId}`}
                        className="rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-4 shadow-lg shadow-slate-950/20"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cyan-400/15 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-cyan-100">
                            {item.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            #{item.transactionId}
                          </span>
                          <span
                            className={[
                              "rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em]",
                              item.gainThb >= 0
                                ? "bg-emerald-400/15 text-emerald-100"
                                : "bg-rose-400/15 text-rose-100",
                            ].join(" ")}
                          >
                            {item.gainThb >= 0 ? "กำไร" : "ขาดทุน"}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
                          <p>วันที่ปิด: {formatDateTime(item.closedAt)}</p>
                          <p>จำนวน: {item.quantity.toLocaleString("th-TH")}</p>
                          <p>ต้นทุน FIFO: ฿{formatMoney(item.costBasisThb)}</p>
                          <p>มูลค่าขาย: ฿{formatMoney(item.proceedsThb)}</p>
                          <p
                            className={
                              item.gainThb >= 0 ? "text-emerald-300" : "text-rose-300"
                            }
                          >
                            กำไร/ขาดทุน: ฿{formatMoney(item.gainThb)}
                          </p>
                          {item.note ? <p>หมายเหตุ: {item.note}</p> : null}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
