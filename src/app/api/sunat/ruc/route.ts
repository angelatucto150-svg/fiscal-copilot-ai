import { NextResponse } from "next/server";
import { consultarRuc } from "@/services/sunat.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ruc = searchParams.get("ruc");

  if (!ruc || ruc.length !== 11) {
    return NextResponse.json({ error: "RUC inválido" }, { status: 400 });
  }

  try {
    const data = await consultarRuc(ruc);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error al consultar RUC" }, { status: 500 });
  }
}
