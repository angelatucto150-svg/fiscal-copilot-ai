import type { Comprobante, ValidationResult } from "@/types";

const TASAS_IGV = [0.18, 0.105];
const TOLERANCIA = 0.1;

export function validarIGV(comprobante: Comprobante): ValidationResult {
  const { importe, igv } = comprobante;

  if (importe <= 0) {
    return {
      regla: "IGV",
      estado: "error",
      mensaje: "El importe total del comprobante debe ser mayor a cero.",
      recomendacion:
        "Verifique el importe total registrado. Un comprobante sin monto válido no puede generar crédito fiscal.",
    };
  }

  if (igv < 0) {
    return {
      regla: "IGV",
      estado: "error",
      mensaje: "El IGV no puede ser un valor negativo.",
      recomendacion:
        "Revise los montos del comprobante antes de registrar el crédito fiscal.",
    };
  }

  const baseImponible = importe - igv;

  if (baseImponible <= 0) {
    return {
      regla: "IGV",
      estado: "error",
      mensaje: `La base imponible calculada (S/ ${baseImponible.toFixed(
        2
      )}) no es válida.`,
      recomendacion:
        "El IGV no puede ser igual o mayor al importe total. Verifique los montos del comprobante.",
    };
  }

  let tasaDetectada: number | null = null;

  for (const tasa of TASAS_IGV) {
    const esperado = Math.round(baseImponible * tasa * 100) / 100;

    if (Math.abs(igv - esperado) <= TOLERANCIA) {
      tasaDetectada = tasa;
      break;
    }
  }

  if (tasaDetectada !== null) {
    return {
      regla: "IGV",
      estado: "success",
      mensaje: `IGV correcto. Se detectó una tasa de ${(tasaDetectada * 100).toFixed(1)}%.`,
      recomendacion:
        "El cálculo del IGV es consistente con la tasa aplicada en el comprobante.",
    };
  }

  const esperado18 = Math.round(baseImponible * 0.18 * 100) / 100;
  const esperado105 = Math.round(baseImponible * 0.105 * 100) / 100;

  return {
    regla: "IGV",
    estado: "error",
    mensaje: `El IGV declarado (S/ ${igv.toFixed(
      2
    )}) no coincide con las tasas válidas del 18% ni del 10.5%.`,
    recomendacion: `IGV esperado: S/ ${esperado18.toFixed(
      2
    )} (18%) o S/ ${esperado105.toFixed(
      2
    )} (10.5%). Revise el comprobante antes de registrarlo.`,
  };
}