import { NextResponse } from "next/server";

const backendBaseUrl =
  process.env.BACKEND_API_BASE_URL ?? "http://127.0.0.1:5215";

type SummaryResponse = {
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
};

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
  sortDate: string;
  category: "exchange" | "stock";
  type: string;
  asset: string;
  amount: string;
  realizedGainThb: number | null;
  note: string | null;
};

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "ไม่ทราบสาเหตุที่แน่ชัด";
}

function parseTimestamp(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildExchangeAmount(transaction: Record<string, unknown>) {
  const thbAmount = asNumber(transaction.thbAmount ?? transaction.ThbAmount);
  const foreignAmount = asNumber(
    transaction.foreignAmount ?? transaction.ForeignAmount
  );
  const currency = String(transaction.currency ?? transaction.Currency ?? "USD");
  return `฿${thbAmount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} / ${foreignAmount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function buildStockAmount(transaction: Record<string, unknown>) {
  const quantity = asNumber(transaction.quantity ?? transaction.Quantity);
  const totalCostUsd = asNumber(
    transaction.totalCostUsd ?? transaction.TotalCostUsd
  );
  return `${quantity.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  })} หุ้น / ${totalCostUsd.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD`;
}

function buildRealizedGainMap(items: RealizedGainItem[]) {
  return new Map(
    items.map((item) => [`${item.sourceType}:${item.transactionId}`, item.gainThb])
  );
}

function convertExchangeTransactions(
  transactions: Record<string, unknown>[],
  realizedGainMap: Map<string, number>
) {
  return transactions.map((transaction) => {
    const exchangeType = String(
      transaction.exchangeType ??
        transaction.ExchangeType ??
        transaction.exchange_type ??
        "buy_usd"
    ).toLowerCase();
    const date = String(transaction.date ?? transaction.Date ?? "");
    const createdAt =
      parseTimestamp(
        transaction.createdAt ??
          transaction.CreatedAt ??
          transaction.created_at
      ) ?? `${date}T12:00:00.000Z`;

    return {
      id: `exchange-${String(transaction.id ?? transaction.Id ?? 0)}`,
      date: createdAt,
      sortDate: createdAt,
      category: "exchange" as const,
      type: exchangeType === "sell_usd" ? "Sell USD" : "Buy USD",
      asset: String(transaction.currency ?? transaction.Currency ?? "USD"),
      amount: buildExchangeAmount(transaction),
      realizedGainThb:
        exchangeType === "sell_usd"
          ? realizedGainMap.get(
              `exchange_sell_usd:${String(transaction.id ?? transaction.Id ?? 0)}`
            ) ?? null
          : null,
      note:
        typeof transaction.note === "string"
          ? transaction.note
          : typeof transaction.Note === "string"
            ? transaction.Note
            : null,
    } satisfies SummaryTransactionItem;
  });
}

function convertStockTransactions(
  transactions: Record<string, unknown>[],
  realizedGainMap: Map<string, number>
) {
  return transactions.map((transaction) => {
    const rawType = String(transaction.type ?? transaction.Type ?? "buy").toLowerCase();
    const stockType =
      rawType === "2" || rawType === "sell"
        ? "Sell"
        : rawType === "3" || rawType === "dividend"
          ? "Dividend"
          : rawType === "4" || rawType === "withdrawal"
            ? "Withdrawal"
            : "Buy";
    const executedAt =
      parseTimestamp(transaction.executedAt ?? transaction.ExecutedAt) ??
      parseTimestamp(transaction.createdAt ?? transaction.CreatedAt) ??
      "";
    const id = String(transaction.id ?? transaction.Id ?? 0);

    return {
      id: `stock-${id}`,
      date: executedAt,
      sortDate: executedAt,
      category: "stock" as const,
      type: stockType,
      asset: String(transaction.ticker ?? transaction.Ticker ?? "-"),
      amount: buildStockAmount(transaction),
      realizedGainThb:
        stockType === "Sell"
          ? realizedGainMap.get(`stock_sell:${id}`) ?? null
          : null,
      note:
        typeof transaction.note === "string"
          ? transaction.note
          : typeof transaction.Note === "string"
            ? transaction.Note
            : null,
    } satisfies SummaryTransactionItem;
  });
}

export async function GET() {
  try {
    const [summaryResponse, exchangeResponse, stockResponse] = await Promise.all([
      fetch(`${backendBaseUrl}/api/investment/summary`, { cache: "no-store" }),
      fetch(`${backendBaseUrl}/api/ExchangeTransactions`, { cache: "no-store" }),
      fetch(`${backendBaseUrl}/api/StockTransactions`, { cache: "no-store" }),
    ]);

    if (!summaryResponse.ok) {
      const text = await summaryResponse.text();
      return NextResponse.json(
        {
          message: "ไม่สามารถดึงสรุปการลงทุนได้",
          detail: text || `Backend error (${summaryResponse.status})`,
        },
        { status: summaryResponse.status }
      );
    }

    if (!exchangeResponse.ok || !stockResponse.ok) {
      return NextResponse.json(
        { message: "ไม่สามารถดึงรายการธุรกรรมสำหรับหน้า summary ได้" },
        { status: 500 }
      );
    }

    const [summary, exchangeTransactions, stockTransactions] = (await Promise.all([
      summaryResponse.json(),
      exchangeResponse.json(),
      stockResponse.json(),
    ])) as [SummaryResponse, Record<string, unknown>[], Record<string, unknown>[]];

    const realizedGainMap = buildRealizedGainMap(summary.realizedGains);
    const transactions = [
      ...convertExchangeTransactions(exchangeTransactions, realizedGainMap),
      ...convertStockTransactions(stockTransactions, realizedGainMap),
    ].sort((left, right) => right.sortDate.localeCompare(left.sortDate));

    return NextResponse.json({
      ...summary,
      transactions,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "ไม่สามารถเชื่อมต่อ backend ได้", detail: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
