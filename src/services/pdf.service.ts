import type { ValidationRecord } from "@/types";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  resolveRecommendations,
  getRiskLevel,
} from "@/utils";
import { COMPROBANTE_TIPOS } from "@/types";

/** jsPDF default font no soporta bien algunos caracteres; normaliza el texto. */
function safeText(value: unknown): string {
  if (value == null || value === "") return "-";
  return String(value)
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E\u00C0-\u024F\u1E00-\u1EFF]/g, "")
    .trim() || "-";
}

function semaforoLabel(semaforo: string | undefined): string {
  if (semaforo === "verde") return "Verde - RIESGO BAJO";
  if (semaforo === "amarillo") return "Amarillo - RIESGO MODERADO";
  if (semaforo === "rojo") return "Rojo - RIESGO ALTO";
  return "No disponible";
}

function sanitizeFilename(value: string): string {
  return value.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "reporte";
}

/**
 * Genera y descarga el reporte PDF de una validacion.
 * Solo se ejecuta en el cliente (boton de Resultado).
 */
export async function generateValidationPDF(
  validation: ValidationRecord
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("La generacion del PDF solo esta disponible en el navegador.");
  }

  const mod = await import("jspdf");
  // Compatibilidad ESM/CJS segun el bundler de Next.js
  const JsPDFCtor =
    (mod as { jsPDF?: new (...args: unknown[]) => InstanceType<typeof import("jspdf").jsPDF> })
      .jsPDF ??
    (mod as { default?: new (...args: unknown[]) => InstanceType<typeof import("jspdf").jsPDF> })
      .default;

  if (typeof JsPDFCtor !== "function") {
    throw new Error("No se pudo cargar la libreria jsPDF.");
  }

  const doc = new JsPDFCtor();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed = 12) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeTitle = (text: string) => {
    ensureSpace(14);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(safeText(text), margin, y);
    y += 8;
  };

  const writeLine = (text: string, fontSize = 10) => {
    ensureSpace(8);
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(safeText(text), maxWidth) as string[];
    lines.forEach((line) => {
      ensureSpace(7);
      doc.text(line, margin, y);
      y += 6;
    });
  };

  const risk = validation.riskAssessment;
  const nivel =
    risk?.nivel ??
    getRiskLevel(typeof risk?.puntaje === "number" ? risk.puntaje : 0);
  const recommendation = resolveRecommendations(
    validation.aiRecommendation,
    nivel
  );
  const automatic = validation.automaticValidation;
  const comprobante = validation.comprobante;

  // --- Encabezado ---
  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text("Fiscal Copilot AI", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Reporte de Validacion de Credito Fiscal", margin, y);
  y += 6;
  doc.text(`Fecha del reporte: ${safeText(formatDateTime(new Date().toISOString()))}`, margin, y);
  y += 12;

  // --- Datos del comprobante ---
  writeTitle("DATOS DEL COMPROBANTE");
  doc.setTextColor(0, 0, 0);

  const tipoLabel =
    COMPROBANTE_TIPOS[comprobante?.tipoComprobante] ??
    safeText(comprobante?.tipoComprobante);

  writeLine(`RUC Proveedor: ${safeText(comprobante?.rucProveedor)}`);
  writeLine(`Razon Social: ${safeText(comprobante?.razonSocial)}`);
  writeLine(`Tipo: ${safeText(tipoLabel)}`);
  writeLine(
    `Serie-Numero: ${safeText(comprobante?.serie)}-${safeText(comprobante?.numero)}`
  );
  writeLine(`Fecha de emision: ${safeText(formatDate(comprobante?.fecha))}`);
  writeLine(
    `Importe: ${safeText(
      formatCurrency(Number(comprobante?.importe ?? 0), comprobante?.moneda ?? "PEN")
    )}`
  );
  writeLine(
    `IGV: ${safeText(
      formatCurrency(Number(comprobante?.igv ?? 0), comprobante?.moneda ?? "PEN")
    )}`
  );
  y += 4;

  // --- Validaciones ---
  writeTitle("VALIDACIONES");
  doc.setTextColor(0, 0, 0);
  writeLine(`RUC Activo: ${automatic?.rucActivo ? "Si" : "No"}`);
  writeLine(`RUC Habido: ${automatic?.rucHabido ? "Si" : "No"}`);
  writeLine(`Comprobante Valido: ${automatic?.comprobanteValido ? "Si" : "No"}`);
  writeLine(
    `Emisor Electronico: ${automatic?.emisorElectronico ? "Si" : "No"}`
  );
  writeLine(
    `Coincidencia de Datos: ${automatic?.coincidenciaDatos ? "Si" : "No"}`
  );

  if (automatic?.observaciones?.length) {
    y += 2;
    writeLine("Observaciones:");
    automatic.observaciones.forEach((obs, i) => {
      writeLine(`${i + 1}. ${safeText(obs)}`);
    });
  }
  y += 4;

  // --- Riesgo ---
  writeTitle("INDICE DE RIESGO TRIBUTARIO");
  doc.setTextColor(0, 0, 0);
  writeLine(`Puntaje: ${safeText(risk?.puntaje ?? 0)}/100`);
  writeLine(`Nivel: ${safeText(risk?.etiqueta ?? nivel)}`);
  writeLine(`Semaforo: ${semaforoLabel(risk?.semaforo)}`);
  writeLine(`Estado: ${safeText((validation.status ?? "pendiente").toUpperCase())}`);

  if (risk?.factores?.length) {
    y += 2;
    writeLine("Factores de riesgo:");
    risk.factores.forEach((factor, i) => {
      writeLine(`${i + 1}. ${safeText(factor)}`);
    });
  }
  y += 4;

  // --- Recomendaciones ---
  writeTitle("RECOMENDACION DEL COPILOT");
  doc.setTextColor(0, 0, 0);
  writeLine(recommendation.resumen);
  y += 2;
  writeLine("Recomendaciones:");
  recommendation.recomendaciones.forEach((rec, i) => {
    writeLine(`${i + 1}. ${safeText(rec)}`);
  });

  if (recommendation.documentosFaltantes.length > 0) {
    y += 2;
    writeLine("Documentos faltantes:");
    recommendation.documentosFaltantes.forEach((docName, i) => {
      writeLine(`${i + 1}. ${safeText(docName)}`);
    });
  }
  y += 4;

  // --- Conclusiones ---
  writeTitle("CONCLUSIONES");
  doc.setTextColor(0, 0, 0);
  const conclusion =
    nivel === "bajo"
      ? "Conclusion: El comprobante presenta bajo riesgo. Puede proceder con el registro contable, conservando el sustento documental."
      : nivel === "medio"
        ? "Conclusion: Riesgo moderado. Se recomienda revisar observaciones y sustento antes de registrar el credito fiscal."
        : "Conclusion: Alto riesgo. No se recomienda registrar el comprobante hasta resolver las observaciones y validar nuevamente.";
  writeLine(conclusion);
  y += 8;

  // --- Pie ---
  ensureSpace(16);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generado: ${safeText(formatDateTime(new Date().toISOString()))}`,
    margin,
    y
  );
  doc.text(
    "Este reporte no reemplaza la consulta oficial ante SUNAT.",
    margin,
    y + 5
  );

  const filename = `validacion-${sanitizeFilename(
    String(comprobante?.serie ?? "S")
  )}-${sanitizeFilename(String(comprobante?.numero ?? "0"))}.pdf`;

  doc.save(filename);
}
