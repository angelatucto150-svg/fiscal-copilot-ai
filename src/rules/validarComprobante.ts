import type { Comprobante, ValidationResult } from "@/types";

export function validarComprobante(
  comprobante: Comprobante
): ValidationResult {
  if (
    !comprobante.tipoComprobante ||
    !comprobante.serie.trim() ||
    !comprobante.numero.trim() ||
    !comprobante.razonSocial.trim()
  ) {
    return {
      regla: "Comprobante",
      estado: "error",
      mensaje: "El comprobante tiene datos obligatorios incompletos.",
      recomendacion: "Complete el tipo, serie, número y razón social.",
    };
  }

  return {
    regla: "Comprobante",
    estado: "success",
    mensaje: "El comprobante contiene los datos obligatorios.",
    recomendacion: "No se encontraron observaciones.",
  };
}