import type { ValidationRecord } from "@/types";
import { formatCurrency, formatDate, formatDateTime } from "@/utils";
import { COMPROBANTE_TIPOS } from "@/types";

export async function generateValidationPDF(validation: ValidationRecord): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF();
  const margin = 20;
  let y = margin;

  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text("Fiscal Copilot AI", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Reporte de Validación de Crédito Fiscal", margin, y);
  y += 15;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("DATOS DEL COMPROBANTE", margin, y);
  y += 8;

  doc.setFontSize(10);
  const comprobanteLines = [
    `RUC Proveedor: ${validation.comprobante.rucProveedor}`,
    `Razón Social: ${validation.comprobante.razonSocial}`,
    `Tipo: ${COMPROBANTE_TIPOS[validation.comprobante.tipoComprobante]}`,
    `Serie-Número: ${validation.comprobante.serie}-${validation.comprobante.numero}`,
    `Fecha: ${formatDate(validation.comprobante.fecha)}`,
    `Importe: ${formatCurrency(validation.comprobante.importe, validation.comprobante.moneda)}`,
    `IGV: ${formatCurrency(validation.comprobante.igv, validation.comprobante.moneda)}`,
  ];

  comprobanteLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 6;
  });

  y += 8;
  doc.setFontSize(12);
  doc.text("ÍNDICE DE RIESGO TRIBUTARIO", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(`Puntaje: ${validation.riskAssessment.puntaje}/100`, margin, y);
  y += 6;
  doc.text(`Nivel: ${validation.riskAssessment.etiqueta}`, margin, y);
  y += 6;
  doc.text(`Estado: ${validation.status.toUpperCase()}`, margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.text("RECOMENDACIÓN DEL COPILOT", margin, y);
  y += 8;

  doc.setFontSize(10);
  const resumenLines = doc.splitTextToSize(validation.aiRecommendation.resumen, 170);
  resumenLines.forEach((line: string) => {
    doc.text(line, margin, y);
    y += 6;
  });

  y += 5;
  validation.aiRecommendation.recomendaciones.forEach((rec, i) => {
    doc.text(`${i + 1}. ${rec}`, margin, y);
    y += 6;
  });

  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generado: ${formatDateTime(new Date().toISOString())}`, margin, y);
  doc.text("Este reporte no reemplaza la consulta oficial ante SUNAT.", margin, y + 5);

  doc.save(`validacion-${validation.comprobante.serie}-${validation.comprobante.numero}.pdf`);
}
