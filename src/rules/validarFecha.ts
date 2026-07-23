import type { Comprobante, ValidationResult } from "@/types";

export function validarFecha(
  comprobante: Comprobante
): ValidationResult {
  const fecha = new Date(comprobante.fecha);
  const hoy = new Date();

  if (isNaN(fecha.getTime())) {
    return {
      regla: "Fecha",
      estado: "error",
      mensaje: "La fecha del comprobante no es válida.",
      recomendacion: "Verifique la fecha ingresada.",
    };
  }

  if (fecha > hoy) {
    return {
      regla: "Fecha",
      estado: "error",
      mensaje: "La fecha del comprobante no puede ser futura.",
      recomendacion: "Revise la fecha de emisión del comprobante.",
    };
  }

  return {
    regla: "Fecha",
    estado: "success",
    mensaje: "La fecha del comprobante es válida.",
    recomendacion: "No se encontraron observaciones.",
  };
}