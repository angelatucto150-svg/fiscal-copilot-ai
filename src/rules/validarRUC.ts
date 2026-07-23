import type { Comprobante, ValidationResult } from "@/types";

export function validarRUC(comprobante: Comprobante): ValidationResult {
  const ruc = comprobante.rucProveedor?.trim() ?? "";

  if (!ruc) {
    return {
      regla: "RUC",
      estado: "error",
      mensaje: "No se encontró el RUC del proveedor.",
      recomendacion: "Ingrese el RUC del proveedor.",
    };
  }

  if (!/^\d{11}$/.test(ruc)) {
    return {
      regla: "RUC",
      estado: "error",
      mensaje: "El RUC debe tener exactamente 11 dígitos.",
      recomendacion: "Verifique el RUC antes de registrar el comprobante.",
    };
  }

  return {
    regla: "RUC",
    estado: "success",
    mensaje: "El RUC tiene un formato válido.",
    recomendacion: "No se encontraron observaciones.",
  };
}