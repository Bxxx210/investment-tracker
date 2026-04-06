"use client";

import { useEffect, useRef, useState } from "react";

type ChatIntent = "exchange" | "stock_buy" | "stock_sell" | "unknown";

type ChatAnalysisData = {
  date?: string | null;
  executedAt?: string | null;
  thbAmount?: number | null;
  foreignAmount?: number | null;
  currency?: string | null;
  midRate?: number | null;
  actualRate?: number | null;
  spread?: number | null;
  ticker?: string | null;
  quantity?: number | null;
  priceUsd?: number | null;
  feeUsd?: number | null;
  vatUsd?: number | null;
  totalCostUsd?: number | null;
  rateAtTrade?: number | null;
  priceThb?: number | null;
  note?: string | null;
};

type ChatAnalysis = {
  intent: ChatIntent;
  data: ChatAnalysisData;
  summary: string;
};

type ChatHistoryItem =
  | {
      kind: "exchange";
      id: number;
      title: string;
      lines: string[];
    }
  | {
      kind: "stock_buy" | "stock_sell";
      id: number;
      title: string;
      lines: string[];
    };

type ChatResponse = {
  message?: string;
  analysis?: ChatAnalysis;
  saved?: unknown;
  history?: ChatHistoryItem[];
  detail?: unknown;
};

type ConversationMessage =
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
      summary: string;
      analysis: ChatAnalysis;
      status: "pending" | "confirmed" | "cancelled";
    }
  | {
      id: number;
      role: "bot";
      kind: "status";
      tone: "success" | "neutral" | "danger";
      text: string;
    };

const starterPhrases = [
  "แลก 1000 อัตรา 32.3",
  "ซื้อ AAPL 10 หุ้น ราคา 180 USD",
  "ขาย TSLA 2 หุ้น ราคา 175 USD",
];

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

function createConversationIdFactory() {
  let nextId = 1;

  return () => {
    const current = nextId;
    nextId += 1;
    return current;
  };
}

function buildHistoryText(item: ChatHistoryItem) {
  return item.lines.join("\n");
}

function initialConversation(createId: () => number): ConversationMessage[] {
  return [
    {
      id: createId(),
      role: "bot",
      kind: "text",
      text: "สวัสดีครับ จะบันทึกอะไรดี?",
    },
  ];
}

function buildPreviewSummary(analysis: ChatAnalysis) {
  return analysis.summary;
}

function intentLabel(intent: ChatIntent) {
  switch (intent) {
    case "exchange":
      return "แลกเงิน";
    case "stock_buy":
      return "ซื้อหุ้น";
    case "stock_sell":
      return "ขายหุ้น";
    default:
      return "ยังไม่แน่ใจ";
  }
}

function quickReplyExamples() {
  return starterPhrases;
}

