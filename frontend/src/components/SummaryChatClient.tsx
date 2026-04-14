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

type SummaryTransactionItem = {
  id: string;
  date: string;
  category: "exchange" | "stock";
  type: string;
  asset: string;
  amount: string;
  realizedGainThb: number | null;
  note: string | null;
};

type StockHoldingItem = {
  ticker: string;
  quantity: number;
  averageCostThb: number;
  currentValueThb: number;
  unrealizedGainLossThb: number;
  latestPriceUsd: number | null;
  latestRateAtTrade: number | null;
  status: "active" | "closed";
};

type InvestmentSummary = {
  year: number;
  totalInvestedThb: number;
  netInvestedThb: number;
  totalCurrentValueThb: number;
  totalProfitLossThb: number;
  totalProfitLossPercent: number;
  taxableGainThb: number;
  estimatedTaxPayable: number;
  realizedGains: RealizedGainItem[];
  warnings: string[];
  holdings: StockHoldingItem[];
  closedPositions: StockHoldingItem[];
  transactions: SummaryTransactionItem[];
};

type ErrorResponse = {
  message?: string;
  detail?: unknown;
};

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as ErrorResponse | undefined;
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

function transactionTone(type: string) {
  if (type.startsWith("Sell")) {
    return "border-rose-400/20 bg-rose-400/10 text-rose-50";
  }

  if (type.startsWith("Buy")) {
    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-50";
  }

  return "border-amber-400/20 bg-amber-400/10 text-amber-50";
}

