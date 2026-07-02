/**
 * Servicio de IA Fiscal Copilot.
 * Usa OpenAI cuando OPENAI_API_KEY está configurada; de lo contrario, respuestas mock.
 */
import OpenAI from "openai";
import type { AIChatMessage, ValidationRecord } from "@/types";
import { generateId } from "@/utils";
import { SUBSTANTIAL_QUESTIONS } from "@/types";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const SYSTEM_PROMPT = `Eres Fiscal Copilot AI, un asistente tributario peruano especializado en crédito fiscal e IGV.
Responde en español, con lenguaje claro y ejemplos prácticos.
No reemplazas a SUNAT. Ayudas a validar preventivamente comprobantes antes del registro contable.
Sé conciso pero completo. Menciona riesgos cuando corresponda.`;

export async function chatWithCopilot(
  message: string,
  validation?: ValidationRecord,
  history: AIChatMessage[] = []
): Promise<string> {
  if (openai) {
    try {
      const context = validation
        ? `\nContexto de validación: RUC ${validation.comprobante.rucProveedor}, riesgo ${validation.riskAssessment.puntaje}/100 (${validation.riskAssessment.etiqueta}).`
        : "";

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + context },
          ...history.slice(-6).map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content ?? getMockResponse(message, validation);
    } catch {
      return getMockResponse(message, validation);
    }
  }

  return getMockResponse(message, validation);
}

export async function explainRequirement(requirementId: string): Promise<string> {
  const question = SUBSTANTIAL_QUESTIONS.find((q) => q.id === requirementId);
  if (!question) return "No se encontró información para este requisito.";

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Explica de forma sencilla con ejemplos prácticos: "${question.pregunta}"\n\nContexto base: ${question.ayudaContextual}`,
          },
        ],
        max_tokens: 400,
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content ?? question.ayudaContextual;
    } catch {
      return question.ayudaContextual;
    }
  }

  return question.ayudaContextual;
}

export function createChatMessage(
  role: "user" | "assistant",
  content: string,
  validationId?: string
): AIChatMessage {
  return {
    id: generateId(),
    role,
    content,
    timestamp: new Date().toISOString(),
    validationId,
  };
}

function getMockResponse(message: string, validation?: ValidationRecord): string {
  const lower = message.toLowerCase();

  if (lower.includes("puedo usar") || lower.includes("puedo utilizar")) {
    if (validation) {
      if (validation.riskAssessment.puntaje >= 80) {
        return "Sí, este comprobante presenta bajo riesgo y puede usarse como crédito fiscal, siempre que cuentes con el sustento documental correspondiente y la operación esté vinculada a tu actividad económica.";
      }
      if (validation.riskAssessment.puntaje >= 50) {
        return "Con precaución. El comprobante tiene riesgo moderado. Te recomiendo resolver las observaciones señaladas antes de registrarlo como crédito fiscal.";
      }
      return "No se recomienda usar este comprobante como crédito fiscal en este momento. Presenta alto riesgo tributario. Resuelve primero las observaciones detectadas.";
    }
    return "Para determinar si puedes usar una factura, necesito analizar el comprobante. Inicia una nueva validación para obtener una recomendación personalizada.";
  }

  if (lower.includes("operación real") || lower.includes("operacion real")) {
    return "La operación real significa que efectivamente recibiste el bien o servicio por el que se emitió el comprobante. No basta con tener la factura: debe existir entrega real. Ejemplo: si pagaste por 10 laptops, debes haberlas recibido. Comprobantes sin operación real representan fraude tributario.";
  }

  if (lower.includes("riesgo") || lower.includes("por qué")) {
    if (validation) {
      return `Este comprobante tiene un puntaje de riesgo de ${validation.riskAssessment.puntaje}/100 (${validation.riskAssessment.etiqueta}). Factores: ${validation.riskAssessment.factores.join("; ")}.`;
    }
    return "El riesgo tributario se calcula evaluando el estado del RUC, validez del comprobante, requisitos formales y sustanciales. Inicia una validación para ver el análisis detallado.";
  }

  if (lower.includes("documento") || lower.includes("falta")) {
    if (validation?.aiRecommendation.documentosFaltantes.length) {
      return `Documentos que podrían faltar: ${validation.aiRecommendation.documentosFaltantes.join(", ")}. Estos documentos respaldan la operación ante una eventual fiscalización de SUNAT.`;
    }
    return "Los documentos de sustento más comunes son: orden de compra, guía de remisión, contrato, acta de conformidad y comprobante de pago. Dependen del tipo de operación.";
  }

  if (lower.includes("reduc") || lower.includes("bajar")) {
    return "Para reducir el riesgo: 1) Verifica que el RUC esté activo y habido, 2) Asegura sustento documental completo, 3) Confirma que la operación es real y vinculada a tu actividad, 4) Registra en el periodo correcto.";
  }

  return "Soy Fiscal Copilot AI. Puedo ayudarte con preguntas sobre crédito fiscal, requisitos de comprobantes, riesgo tributario y documentación de sustento. ¿Qué necesitas saber?";
}