async function loadHistoryItems() {
  const response = await fetch("/api/chat", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as ChatResponse;
  return data.history ?? [];
}

export default function ChatHubClient() {
  const createIdRef = useRef(createConversationIdFactory());
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState("");
  const [conversation, setConversation] = useState<ConversationMessage[]>(
    () => initialConversation(() => createIdRef.current())
  );
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [pendingAnalysis, setPendingAnalysis] = useState<ChatAnalysis | null>(
    null
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const pushMessage = (message: ConversationMessage) => {
    setConversation((current) => [...current, message]);
  };

  const pushBotText = (text: string, tone: "success" | "neutral" | "danger" = "neutral") => {
    const id = createIdRef.current();
    pushMessage({
      id,
      role: "bot",
      kind: "status",
      tone,
      text,
    });
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, history, isLoadingHistory, isPreviewing, isSaving]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);
        setHistory(await loadHistoryItems());
      } catch {
        setHistory([]);
        pushBotText(
          "ตอนนี้ยังดึงประวัติเดิมไม่ได้ครับ แต่คุณเริ่มบันทึกใหม่ได้เลย"
        );
      } finally {
        setIsLoadingHistory(false);
      }
    };

    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isPreviewing || isSaving || pendingAnalysis) {
      return;
    }

    const userMessage: ConversationMessage = {
      id: createIdRef.current(),
      role: "user",
      kind: "text",
      text,
    };

    pushMessage(userMessage);
    setDraft("");
    setIsPreviewing(true);

    try {
      const response = await fetch("/api/chat", {
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

      const data = (await response.json()) as ChatResponse;
      const analysis = data.analysis;

      if (!analysis || analysis.intent === "unknown") {
        throw new Error("ยังไม่แน่ใจว่าต้องบันทึกอะไร กรุณาระบุให้ชัดขึ้น");
      }

      const previewMessage: ConversationMessage = {
        id: createIdRef.current(),
        role: "bot",
        kind: "preview",
        summary: buildPreviewSummary(analysis),
        analysis,
        status: "pending",
      };

      pushMessage(previewMessage);
      setPendingAnalysis(analysis);
    } catch (error) {
      setDraft(text);
      pushBotText(
        error instanceof Error ? error.message : "ไม่สามารถแปลงรายการได้",
        "danger"
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  const updatePreviewStatus = (status: "pending" | "confirmed" | "cancelled") => {
    setConversation((current) =>
      current.map((message) =>
        message.kind === "preview" && message.status === "pending"
          ? { ...message, status }
          : message
      )
    );
  };

  const handleConfirm = async () => {
    if (!pendingAnalysis || isSaving) {
      return;
    }

    setIsSaving(true);
    updatePreviewStatus("confirmed");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "save",
          analysis: pendingAnalysis,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as ChatResponse;
      setPendingAnalysis(null);
      setHistory(await loadHistoryItems());
      pushBotText(data.message ?? "บันทึกแล้วครับ!", "success");
    } catch (error) {
      updatePreviewStatus("pending");
      pushBotText(
        error instanceof Error ? error.message : "ไม่สามารถบันทึกรายการได้",
        "danger"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!pendingAnalysis) {
      return;
    }

    updatePreviewStatus("cancelled");
    setPendingAnalysis(null);
    pushBotText("ยกเลิกให้แล้วครับ พิมพ์ใหม่ได้เลย");
  };

  const onExampleClick = (value: string) => {
    setDraft(value);
  };

  const composerDisabled = isPreviewing || isSaving || pendingAnalysis !== null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.95))] shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <div className="border-b border-white/10 px-4 py-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
            Main Chat
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            บอทช่วยวิเคราะห์ intent แล้วค่อยยืนยันก่อนบันทึก
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            พิมพ์ข้อความธรรมดาได้เลย เช่น “แลก 1000 อัตรา 32.3” หรือ “ซื้อ AAPL 10 หุ้น ราคา 180 USD”
          </p>
        </div>

        <div
          ref={scrollRef}
          className="max-h-[calc(100dvh-18rem)] overflow-y-auto px-3 py-4 sm:px-5"
        >
          <div className="mb-4 flex flex-wrap gap-2 px-2">
            {quickReplyExamples().map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onExampleClick(item)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white sm:text-sm"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
                ประวัติที่บันทึกแล้ว
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {isLoadingHistory ? (
              <div className="px-2 text-sm text-slate-400">
                กำลังโหลดประวัติ...
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-400">
                ยังไม่มีรายการที่บันทึกไว้
              </div>
            ) : (
              history.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="flex justify-start">
                  <div className="max-w-[90%] rounded-[1.6rem] rounded-bl-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-7 text-emerald-50 shadow-lg shadow-emerald-950/10 sm:max-w-[75%] sm:text-base">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-100">
                        {intentLabel(item.kind)}
                      </span>
                      <span className="text-xs text-emerald-100/70">#{item.id}</span>
                    </div>
                    <div className="whitespace-pre-line text-sm leading-7 text-emerald-50/90">
                      {buildHistoryText(item)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="my-5 flex items-center gap-3 px-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              บทสนทนา
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-4">
            {conversation.map((message) => {
              if (message.kind === "text") {
                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id}
                    className={isUser ? "flex justify-end" : "flex justify-start"}
                  >
                    <div
                      className={[
                        "max-w-[90%] rounded-[1.6rem] px-4 py-3 text-sm leading-7 shadow-lg sm:max-w-[75%] sm:text-base",
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
                        "max-w-[90%] rounded-[1.6rem] rounded-bl-xl border px-4 py-3 text-sm leading-7 shadow-lg sm:max-w-[75%] sm:text-base",
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
                      {message.summary}
                    </p>

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
                  </div>
                </div>
              );
            })}

            {isPreviewing || isSaving ? (
              <div className="flex justify-start">
                <div className="rounded-[1.6rem] rounded-bl-xl border border-white/10 bg-slate-900/85 px-4 py-3 text-sm leading-7 text-slate-300">
                  {isPreviewing ? "กำลังให้ Gemini วิเคราะห์ข้อความ..." : "กำลังบันทึก..."}
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
            placeholder="พิมพ์เรื่องที่ต้องการบันทึก..."
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
            {pendingAnalysis
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
