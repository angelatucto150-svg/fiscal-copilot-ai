/**
 * Servicio de explicación IA para resultados del motor de validación tributaria.
 * Usa Gemini cuando GEMINI_API_KEY está configurada; de lo contrario, respuesta mock.
 */
import { GoogleGenAI } from "@google/genai";
import type { ValidationSummary } from "@/types";

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const RIESGO_LABELS: Record<ValidationSummary["riesgo"], string> = {
  bajo: "Riesgo Bajo",
  medio: "Riesgo Moderado",
  alto: "Alto Riesgo",
};

export interface ExplicacionValidacion {
  explicacion: string;
}

export async function explicarValidacion(
  summary: ValidationSummary
): Promise<ExplicacionValidacion> {
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-flash-latest",
        contents: buildPrompt(summary),
      });

      const text = response.text?.trim();
      if (text) {
        return { explicacion: text };
      }
    } catch {
      // Fallback a explicación mock si Gemini no responde
    }
  }

  return { explicacion: buildMockExplicacion(summary) };
}

function buildPrompt(summary: ValidationSummary): string {
  const errores = summary.resultados.filter((r) => r.estado === "error");
  const advertencias = summary.resultados.filter((r) => r.estado === "warning");
  const correctas = summary.resultados.filter((r) => r.estado === "success");

  const erroresTexto =
    errores.length > 0
      ? errores
          .map(
            (r) =>
              `- ${r.regla}: ${r.mensaje} | Recomendación: ${r.recomendacion}`
          )
          .join("\n")
      : "Ninguno";

  const advertenciasTexto =
    advertencias.length > 0
      ? advertencias
          .map(
            (r) =>
              `- ${r.regla}: ${r.mensaje} | Recomendación: ${r.recomendacion}`
          )
          .join("\n")
      : "Ninguna";

  const correctasTexto =
    correctas.length > 0
      ? correctas.map((r) => `- ${r.regla}: ${r.mensaje}`).join("\n")
      : "Ninguna";

  return `
Eres un asistente tributario peruano especializado en crédito fiscal e IGV.
Redacta una explicación profesional dirigida a un contador peruano.
No reemplazas a SUNAT. Sí claro, formal y orientado a la acción.

RESULTADO DEL MOTOR DE VALIDACIÓN:
- Score: ${summary.score}/100
- Nivel de riesgo: ${RIESGO_LABELS[summary.riesgo]} (${summary.riesgo})

ERRORES ENCONTRADOS:
${erroresTexto}

ADVERTENCIAS:
${advertenciasTexto}

VALIDACIONES CORRECTAS:
${correctasTexto}

INSTRUCCIONES:
- Explica el nivel de riesgo y su significado para el registro contable.
- Detalla los errores encontrados y su impacto en el crédito fiscal.
- Integra las recomendaciones de forma coherente y accionable.
- Máximo 3 párrafos breves en español.
- No uses markdown, viñetas ni encabezados.
`.trim();
}

function buildMockExplicacion(summary: ValidationSummary): string {
  const errores = summary.resultados.filter((r) => r.estado === "error");
  const advertencias = summary.resultados.filter((r) => r.estado === "warning");
  const riesgoLabel = RIESGO_LABELS[summary.riesgo];

  let texto = `El comprobante obtuvo un score de ${summary.score}/100, clasificado como ${riesgoLabel}. `;

  if (summary.riesgo === "bajo") {
    texto +=
      "Desde el punto de vista del motor de reglas, los montos y validaciones revisadas no presentan observaciones críticas que impidan considerar el crédito fiscal, siempre que se cumplan los requisitos sustanciales y formales habituales.";
  } else if (summary.riesgo === "medio") {
    texto +=
      "Se detectaron aspectos que requieren revisión antes del registro contable. Se recomienda verificar la documentación de sustento y confirmar los montos con el proveedor antes de utilizar el crédito fiscal.";
  } else {
    texto +=
      "El análisis indica un riesgo elevado para el uso del crédito fiscal. Se sugiere no registrar el comprobante hasta resolver las observaciones detectadas y consultar con el área tributaria.";
  }

  if (errores.length > 0) {
    const detalleErrores = errores
      .map((r) => `${r.regla.replace(/^validar/, "")}: ${r.mensaje}`)
      .join("; ");
    texto += ` Errores detectados: ${detalleErrores}.`;
  }

  if (advertencias.length > 0) {
    const detalleAdvertencias = advertencias
      .map((r) => r.recomendacion)
      .join(" ");
    texto += ` Advertencias: ${detalleAdvertencias}.`;
  }

  const recomendaciones = summary.resultados
    .filter((r) => r.estado !== "success" && r.recomendacion)
    .map((r) => r.recomendacion);

  if (recomendaciones.length > 0) {
    texto += ` Recomendaciones principales: ${[...new Set(recomendaciones)].join(" ")}`;
  }

  return texto;
}
