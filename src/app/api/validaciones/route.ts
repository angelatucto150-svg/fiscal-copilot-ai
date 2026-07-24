import { NextResponse } from "next/server";
import {
  getValidations,
  getDashboardStats,
  getReportData,
} from "@/services/validation.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const userId = searchParams.get("userId") ?? undefined;

  try {
    switch (type) {
      case "stats":
        return NextResponse.json(await getDashboardStats(userId));
      case "reports":
        return NextResponse.json(await getReportData(userId));
      default:
        return NextResponse.json(await getValidations(userId));
    }
  } catch {
    return NextResponse.json(
      { error: "Error al obtener datos" },
      { status: 500 }
    );
  }
}
