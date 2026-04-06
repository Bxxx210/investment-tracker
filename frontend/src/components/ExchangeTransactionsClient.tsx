"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

type ParsedExchangeTransaction = {
  date: string;
  thbAmount: number;
  foreignAmount: number;
  currency: string;
  midRate: number | null;
  actualRate: number;
  spread: number | null;
  note: string | null;
};

type PreviewResponse = {
  message?: string;
  parsed?: ParsedExchangeTransaction;
};

type ChatMessage =
  | {
      id: number;
      role: "bot";
      kind: "text";
      text: string;
    }
  | {
      id: number;
      role: "user";
      kind: "text";
      text: string;
    }
  | {
      id: number;
      role: "bot";
      kind: "preview";
      text: string;
      transaction: ParsedExchangeTransaction;
      status: "pending" | "confirmed" | "cancelled";
    }
  | {
      id: number;
      role: "bot";
      kind: "status";
      tone: "success" | "neutral" | "danger";
      text: string;
    };

const examplePrompts = [
  "แลก 1000 อัตรา 32.3",
  "แลกเงิน 2500 เป็น USD เรท 33.1",
  "แลก 5000 mid 32.0 actual 32.4 หมายเหตุ โอนผ่านธนาคาร",
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as
      | { message?: string; detail?: unknown; errors?: unknown }
      | undefined;

    if (data?.errors) {
      return `Backend validation error: ${JSON.stringify(data.errors)}`;
    }

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

function buildSummaryText(transaction: ParsedExchangeTransaction) {
  return [
    "ยืนยันบันทึกนี้ไหมครับ?",
    `💰 จำนวนบาท: ${formatMoney(transaction.thbAmount)}`,
    `💵 ได้รับ: ${formatMoney(transaction.foreignAmount)} ${transaction.currency}`,
    `📊 อัตรา: ${formatRate(transaction.actualRate)}`,
  ].join("\n");
}

function buildHistorySummary(transaction: ExchangeTransaction) {
  const rateText =
    transaction.actualRate > 0 ? formatRate(transaction.actualRate) : "-";

  return [
    `💰 ${formatMoney(transaction.thbAmount)} บาท`,
    `💵 ${formatMoney(transaction.foreignAmount)} ${transaction.currency}`,
    `📊 อัตรา ${rateText}`,
  ];
}

function initialMessages(): ChatMessage[] {
  return [
    {
      id: 1,
      role: "bot",
      kind: "text",
      text: "สวัสดีครับ จะบันทึกอะไรดี?",
    },
  ];
}

function nextMessageId(messages: ChatMessage[]) {
  return messages.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export default function ExchangeTransactionsClient() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [transactions, setTransactions] = useState<ExchangeTransaction[]>([]);
  const [pendingPreview, setPendingPreview] = useState<{
    id: number;
    transaction: ParsedExchangeTransaction;
  } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const historyMessages = useMemo(
    () =>
      transactions.map((transaction) => ({
        id: transaction.id,
        transaction,
        summary: buildHistorySummary(transaction),
      })),
    [transactions]
  );

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, historyMessages.length, isLoadingHistory, isPreviewing, isSaving]);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setIsLoadingHistory(true);
        const response = await fetch("/api/exchange-transactions", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = (await response.json()) as ExchangeTransaction[];
        setTransactions(data);
      } catch {
        setTransactions([]);
        setMessages((current) => [
          ...current,
          {
            id: nextMessageId(current),
            role: "bot",
            kind: "status",
            tone: "neutral",
            text: "ตอนนี้ยังดึงประวัติเดิมไม่ได้ครับ แต่คุณเริ่มบันทึกใหม่ได้เลย",
          },
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    void loadTransactions();
  }, []);

  const addBotMessage = (text: string, tone: "success" | "neutral" | "danger" = "neutral") => {
    setMessages((current) => [
      ...current,
      {
        id: nextMessageId(current),
        role: "bot",
        kind: "status",
        tone,
        text,
      },
    ]);
  };

  const updatePreviewMessage = (
    previewId: number,
    status: "pending" | "confirmed" | "cancelled"
  ) => {
    setMessages((current) =>
      current.map((message) =>
        message.kind === "preview" && message.id === previewId
          ? {
              ...message,
              status,
            }
          : message
      )
    );
  };

  const loadHistory = async () => {
    const response = await fetch("/api/exchange-transactions", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const data = (await response.json()) as ExchangeTransaction[];
    setTransactions(data);
  };

  const handleSend = async () => {
    const text = draft.trim();

    if (!text || isPreviewing || isSaving || pendingPreview) {
      return;
    }

    const userMessage: ChatMessage = {
      id: nextMessageId(messages),
      role: "user",
      kind: "text",
      text,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setIsPreviewing(true);

    try {
      const response = await fetch("/api/exchange-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "preview",
          text,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as PreviewResponse;
      const parsed = data.parsed;

      if (!parsed) {
        throw new Error("ไม่สามารถอ่านรายการนี้ได้");
      }

      const previewMessageId = nextMessageId([...messages, userMessage]);
      const previewMessage: ChatMessage = {
        id: previewMessageId,
        role: "bot",
        kind: "preview",
        text: buildSummaryText(parsed),
        transaction: parsed,
        status: "pending",
      };

      setMessages((current) => [...current, previewMessage]);
      setPendingPreview({
        id: previewMessageId,
        transaction: parsed,
      });
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId(current),
          role: "bot",
          kind: "status",
          tone: "danger",
          text:
            error instanceof Error
              ? error.message
              : "ไม่สามารถแปลงรายการได้",
        },
      ]);
      setDraft(text);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingPreview || isSaving) {
      return;
    }

    setIsSaving(true);
    updatePreviewMessage(pendingPreview.id, "confirmed");

    try {
      const response = await fetch("/api/exchange-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "save",
          transaction: pendingPreview.transaction,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      await loadHistory();
      setPendingPreview(null);
      addBotMessage("บันทึกแล้วครับ!", "success");
    } catch (error) {
      updatePreviewMessage(pendingPreview.id, "pending");
      addBotMessage(
        error instanceof Error ? error.message : "ไม่สามารถบันทึกรายการได้",
        "danger"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!pendingPreview) {
      return;
    }

    updatePreviewMessage(pendingPreview.id, "cancelled");
    setPendingPreview(null);
    addBotMessage("ยกเลิกให้แล้วครับ ถ้าต้องการบันทึกใหม่พิมพ์มาได้เลย");
  };

  const composerDisabled = isPreviewing || isSaving || pendingPreview !== null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.95))] shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <div className="border-b border-white/10 px-4 py-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
            Exchange Chat
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            คุยกับบอทเพื่อบันทึกการแลกเงิน
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            พิมพ์ข้อความธรรมดาได้เลย เช่น “แลก 1000 อัตรา 32.3” แล้วบอทจะสรุปให้ก่อนกดยืนยัน
          </p>
        </div>

        <div
          ref={scrollRef}
          className="max-h-[calc(100dvh-18rem)] overflow-y-auto px-3 py-4 sm:px-5"
        >
          <div className="mb-4 flex flex-wrap gap-2 px-2">
            {examplePrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setDraft(prompt)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white sm:text-sm"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
                ประวัติที่บันทึกไว้
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {isLoadingHistory ? (
              <div className="px-2 text-sm text-slate-400">
                กำลังโหลดประวัติ...
              </div>
            ) : historyMessages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-400">
                ยังไม่มีรายการที่บันทึกไว้
              </div>
            ) : (
              historyMessages.map((item) => (
                <div key={item.id} className="flex justify-start">
                  <div className="max-w-[88%] rounded-[1.6rem] rounded-bl-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-7 text-emerald-50 shadow-lg shadow-emerald-950/10 sm:max-w-[75%] sm:text-base">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-100">
                        บันทึกแล้ว
                      </span>
                      <span className="text-xs text-emerald-100/70">
                        #{item.id}
                      </span>
                    </div>
                    <p className="text-base font-semibold text-white">
                      {formatDate(item.transaction.date)}
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-emerald-50/90">
                      {item.summary.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                    {item.transaction.note ? (
                      <p className="mt-2 text-sm text-emerald-50/80">
                        หมายเหตุ: {item.transaction.note}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="my-5 flex items-center gap-3 px-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              แชทปัจจุบัน
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-4">
            {messages.map((message) => {
              if (message.kind === "text") {
                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id}
                    className={isUser ? "flex justify-end" : "flex justify-start"}
                  >
                    <div
                      className={[
                        "max-w-[88%] rounded-[1.6rem] px-4 py-3 text-sm leading-7 shadow-lg sm:max-w-[75%] sm:text-base",
                        isUser
                          ? "rounded-br-xl bg-cyan-400 text-slate-950"
                          : "rounded-bl-xl border border-white/10 bg-slate-900/85 text-slate-100",
                      ].join(" ")}
                    >
                      {message.text}
                    </div>
                  </div>
                );
              }

              if (message.kind === "status") {
                const toneClasses =
                  message.tone === "success"
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-50"
                    : message.tone === "danger"
                      ? "border-rose-400/20 bg-rose-400/10 text-rose-50"
                      : "border-white/10 bg-slate-900/85 text-slate-100";

                return (
                  <div key={message.id} className="flex justify-start">
                    <div
                      className={[
                        "max-w-[88%] rounded-[1.6rem] rounded-bl-xl border px-4 py-3 text-sm leading-7 shadow-lg sm:max-w-[75%] sm:text-base",
                        toneClasses,
                      ].join(" ")}
                    >
                      {message.text}
                    </div>
                  </div>
                );
              }

              return (
                <div key={message.id} className="flex justify-start">
                  <div className="max-w-[92%] rounded-[1.6rem] rounded-bl-xl border border-cyan-400/20 bg-slate-900/90 px-4 py-4 shadow-lg shadow-cyan-950/10 sm:max-w-[78%]">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-cyan-400/15 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-cyan-100">
                        Preview
                      </span>
                      <span className="text-xs text-slate-400">
                        {message.status === "pending"
                          ? "รอยืนยัน"
                          : message.status === "confirmed"
                            ? "ยืนยันแล้ว"
                            : "ยกเลิกแล้ว"}
                      </span>
                    </div>
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-100 sm:text-base">
                      {message.text}
                    </p>

                    {message.transaction.note ? (
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        หมายเหตุ: {message.transaction.note}
                      </p>
                    ) : null}

                    {message.status === "pending" ? (
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => void handleConfirm()}
                          disabled={isSaving}
                          className="inline-flex h-12 items-center justify-center rounded-2xl bg-cyan-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          ✅ ยืนยัน
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          ❌ ยกเลิก
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {isPreviewing || isSaving ? (
              <div className="flex justify-start">
                <div className="rounded-[1.6rem] rounded-bl-xl border border-white/10 bg-slate-900/85 px-4 py-3 text-sm leading-7 text-slate-300">
                  {isPreviewing ? "กำลังให้ Gemini อ่านข้อความ..." : "กำลังบันทึก..."}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-20 rounded-[2rem] border border-white/10 bg-slate-950/90 p-3 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-4">
        <div className="flex items-end gap-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            rows={2}
            disabled={composerDisabled}
            placeholder="พิมพ์เช่น แลก 1000 อัตรา 32.3"
            className="min-h-16 flex-1 resize-none rounded-[1.6rem] border border-white/10 bg-slate-900/80 px-4 py-4 text-base leading-7 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={composerDisabled || draft.trim().length === 0}
            className="inline-flex h-16 min-w-16 items-center justify-center rounded-[1.6rem] bg-cyan-400 px-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ส่ง
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 px-1 text-xs text-slate-400">
          <span>
            {pendingPreview
              ? "กดยืนยันหรือยกเลิกก่อนเริ่มรายการใหม่"
              : "กด Enter เพื่อส่งข้อความ หรือ Shift+Enter เพื่อขึ้นบรรทัดใหม่"}
          </span>
          <div className="hidden sm:block">
            {draft.trim().length > 0 ? `${draft.trim().length} ตัวอักษร` : ""}
          </div>
        </div>
      </section>
    </div>
  );
}
