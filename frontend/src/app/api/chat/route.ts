import { NextResponse } from "next/server";

type ChatIntent = "exchange" | "stock_buy" | "stock_sell" | "unknown";

type ChatData = {
  date?: string | null;
  executedAt?: string | null;
  exchangeType?: "buy_usd" | "sell_usd" | null;
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
  data: ChatData;
};

type NormalizedExchangeData = {
  date: string;
  exchangeType: "buy_usd" | "sell_usd";
  thbAmount: number;
  foreignAmount: number;
  currency: string;
  midRate: number | null;
  actualRate: number;
  spread: number | null;
  note: string | null;
};

type ExchangeSummaryInput = Pick<
  NormalizedExchangeData,
  | "date"
  | "exchangeType"
  | "thbAmount"
  | "foreignAmount"
  | "currency"
  | "midRate"
  | "actualRate"
  | "spread"
>;

type NormalizedStockData = {
  executedAt: string;
  ticker: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  vatUsd: number;
  totalCostUsd: number;
  rateAtTrade: number | null;
  priceThb: number | null;
  note: string | null;
};

type StockSummaryInput = Pick<
  NormalizedStockData,
  "executedAt" | "ticker" | "quantity" | "priceUsd" | "feeUsd" | "vatUsd" | "totalCostUsd" | "rateAtTrade" | "priceThb"
>;

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type ChatRequest =
  | {
      mode: "preview";
      text: string;
    }
  | {
      mode: "save";
      analysis: ChatAnalysis;
    };

type ExchangeHistoryItem = {
  kind: "exchange";
  id: number;
  createdAt: string;
  exchangeType: "buy_usd" | "sell_usd";
  title: string;
  lines: string[];
};

type StockHistoryItem = {
  kind: "stock_buy" | "stock_sell";
  id: number;
  createdAt: string;
  title: string;
  lines: string[];
};

type ChatHistoryItem = ExchangeHistoryItem | StockHistoryItem;

const backendBaseUrl =
  process.env.BACKEND_API_BASE_URL ?? "http://127.0.0.1:5215";
const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const analysisSchema = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      enum: ["exchange", "stock_buy", "stock_sell", "unknown"],
    },
    data: {
      type: "object",
      properties: {
        date: { type: ["string", "null"] },
        executedAt: { type: ["string", "null"] },
        exchangeType: {
          type: ["string", "null"],
          enum: ["buy_usd", "sell_usd", null],
        },
        thbAmount: { type: ["number", "null"] },
        foreignAmount: { type: ["number", "null"] },
        currency: { type: ["string", "null"] },
        midRate: { type: ["number", "null"] },
        actualRate: { type: ["number", "null"] },
        spread: { type: ["number", "null"] },
        ticker: { type: ["string", "null"] },
        quantity: { type: ["number", "null"] },
        priceUsd: { type: ["number", "null"] },
        feeUsd: { type: ["number", "null"] },
        vatUsd: { type: ["number", "null"] },
        totalCostUsd: { type: ["number", "null"] },
        rateAtTrade: { type: ["number", "null"] },
        priceThb: { type: ["number", "null"] },
        note: { type: ["string", "null"] },
      },
      additionalProperties: false,
    },
  },
  required: ["intent", "data"],
  additionalProperties: false,
} as const;

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "ไม่ทราบสาเหตุที่แน่ชัด";
}

function getBangkokToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
  }).format(new Date());
}

function getUtcNowIso() {
  return new Date().toISOString();
}

function normalizeDate(value: string | null | undefined) {
  if (!value) {
    return getBangkokToday();
  }

  const trimmed = value.trim();
  const asDate = new Date(trimmed);

  if (Number.isNaN(asDate.getTime())) {
    return trimmed.slice(0, 10) || getBangkokToday();
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
  }).format(asDate);
}

function normalizeDateTime(value: string | null | undefined) {
  if (!value) {
    return getUtcNowIso();
  }

  const trimmed = value.trim();
  const asDate = new Date(trimmed);

  if (Number.isNaN(asDate.getTime())) {
    return trimmed || getUtcNowIso();
  }

  return asDate.toISOString();
}

function buildExchangeSortTimestamp(date: string) {
  return `${date}T12:00:00.000Z`;
}

function normalizeCurrency(value: string | null | undefined) {
  return value?.trim().toUpperCase() || "USD";
}

function normalizeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseBackendTimestamp(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const trimmed = value.trim().replace(" ", "T");
  const hasTimeZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(trimmed);
  const normalizedValue = hasTimeZone ? trimmed : `${trimmed}Z`;
  const parsed = new Date(normalizedValue);
  return Number.isNaN(parsed.getTime()) ? value.trim() : parsed.toISOString();
}