function holdingTone(value: number) {
  return value >= 0 ? "text-emerald-300" : "text-rose-300";
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.98))] shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <div className="border-b border-white/10 px-4 py-5 sm:px-6">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
            Summary
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            สรุปพอร์ตและภาษี
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            หน้านี้แยกส่วนสรุปภาพรวมออกจากประวัติธุรกรรมชัดเจน และยังใช้ FIFO
            กับ timezone เดิมตาม backend อยู่เหมือนเดิม
          </p>
        </div>

        <div className="space-y-5 px-4 py-4 sm:px-6">
          {isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-300">
              กำลังโหลดข้อมูลสรุปและประวัติธุรกรรม...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 px-4 py-6 text-sm text-rose-50">
              {error}
            </div>
          ) : !summary ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">
              ไม่พบข้อมูลสำหรับสรุปการลงทุน
            </div>
          ) : (
            <>
              {summary.warnings.length > 0 ? (
                <div className="rounded-[1.6rem] border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm text-amber-50">
                  <p className="font-semibold">หมายเหตุจากการคำนวณ</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {summary.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <section className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Overview
                  </p>
                  <h4 className="mt-1 text-lg font-semibold text-white">
                    Summary Overview
                  </h4>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
                  {summaryCard({
                    label: "เงินลงทุนรวม",
                    value: `฿${formatMoney(summary.totalInvestedThb)}`,
                    subtext: `ปี ${summary.year} - เงินต้นทั้งหมดที่ใส่เข้าระบบ`,
                    tone: "cyan",
                  })}
                  {summaryCard({
                    label: "เงินลงทุนคงเหลือ",
                    value: `฿${formatMoney(summary.netInvestedThb)}`,
                    subtext: "Net Invested หลังหักต้นทุนที่ขายออกแล้ว",
                    tone: "emerald",
                  })}
                  {summaryCard({
                    label: "มูลค่าปัจจุบัน",
                    value: `฿${formatMoney(summary.totalCurrentValueThb)}`,
                    subtext: "เงินสดรับกลับ + มูลค่าตามบัญชีของสินทรัพย์ที่เหลือ",
                    tone: "amber",
                  })}
                  {summaryCard({
                    label: "กำไร/ขาดทุน",
                    value: `฿${formatMoney(summary.totalProfitLossThb)} (${formatPercent(summary.totalProfitLossPercent)}%)`,
                    subtext: "คำนวณจากมูลค่าปัจจุบันเทียบกับเงินลงทุนรวม",
                    tone: summary.totalProfitLossThb >= 0 ? "emerald" : "rose",
                  })}
                  {summaryCard({
                    label: "ภาษีประมาณการ",
                    value: `฿${formatMoney(summary.estimatedTaxPayable)}`,
                    subtext: `Realized gain ปีนี้ ฿${formatMoney(summary.taxableGainThb)}`,
                    tone: "rose",
                  })}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Portfolio
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-white">
                      Your Portfolio
                    </h4>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {summary.holdings.length} active
                  </span>
                </div>

                {summary.holdings.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/70 px-4 py-6 text-sm text-slate-400">
                    ยังไม่มีหุ้นคงเหลือในพอร์ตตอนนี้
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 lg:hidden">
                      {summary.holdings.map((holding) => (
                        <article
                          key={holding.ticker}
                          className="rounded-[1.6rem] border border-white/10 bg-slate-950/60 px-4 py-4 shadow-lg shadow-slate-950/20"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-lg font-semibold text-white">
                                {holding.ticker}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                                Active Holding
                              </p>
                            </div>
                            <div
                              className={[
                                "text-right text-sm font-semibold",
                                holdingTone(holding.unrealizedGainLossThb),
                              ].join(" ")}
                            >
                              {holding.unrealizedGainLossThb >= 0 ? "+" : ""}
                              ฿{formatMoney(holding.unrealizedGainLossThb)}
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2 text-sm text-slate-200">
                            <p>คงเหลือ: {holding.quantity.toLocaleString("th-TH", { maximumFractionDigits: 6 })} หุ้น</p>
                            <p>ต้นทุนเฉลี่ย: ฿{formatMoney(holding.averageCostThb)} / หุ้น</p>
                            <p>มูลค่าปัจจุบัน: ฿{formatMoney(holding.currentValueThb)}</p>
                            <p className={holdingTone(holding.unrealizedGainLossThb)}>
                              Unrealized Gain/Loss: ฿{formatMoney(holding.unrealizedGainLossThb)}
                            </p>
                            <p className="text-slate-400">
                              ราคาอ้างอิงล่าสุด:{" "}
                              {holding.latestPriceUsd === null
                                ? "-"
                                : `${holding.latestPriceUsd.toLocaleString("th-TH", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 4,
                                  })} USD`}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className="hidden overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950/60 lg:block">
                      <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
                        <thead className="bg-white/5 text-xs uppercase tracking-[0.22em] text-slate-400">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Ticker</th>
                            <th className="px-4 py-3 text-left font-medium">Quantity</th>
                            <th className="px-4 py-3 text-left font-medium">Average Cost</th>
                            <th className="px-4 py-3 text-left font-medium">Current Value</th>
                            <th className="px-4 py-3 text-left font-medium">Unrealized Gain/Loss</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {summary.holdings.map((holding) => (
                            <tr key={holding.ticker} className="hover:bg-white/[0.03]">
                              <td className="px-4 py-3 align-top text-white">
                                <div className="font-semibold">{holding.ticker}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {holding.latestPriceUsd === null
                                    ? "No latest price"
                                    : `ล่าสุด ${holding.latestPriceUsd.toLocaleString("th-TH", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 4,
                                      })} USD`}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top text-slate-300">
                                {holding.quantity.toLocaleString("th-TH", {
                                  maximumFractionDigits: 6,
                                })}
                              </td>
                              <td className="px-4 py-3 align-top text-slate-300">
                                ฿{formatMoney(holding.averageCostThb)}
                              </td>
                              <td className="px-4 py-3 align-top text-slate-300">
                                ฿{formatMoney(holding.currentValueThb)}
                              </td>
                              <td
                                className={[
                                  "px-4 py-3 align-top font-medium",
                                  holdingTone(holding.unrealizedGainLossThb),
                                ].join(" ")}
                              >
                                ฿{formatMoney(holding.unrealizedGainLossThb)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {summary.closedPositions.length > 0 ? (
                  <div className="rounded-[1.6rem] border border-white/10 bg-white/5 px-4 py-4">
                    <p className="text-sm font-semibold text-white">Closed Positions</p>
                    <p className="mt-1 text-sm text-slate-400">
                      สถานะที่ขายออกหมดแล้วจะแยกไว้ตรงนี้
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {summary.closedPositions.map((holding) => (
                        <span
                          key={holding.ticker}
                          className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs text-slate-300"
                        >
                          {holding.ticker}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Details
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-white">
                      Transaction History
                    </h4>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {summary.transactions.length} รายการ
                  </span>
                </div>

                {summary.transactions.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/70 px-4 py-6 text-sm text-slate-400">
                    ยังไม่มีธุรกรรมที่นำมาใช้ในหน้า summary
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 lg:hidden">
                      {summary.transactions.map((transaction) => (
                        <article
                          key={transaction.id}
                          className="rounded-[1.6rem] border border-white/10 bg-slate-950/60 px-4 py-4 shadow-lg shadow-slate-950/20"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={[
                                "rounded-full border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em]",
                                transactionTone(transaction.type),
                              ].join(" ")}
                            >
                              {transaction.type}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-300">
                              {transaction.category}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 text-sm text-slate-200">
                            <p>วันที่: {formatDateTime(transaction.date)}</p>
                            <p>สินทรัพย์: {transaction.asset}</p>
                            <p>จำนวน: {transaction.amount}</p>
                            <p
                              className={
                                transaction.realizedGainThb === null
                                  ? "text-slate-400"
                                  : transaction.realizedGainThb >= 0
                                    ? "text-emerald-300"
                                    : "text-rose-300"
                              }
                            >
                              Realized Gain:{" "}
                              {transaction.realizedGainThb === null
                                ? "-"
                                : `฿${formatMoney(transaction.realizedGainThb)}`}
                            </p>
                            {transaction.note ? (
                              <p className="text-slate-400">หมายเหตุ: {transaction.note}</p>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className="hidden overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950/60 lg:block">
                      <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
                        <thead className="bg-white/5 text-xs uppercase tracking-[0.22em] text-slate-400">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Date</th>
                            <th className="px-4 py-3 text-left font-medium">Type</th>
                            <th className="px-4 py-3 text-left font-medium">Asset</th>
                            <th className="px-4 py-3 text-left font-medium">Amount</th>
                            <th className="px-4 py-3 text-left font-medium">Realized Gain</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {summary.transactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-white/[0.03]">
                              <td className="px-4 py-3 align-top text-slate-300">
                                {formatDateTime(transaction.date)}
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex flex-col gap-2">
                                  <span
                                    className={[
                                      "inline-flex w-fit rounded-full border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em]",
                                      transactionTone(transaction.type),
                                    ].join(" ")}
                                  >
                                    {transaction.type}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {transaction.category}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top text-slate-100">
                                <div>{transaction.asset}</div>
                                {transaction.note ? (
                                  <div className="mt-1 text-xs text-slate-500">
                                    {transaction.note}
                                  </div>
                                ) : null}
                              </td>
                              <td className="px-4 py-3 align-top text-slate-300">
                                {transaction.amount}
                              </td>
                              <td
                                className={[
                                  "px-4 py-3 align-top font-medium",
                                  transaction.realizedGainThb === null
                                    ? "text-slate-500"
                                    : transaction.realizedGainThb >= 0
                                      ? "text-emerald-300"
                                      : "text-rose-300",
                                ].join(" ")}
                              >
                                {transaction.realizedGainThb === null
                                  ? "-"
                                  : `฿${formatMoney(transaction.realizedGainThb)}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
