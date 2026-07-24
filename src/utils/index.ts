import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RiskLevel, RiskTrafficLight } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, moneda: string = "PEN"): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda,
  }).format(amount);
}

export function formatDate(date?: string): string {
  if (!date) return "-";

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getRiskLabel(puntaje: number): string {
  if (puntaje >= 80) return "Riesgo Bajo";
  if (puntaje >= 50) return "Revisar documentación";
  return "Alto Riesgo";
}

export function getRiskLevel(puntaje: number): RiskLevel {
  if (puntaje >= 80) return "bajo";
  if (puntaje >= 50) return "medio";
  return "alto";
}

export function getRiskTrafficLight(puntaje: number): RiskTrafficLight {
  if (puntaje >= 80) return "verde";
  if (puntaje >= 50) return "amarillo";
  return "rojo";
}

/** Recomendaciones locales por nivel de riesgo (sin llamar a la IA). */
export function getLocalRecommendationsByRisk(nivel: RiskLevel): {
  resumen: string;
  recomendaciones: string[];
} {
  if (nivel === "bajo") {
    return {
      resumen:
        "El comprobante presenta riesgo bajo. Puede proceder con el registro contable conservando el sustento digital.",
      recomendaciones: [
        "Registrar normalmente el comprobante.",
        "Conservar XML y CDR.",
      ],
    };
  }

  if (nivel === "medio") {
    return {
      resumen:
        "El comprobante presenta riesgo moderado. Revise el sustento antes de registrar el crédito fiscal.",
      recomendaciones: [
        "Revisar sustento de la operación.",
        "Verificar datos del proveedor.",
        "Confirmar requisitos para crédito fiscal.",
      ],
    };
  }

  return {
    resumen:
      "El comprobante presenta riesgo alto. No se recomienda registrar hasta resolver las observaciones.",
    recomendaciones: [
      "No registrar el comprobante.",
      "Revisar documentación.",
      "Validar nuevamente en SUNAT.",
      "Solicitar documentación adicional al proveedor.",
    ],
  };
}

/**
 * Usa recomendaciones existentes del análisis/IA.
 * Si faltan, aplica recomendaciones locales según el nivel de riesgo.
 */
export function resolveRecommendations(
  aiRecommendation:
    | {
        resumen?: string;
        recomendaciones?: string[];
        documentosFaltantes?: string[];
      }
    | null
    | undefined,
  nivel: RiskLevel
): {
  resumen: string;
  recomendaciones: string[];
  documentosFaltantes: string[];
} {
  const local = getLocalRecommendationsByRisk(nivel);
  const existing = (aiRecommendation?.recomendaciones ?? []).filter(
    (r) => typeof r === "string" && r.trim().length > 0
  );

  return {
    resumen:
      aiRecommendation?.resumen?.trim() || local.resumen,
    recomendaciones: existing.length > 0 ? existing : local.recomendaciones,
    documentosFaltantes: aiRecommendation?.documentosFaltantes ?? [],
  };
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    aprobado: "text-success bg-success/10 border-success/20",
    observado: "text-warning bg-warning/10 border-warning/20",
    rechazado: "text-danger bg-danger/10 border-danger/20",
    pendiente: "text-muted-foreground bg-muted border-border",
  };
  return colors[status] ?? colors.pendiente;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function validateRuc(ruc: string): boolean {
  if (!/^\d{11}$/.test(ruc)) return false;
  const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = ruc.split("").map(Number);
  const sum = factors.reduce((acc, factor, i) => acc + factor * digits[i], 0);
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? remainder : 11 - remainder;
  return checkDigit === digits[10];
}
