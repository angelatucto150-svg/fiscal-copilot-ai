import { NextResponse } from "next/server";
import { chatWithCopilot } from "@/services/ai.service";
import { getValidationById } from "@/services/validation.service";
import type { AIChatMessage } from "@/types";

export async function POST(request: Request) {
  try {
    const { message, validationId, history } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });
    }

    let validation = null;
    if (validationId) {
      validation = await getValidationById(validationId);
    }

    const response = await chatWithCopilot(message, validation ?? undefined, history as AIChatMessage[]);

    return NextResponse.json({ response });
  } catch {
    return NextResponse.json({ error: "Error al procesar la consulta" }, { status: 500 });
  }
}
