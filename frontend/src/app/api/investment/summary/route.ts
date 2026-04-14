import { NextResponse } from "next/server";

const backendBaseUrl =
  process.env.BACKEND_API_BASE_URL ?? "http://127.0.0.1:5215";

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "ไม่ทราบสาเหตุที่แน่ชัด";
}

export async function GET() {
  try {
    const response = await fetch(`${backendBaseUrl}/api/investment/summary`, {
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          message: "ไม่สามารถดึงสรุปการลงทุนได้",
          detail: text || `Backend error (${response.status})`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(text ? JSON.parse(text) : {});
  } catch (error) {
    return NextResponse.json(
      { message: "ไม่สามารถเชื่อมต่อ backend ได้", detail: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
