/**
 * Validación y formateo de payloads para la API oficial SUNAT.
 */
import type { SunatValidarRequest } from "@/types/sunat";

export interface SunatValidationError {
  field: string;
  message: string;
}

const COD_COMP_VALIDOS = new Set([
  "01",
  "03",
  "04",
  "07",
  "08",
  "R1",
  "R7",
  "12",
  "14",
]);

/** Convierte fecha ISO (yyyy-mm-dd) o Date a formato SUNAT dd/mm/yyyy */
export function formatearFechaSunat(fecha: string): string {
  const trimmed = fecha.trim();

  // Ya en formato dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // ISO yyyy-mm-dd (con o sin tiempo)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d}/${m}/${y}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const d = String(parsed.getUTCDate()).padStart(2, "0");
    const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const y = parsed.getUTCFullYear();
    return `${d}/${m}/${y}`;
  }

  throw new Error(`Fecha inválida para SUNAT: ${fecha}`);
}

/** Monto con 2 decimales como string (n(8,2)) */
export function formatearMontoSunat(monto: number | string): string {
  const value = typeof monto === "string" ? Number(monto) : monto;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Monto inválido para SUNAT");
  }
  return value.toFixed(2);
}

/** Número de comprobante sin ceros a la izquierda innecesarios */
export function formatearNumeroComprobante(numero: string | number): string {
  const raw = String(numero).trim();
  if (!/^\d{1,8}$/.test(raw)) {
    throw new Error("El número de comprobante debe tener entre 1 y 8 dígitos");
  }
  // SUNAT acepta el correlativo; se envía sin padding forzado
  return String(Number(raw));
}

export function validarPayloadSunat(
  payload: Partial<SunatValidarRequest>
): SunatValidationError[] {
  const errors: SunatValidationError[] = [];

  if (!payload.numRuc || !/^\d{11}$/.test(payload.numRuc)) {
    errors.push({ field: "numRuc", message: "RUC emisor debe tener 11 dígitos" });
  }

  if (!payload.codComp || !COD_COMP_VALIDOS.has(payload.codComp)) {
    errors.push({
      field: "codComp",
      message: "Código de comprobante no válido",
    });
  }

  if (!payload.numeroSerie || payload.numeroSerie.length < 1 || payload.numeroSerie.length > 4) {
    errors.push({
      field: "numeroSerie",
      message: "Serie debe tener entre 1 y 4 caracteres",
    });
  }

  if (!payload.numero) {
    errors.push({ field: "numero", message: "Número de comprobante es obligatorio" });
  } else if (!/^\d{1,8}$/.test(String(payload.numero))) {
    errors.push({
      field: "numero",
      message: "Número debe tener entre 1 y 8 dígitos",
    });
  }

  if (!payload.fechaEmision) {
    errors.push({ field: "fechaEmision", message: "Fecha de emisión es obligatoria" });
  } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(payload.fechaEmision)) {
    errors.push({
      field: "fechaEmision",
      message: "Fecha debe estar en formato dd/mm/yyyy",
    });
  }

  if (payload.monto === undefined || payload.monto === "") {
    errors.push({
      field: "monto",
      message: "Monto es obligatorio para comprobantes electrónicos",
    });
  } else if (!/^\d+(\.\d{1,2})?$/.test(payload.monto)) {
    errors.push({ field: "monto", message: "Monto inválido (use formato 0.00)" });
  }

  return errors;
}

/**
 * Construye el payload oficial a partir de datos de dominio de la app.
 */
export function buildSunatPayload(input: {
  rucProveedor: string;
  tipoComprobante: string;
  serie: string;
  numero: string;
  fecha: string;
  importe: number;
}): SunatValidarRequest {
  return {
    numRuc: input.rucProveedor.trim(),
    codComp: input.tipoComprobante.trim(),
    numeroSerie: input.serie.trim().toUpperCase(),
    numero: formatearNumeroComprobante(input.numero),
    fechaEmision: formatearFechaSunat(input.fecha),
    monto: formatearMontoSunat(input.importe),
  };
}
