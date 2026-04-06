import { NextResponse } from "next/server";

type ExchangeTransactionPayload = {
  date: string;
  thbAmount: number;
  foreignAmount: number;
  currency: string;
  rate: number;
  note: string | null;
};

type ParsedExchangeTransaction = ExchangeTransactionPayload;

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const backendBaseUrl =
  process.env.BACKEND_API_BASE_URL ?? "http://127.0.0.1:5215";
const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const parsedTransactionSchema = {
  type: "object",
  properties: {
    date: { type: "string" },
    thbAmount: { type: "number" },
    foreignAmount: { type: "number" },
    currency: { type: "string" },
    rate: { type: "number" },
    note: { type: ["string", "null"] },
  },
  required: ["date", "thbAmount", "foreignAmount", "currency", "rate", "note"],
  additionalProperties: false,
} as const;

function getBangkokToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
  }).format(new Date());
}

function normalizeParsedTransaction(
  value: ParsedExchangeTransaction
): ParsedExchangeTransaction {
  return {
    date: value.date,
    thbAmount: Number(value.thbAmount),
    foreignAmount: Number(value.foreignAmount),
    currency: value.currency?.trim().toUpperCase() || "USD",
    rate: Number(value.rate),
    note: value.note?.trim() ? value.note.trim() : null,
  };
}

function extractGeminiText(response: GeminiGenerateContentResponse) {
  return response.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "ไม่ทราบสาเหตุที่แน่ชัด";
}

async function parseExchangeTextWithGemini(text: string) {
  if (!geminiApiKey) {
    throw new Error("ยังไม่ได้ตั้งค่า GEMINI_API_KEY");
  }

  const prompt = [
    "แปลงข้อความภาษาไทย/อังกฤษเกี่ยวกับการแลกเงินให้เป็น JSON ตาม schema",
    "กติกา:",
    "- date: ใช้วันที่ที่ผู้ใช้ระบุ ถ้าไม่มีให้ใช้วันที่ปัจจุบันตามเวลา Asia/Bangkok",
    "- thbAmount: จำนวนเงินบาท",
    "- foreignAmount: จำนวนเงินสกุลต่างประเทศ",
    "- currency: สกุลเงินต่างประเทศ ค่าเริ่มต้น USD ถ้าไม่ระบุ",
    "- rate: อัตราแลกเปลี่ยนต่อ 1 หน่วยเงินต่างประเทศเป็นเงินบาท",
    "- ถ้าผู้ใช้ระบุเพียงเงินบาทและอัตรา ให้คำนวณ foreignAmount = thbAmount / rate และปัดทศนิยม 2 ตำแหน่ง",
    "- note: ถ้ามีหมายเหตุให้ใส่ ถ้าไม่มีให้เป็น null",
    `- ถ้าข้อความไม่มีวันที่ ให้ใช้ ${getBangkokToday()}`,
    "",
    `ข้อความผู้ใช้: ${text}`,
  ].join("\n");

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
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: parsedTransactionSchema,
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

  const parsed = JSON.parse(rawText) as ParsedExchangeTransaction;
  return normalizeParsedTransaction(parsed);
}

async function saveExchangeTransaction(payload: ExchangeTransactionPayload) {
  const response = await fetch(`${backendBaseUrl}/api/ExchangeTransactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();
  let body: unknown = null;

  if (bodyText) {
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = bodyText;
    }
  }

  if (!response.ok) {
    throw new Error(
      typeof body === "object" && body !== null && "message" in body
        ? `${String((body as { message?: string }).message)}${
            "detail" in body && (body as { detail?: unknown }).detail
              ? `: ${JSON.stringify((body as { detail?: unknown }).detail)}`
              : ""
          }`
        : `Backend error (${response.status})`
    );
  }

  return body;
}

export async function GET() {
  try {
    const response = await fetch(`${backendBaseUrl}/api/ExchangeTransactions`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "ไม่สามารถดึงรายการแลกเงินได้" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: "ไม่สามารถเชื่อมต่อ backend ได้", detail: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim();

    if (!text) {
      return NextResponse.json(
        { message: "กรุณาพิมพ์ข้อความสำหรับแปลงรายการแลกเงิน" },
        { status: 400 }
      );
    }

    const parsed = await parseExchangeTextWithGemini(text);
    const saved = await saveExchangeTransaction(parsed);

    return NextResponse.json({
      message: "บันทึกรายการแลกเงินเรียบร้อยแล้ว",
      parsed,
      saved,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "ไม่สามารถบันทึกรายการแลกเงินได้", detail: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
