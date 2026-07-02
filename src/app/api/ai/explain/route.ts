import { NextResponse } from "next/server";
import { explainRequirement } from "@/services/ai.service";

export async function POST(request: Request) {
  try {
    const { requirementId } = await request.json();

    if (!requirementId) {
      return NextResponse.json({ error: "ID de requisito requerido" }, { status: 400 });
    }

    const explanation = await explainRequirement(requirementId);
    return NextResponse.json({ explanation });
  } catch {
    return NextResponse.json({ error: "Error al generar explicación" }, { status: 500 });
  }
}