function extractGeminiText(response: GeminiGenerateContentResponse) {
  return response.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
}

function buildExchangeSummary(data: ExchangeSummaryInput) {
  const exchangeTypeLabel =
    data.exchangeType === "sell_usd"
      ? "💱 แลกกลับ (USD→THB)"
      : "💱 แลกเงิน (THB→USD)";

  return [
    "ยืนยันบันทึกนี้ไหมครับ?",
    exchangeTypeLabel,
    `💰 จำนวนบาท: ${data.thbAmount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `💵 ได้รับ: ${data.foreignAmount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${data.currency}`,
    `📊 อัตรา: ${data.actualRate.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`,
    data.midRate === null
      ? `📎 เรทกลาง: -`
      : `📎 เรทกลาง: ${data.midRate.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`,
    data.spread === null
      ? `📌 Spread: -`
      : `📌 Spread: ${data.spread.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`,
  ].join("\n");
}

function buildStockSummary(
  intent: "stock_buy" | "stock_sell",
  data: StockSummaryInput
) {
  const verb = intent === "stock_buy" ? "ซื้อ" : "ขาย";
  return [
    "ยืนยันบันทึกนี้ไหมครับ?",
    `📈 ${verb}หุ้น: ${data.ticker}`,
    `🔢 จำนวน: ${data.quantity.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 6 })} หุ้น`,
    `💵 ราคา: ${data.priceUsd.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USD`,
    `🧾 ค่าธรรมเนียม: ${data.feeUsd.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
    `🧮 รวมต้นทุน: ${data.totalCostUsd.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
    data.rateAtTrade === null
      ? `💱 เรท: -`
      : `💱 เรท: ${data.rateAtTrade.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`,
    data.priceThb === null
      ? `🇹🇭 มูลค่า THB: -`
      : `🇹🇭 มูลค่า THB: ${data.priceThb.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ].join("\n");
}

function parseJsonResponse(rawText: string) {
  const trimmed = rawText.trim();
  const normalized = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()
    : trimmed;

  return JSON.parse(normalized) as ChatAnalysis;
}

function buildPrompt(text: string) {
  return [
    "วิเคราะห์ข้อความผู้ใช้เพื่อบันทึกการลงทุนและคืน JSON เท่านั้น",
    "กติกา:",
    "- intent ต้องเป็น exchange, stock_buy, stock_sell หรือ unknown",
    '- return JSON object ตามรูปแบบ {"intent":"...","data":{...}} เท่านั้น',
    "- ถ้าเป็นการแลกเงิน ให้ใส่ intent = exchange",
    "- ถ้า intent = exchange ต้องมี exchangeType เป็น buy_usd หรือ sell_usd",
    "- buy_usd ใช้เมื่อข้อความหมายถึงแลก THB -> USD หรือเพื่อซื้อหุ้น",
    "- sell_usd ใช้เมื่อข้อความหมายถึงแลก USD -> THB หรือแลกกลับ",
    "- ถ้าเป็นการซื้อหุ้น ให้ใส่ intent = stock_buy",
    "- ถ้าเป็นการขายหุ้น ให้ใส่ intent = stock_sell",
    "- ถ้าไม่แน่ใจ ให้ intent = unknown",
    "- data ต้องเก็บเฉพาะฟิลด์ที่เกี่ยวข้อง",
    "- exchange ต้องมี date, exchangeType, thbAmount, foreignAmount, currency, midRate, actualRate, spread, note",
    "- ถ้าเป็นข้อความแลกเงินที่มีแค่ฝั่งเดียว เช่น foreignAmount หรือ thbAmount ให้คืนข้อมูลเท่าที่รู้ได้ แล้วปล่อยอีกฝั่งเป็น null",
    "- ถ้ามี actualRate และมี amount ฝั่งเดียว ให้ช่วยคำนวณอีกฝั่งถ้าเป็นไปได้",
    "- stock ต้องมี executedAt, ticker, quantity, priceUsd, feeUsd, vatUsd, totalCostUsd, rateAtTrade, priceThb, note",
    "- date ใช้รูปแบบ yyyy-MM-dd",
    "- executedAt ใช้รูปแบบ yyyy-MM-ddTHH:mm:ssZ",
    "- currency ค่าเริ่มต้นเป็น USD",
    "- feeUsd และ vatUsd ค่าเริ่มต้นเป็น 0 ถ้าไม่ระบุ",
    "- spread = actualRate - midRate ถ้า midRate มี",
    "- totalCostUsd = (priceUsd x quantity) + feeUsd + vatUsd ถ้าไม่ระบุ",
    "- priceThb = totalCostUsd x rateAtTrade ถ้า rateAtTrade มี",
    "- ถ้าข้อมูลไม่พอให้ intent = unknown",
    "",
    `ข้อความผู้ใช้: ${text}`,
  ].join("\n");
}

async function analyzeWithGemini(text: string) {
  if (!geminiApiKey) {
    throw new Error("ยังไม่ได้ตั้งค่า GEMINI_API_KEY");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(text) }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: analysisSchema,
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini API error: ${body}`);
  }

  const data = (await response.json()) as GeminiGenerateContentResponse;
  const rawText = extractGeminiText(data);

  if (!rawText) {
    throw new Error("Gemini ไม่ได้ส่ง JSON กลับมา");
  }

  const parsed = parseJsonResponse(rawText);

  if (!parsed.intent) {
    throw new Error("Gemini ไม่ได้ส่ง intent กลับมา");
  }

  return parsed;
}

function normalizeExchangeAnalysis(analysis: ChatAnalysis) {
  const date = normalizeDate(analysis.data.date);
  const exchangeType =
    analysis.data.exchangeType === "sell_usd"
      ? "sell_usd"
      : analysis.data.exchangeType === "buy_usd"
        ? "buy_usd"
        : null;
  const thbAmount = normalizeNumber(analysis.data.thbAmount);
  const foreignAmount = normalizeNumber(analysis.data.foreignAmount);
  const actualRate = normalizeNumber(analysis.data.actualRate);
  const midRate = normalizeNumber(analysis.data.midRate);
  const currency = normalizeCurrency(analysis.data.currency);
  const resolvedThbAmount =
    thbAmount ??
    (foreignAmount !== null && actualRate !== null ? foreignAmount * actualRate : null);
  const resolvedForeignAmount =
    foreignAmount ??
    (thbAmount !== null && actualRate !== null && actualRate > 0
      ? thbAmount / actualRate
      : null);
  const resolvedSpread =
    midRate === null
      ? normalizeNumber(analysis.data.spread)
      : actualRate === null
        ? normalizeNumber(analysis.data.spread)
        : actualRate - midRate;

  if (
    actualRate === null ||
    exchangeType === null ||
    resolvedThbAmount === null ||
    resolvedForeignAmount === null ||
    resolvedThbAmount <= 0 ||
    resolvedForeignAmount <= 0 ||
    actualRate <= 0
  ) {
    throw new Error("ข้อมูลแลกเงินไม่ครบ");
  }

  return {
    intent: "exchange" as const,
    data: {
      date,
      exchangeType,
      thbAmount: resolvedThbAmount,
      foreignAmount: resolvedForeignAmount,
      currency,
      midRate,
      actualRate,
      spread: resolvedSpread,
      note: analysis.data.note?.trim() ? analysis.data.note.trim() : null,
    } satisfies NormalizedExchangeData,
    summary: buildExchangeSummary({
      date,
      exchangeType,
      thbAmount: resolvedThbAmount,
      foreignAmount: resolvedForeignAmount,
      currency,
      midRate,
      actualRate,
      spread: resolvedSpread,
    } satisfies ExchangeSummaryInput),
  };
}

function normalizeStockAnalysis(intent: "stock_buy" | "stock_sell", analysis: ChatAnalysis) {
  const executedAt = normalizeDateTime(analysis.data.executedAt);
  const ticker = analysis.data.ticker?.trim().toUpperCase() || "";
  const quantity = normalizeNumber(analysis.data.quantity);
  const priceUsd = normalizeNumber(analysis.data.priceUsd);
  const feeUsd = normalizeNumber(analysis.data.feeUsd) ?? 0;
  const vatUsd = normalizeNumber(analysis.data.vatUsd) ?? 0;
  const totalCostUsd = normalizeNumber(analysis.data.totalCostUsd);
  const rateAtTrade = normalizeNumber(analysis.data.rateAtTrade);
  const priceThb = normalizeNumber(analysis.data.priceThb);

  if (
    !ticker ||
    quantity === null ||
    priceUsd === null ||
    quantity <= 0 ||
    priceUsd <= 0
  ) {
    throw new Error("ข้อมูลหุ้นไม่ครบ");
  }

  const resolvedTotalCostUsd =
    totalCostUsd && totalCostUsd > 0
      ? totalCostUsd
      : priceUsd * quantity + feeUsd + vatUsd;

  return {
    intent,
    data: {
      executedAt,
      ticker,
      quantity,
      priceUsd,
      feeUsd,
      vatUsd,
      totalCostUsd: resolvedTotalCostUsd,
      rateAtTrade,
      priceThb:
        rateAtTrade === null
          ? priceThb
          : resolvedTotalCostUsd * rateAtTrade,
      note: analysis.data.note?.trim() ? analysis.data.note.trim() : null,
    } satisfies NormalizedStockData,
    summary: buildStockSummary(intent, {
      executedAt,
      ticker,
      quantity,
      priceUsd,
      feeUsd,
      vatUsd,
      totalCostUsd: resolvedTotalCostUsd,
      rateAtTrade,
      priceThb:
        rateAtTrade === null
          ? priceThb
          : resolvedTotalCostUsd * rateAtTrade,
    } satisfies StockSummaryInput),
  };
}

function normalizeAnalysis(analysis: ChatAnalysis) {
  switch (analysis.intent) {
    case "exchange":
      return normalizeExchangeAnalysis(analysis);
    case "stock_buy":
    case "stock_sell":
      return normalizeStockAnalysis(analysis.intent, analysis);
    default:
      throw new Error("ยังไม่แน่ใจว่าต้องบันทึกอะไร กรุณาระบุให้ชัดขึ้น");
  }
}

function convertExchangeHistoryItem(
  transaction: Record<string, unknown>
): ExchangeHistoryItem {
  const id = Number(transaction.id ?? 0);
  const date = String(transaction.date ?? transaction.Date ?? "");
  const createdAt = parseBackendTimestamp(
    transaction.createdAt ??
      transaction.CreatedAt ??
      transaction.created_at ??
      transaction.created
  );
  const thbAmount = Number(transaction.thbAmount ?? transaction.ThbAmount ?? 0);
  const foreignAmount = Number(
    transaction.foreignAmount ?? transaction.ForeignAmount ?? 0
  );
  const currency = String(transaction.currency ?? transaction.Currency ?? "USD");
  const actualRate = Number(transaction.actualRate ?? transaction.ActualRate ?? 0);
  const midRate =
    transaction.midRate === null || transaction.midRate === undefined
      ? null
      : Number(transaction.midRate);
  const spread =
    transaction.spread === null || transaction.spread === undefined
      ? null
      : Number(transaction.spread);
  const exchangeTypeValue = String(
    transaction.exchangeType ??
      transaction.ExchangeType ??
      transaction.exchange_type ??
      "buy_usd"
  ).toLowerCase();
  const exchangeType =
    exchangeTypeValue === "sell_usd" ? "sell_usd" : "buy_usd";

  return {
    kind: "exchange",
    id,
    createdAt: createdAt ?? buildExchangeSortTimestamp(date),
    exchangeType,
    title:
      exchangeType === "sell_usd"
        ? "💱 แลกกลับ (USD→THB)"
        : "💱 แลกเงิน (THB→USD)",
    lines: buildExchangeSummary({
      date,
      exchangeType,
      thbAmount,
      foreignAmount,
      currency,
      midRate,
      actualRate,
      spread,
    })
      .split("\n")
      .slice(1),
  };
}

function convertStockHistoryItem(
  transaction: Record<string, unknown>
): StockHistoryItem {
  const id = Number(transaction.id ?? 0);
  const executedAt = String(
    transaction.executedAt ?? transaction.ExecutedAt ?? ""
  );
  const createdAt = parseBackendTimestamp(
    transaction.createdAt ??
      transaction.CreatedAt ??
      transaction.created_at ??
      transaction.created
  );
  const ticker = String(transaction.ticker ?? transaction.Ticker ?? "");
  const type = Number(transaction.type ?? transaction.Type ?? 1) === 1
    ? "stock_buy"
    : "stock_sell";
  const quantity = Number(transaction.quantity ?? transaction.Quantity ?? 0);
  const priceUsd = Number(transaction.priceUsd ?? transaction.PriceUsd ?? 0);
  const feeUsd = Number(transaction.feeUsd ?? transaction.FeeUsd ?? 0);
  const vatUsd = Number(transaction.vatUsd ?? transaction.VatUsd ?? 0);
  const totalCostUsd = Number(
    transaction.totalCostUsd ?? transaction.TotalCostUsd ?? 0
  );
  const rateAtTrade =
    transaction.rateAtTrade === null || transaction.rateAtTrade === undefined
      ? null
      : Number(transaction.rateAtTrade ?? transaction.RateAtTrade);
  const priceThb =
    transaction.priceThb === null || transaction.priceThb === undefined
      ? null
      : Number(transaction.priceThb ?? transaction.PriceThb);

  return {
    kind: type,
    id,
    createdAt: createdAt ?? normalizeDateTime(executedAt),
    title: type === "stock_buy" ? "ซื้อหุ้น" : "ขายหุ้น",
    lines: buildStockSummary(type, {
      executedAt,
      ticker,
      quantity,
      priceUsd,
      feeUsd,
      vatUsd,
      totalCostUsd,
      rateAtTrade,
      priceThb,
    })
      .split("\n")
      .slice(1),
  };
}

async function loadChatHistory(): Promise<ChatHistoryItem[]> {
  const [exchangeResponse, stockResponse] = await Promise.all([
    fetch(`${backendBaseUrl}/api/ExchangeTransactions`, { cache: "no-store" }),
    fetch(`${backendBaseUrl}/api/StockTransactions`, { cache: "no-store" }),
  ]);

  if (!exchangeResponse.ok) {
    throw new Error("ไม่สามารถดึงประวัติแลกเงินได้");
  }

  if (!stockResponse.ok) {
    throw new Error("ไม่สามารถดึงประวัติหุ้นได้");
  }

  const [exchangeData, stockData] = (await Promise.all([
    exchangeResponse.json(),
    stockResponse.json(),
  ])) as [Record<string, unknown>[], Record<string, unknown>[]];

  const exchangeItems = exchangeData.map(convertExchangeHistoryItem);
  const stockItems = stockData.map(convertStockHistoryItem);

  return [...exchangeItems, ...stockItems].sort((left, right) => {
    const timeOrder = left.createdAt.localeCompare(right.createdAt);
    if (timeOrder !== 0) {
      return timeOrder;
    }

    return left.id - right.id;
  });
}

async function saveExchange(
  data: NormalizedExchangeData
): Promise<Record<string, unknown>> {
  const response = await fetch(`${backendBaseUrl}/api/ExchangeTransactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      date: data.date,
      exchangeType: data.exchangeType,
      thbAmount: data.thbAmount,
      foreignAmount: data.foreignAmount,
      currency: data.currency,
      midRate: data.midRate ?? undefined,
      actualRate: data.actualRate,
      spread: data.spread ?? undefined,
      note: data.note,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Backend error (${response.status})`);
  }

  return text ? (JSON.parse(text) as Record<string, unknown>) : {};
}

async function saveStock(
  intent: "stock_buy" | "stock_sell",
  data: NormalizedStockData
): Promise<Record<string, unknown>> {
  const response = await fetch(`${backendBaseUrl}/api/StockTransactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      executedAt: data.executedAt,
      ticker: data.ticker,
      type: intent === "stock_buy" ? 1 : 2,
      quantity: data.quantity,
      priceUsd: data.priceUsd,
      feeUsd: data.feeUsd,
      vatUsd: data.vatUsd,
      totalCostUsd: data.totalCostUsd,
      rateAtTrade: data.rateAtTrade ?? undefined,
      priceThb: data.priceThb ?? undefined,
      note: data.note,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Backend error (${response.status})`);
  }

  return text ? (JSON.parse(text) as Record<string, unknown>) : {};
}

export async function GET() {
  try {
    const history = await loadChatHistory();
    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json(
      { message: "ไม่สามารถโหลดประวัติแชทได้", detail: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;

    if (body.mode === "preview") {
      const text = body.text.trim();

      if (!text) {
        return NextResponse.json(
          { message: "กรุณาพิมพ์ข้อความสำหรับบันทึก" },
          { status: 400 }
        );
      }

      const analysis = normalizeAnalysis(await analyzeWithGemini(text));
      return NextResponse.json({
        message: "แปลงรายการเป็น JSON เรียบร้อยแล้ว",
        analysis,
      });
    }

    if (body.mode === "save") {
      const analysis = normalizeAnalysis(body.analysis);

      if (analysis.intent === "exchange") {
        const saved = await saveExchange(analysis.data);
        return NextResponse.json({
          message: "บันทึกรายการแลกเงินเรียบร้อยแล้ว",
          saved,
        });
      }

      if (analysis.intent === "stock_buy" || analysis.intent === "stock_sell") {
        const saved = await saveStock(analysis.intent, analysis.data);
        return NextResponse.json({
          message:
            analysis.intent === "stock_buy"
              ? "บันทึกรายการซื้อหุ้นเรียบร้อยแล้ว"
              : "บันทึกรายการขายหุ้นเรียบร้อยแล้ว",
          saved,
        });
      }

      return NextResponse.json(
        { message: "ยังไม่แน่ใจว่าต้องบันทึกอะไร" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "คำขอไม่ถูกต้อง" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "ไม่สามารถดำเนินการกับแชทนี้ได้",
        detail: toErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
