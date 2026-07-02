import { NextResponse } from "next/server";
import { getValidations, getDashboardStats, getReportData } from "@/services/validation.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  try {
    switch (type) {
      case "stats":
        return NextResponse.json(await getDashboardStats());
      case "reports":
        return NextResponse.json(await getReportData());
      default:
        return NextResponse.json(await getValidations());
    }
  } catch {
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}
