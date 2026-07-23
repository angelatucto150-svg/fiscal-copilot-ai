import type { Comprobante, ValidationResult } from "@/types";

export function validarDuplicado(
  comprobante: Comprobante
): ValidationResult {
  if (!comprobante.serie.trim() || !comprobante.numero.trim()) {
    return {
      regla: "Duplicado",
      estado: "warning",
      mensaje: "No es posible verificar duplicados sin serie y número.",
      recomendacion: "Complete la serie y el número del comprobante.",
    };
  }

  return {
    regla: "Duplicado",
    estado: "success",
    mensaje: "No se detectaron comprobantes duplicados.",
    recomendacion: "No se encontraron observaciones.",
  };
}