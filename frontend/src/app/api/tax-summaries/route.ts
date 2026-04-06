import { NextResponse } from "next/server";

const backendBaseUrl =
  process.env.BACKEND_API_BASE_URL ?? "http://127.0.0.1:5215";

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "ไม่ทราบสาเหตุที่แน่ชัด";
}

export async function GET() {
  try {
    const response = await fetch(`${backendBaseUrl}/api/TaxSummaries`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "ไม่สามารถดึงข้อมูลสรุปภาษีได้" },
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
