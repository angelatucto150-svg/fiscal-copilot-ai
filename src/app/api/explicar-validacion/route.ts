import { NextResponse } from "next/server";
import { explicarValidacion } from "@/services/aiValidation.service";
import type { ValidationSummary } from "@/types";

export async function POST(req: Request) {
  try {
    const summary = (await req.json()) as ValidationSummary;

    if (
      !summary ||
      typeof summary.score !== "number" ||
      !summary.riesgo ||
      !Array.isArray(summary.resultados)
    ) {
      return NextResponse.json(
        { error: "ValidationSummary inválido" },
        { status: 400 }
      );
    }

    const { explicacion } = await explicarValidacion(summary);

    return NextResponse.json({ explicacion });
  } catch (e: unknown) {
    console.error("ERROR COMPLETO");

    if (e instanceof Error) {
      console.error(e.message);
      console.error(e.stack);
    }

    return NextResponse.json(
      { error: "No fue posible generar la explicación." },
      { status: 500 }
    );
  }
}