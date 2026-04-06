"use client";

import { useEffect, useState } from "react";

type TaxSummary = {
  id: number;
  year: number;
  totalIncomeThb: number;
  totalCostThb: number;
  totalFeeThb: number;
  netProfitThb: number;
  taxRate: number;
  taxAmount: number;
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
  return value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number) {
  return value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function SummaryChatClient() {
  const [items, setItems] = useState<TaxSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/tax-summaries", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = (await response.json()) as TaxSummary[];
        setItems(data);
      } catch (loadError) {
        setItems([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "ไม่สามารถโหลดสรุปภาษีได้"
        );
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <div className="border-b border-white/10 px-4 py-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
            Summary
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            สรุปภาษี
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
            รายการสรุปภาษีที่บันทึกไว้ในระบบจะแสดงในรูปแบบ bubble เพื่อคงธีมเดียวกับหน้าหลัก
          </p>
        </div>

        <div className="px-3 py-4 sm:px-5">
          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-3xl border border-white/10 bg-slate-900/85 px-4 py-4 text-sm text-slate-300">
                กำลังโหลดสรุปภาษี...
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm text-rose-50">
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-400">
                ยังไม่มีสรุปภาษีในระบบ
              </div>
            ) : (
              items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.6rem] rounded-bl-xl border border-cyan-400/20 bg-slate-900/90 px-4 py-4 text-sm leading-7 text-slate-100 shadow-lg shadow-cyan-950/10 sm:text-base"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-cyan-400/15 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-cyan-100">
                      ปี {item.year}
                    </span>
                    <span className="text-xs text-slate-400">#{item.id}</span>
                  </div>
                  <div className="space-y-1">
                    <p>รายได้รวม: ฿{formatMoney(item.totalIncomeThb)}</p>
                    <p>ต้นทุนรวม: ฿{formatMoney(item.totalCostThb)}</p>
                    <p>ค่าธรรมเนียม: ฿{formatMoney(item.totalFeeThb)}</p>
                    <p>กำไรสุทธิ: ฿{formatMoney(item.netProfitThb)}</p>
                    <p>อัตราภาษี: {formatPercent(item.taxRate)}%</p>
                    <p>ภาษีที่ต้องจ่าย: ฿{formatMoney(item.taxAmount)}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
