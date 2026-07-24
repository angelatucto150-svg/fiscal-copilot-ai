import type {
  ValidationRecord,
  Comprobante,
  DashboardStats,
  ReportData,
  ValidationResult,
  ValidationSummary,
} from "@/types";
import { generateId, getRiskLevel } from "@/utils";
import { validarIGV } from "@/rules/validarIGV";
import { validarFecha } from "@/rules/validarFecha";
import { validarRUC } from "@/rules/validarRUC";
import { validarComprobante } from "@/rules/validarComprobante";
import { validarDuplicado } from "@/rules/validarDuplicado";
import { STORAGE_KEYS } from "@/lib/constants";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  calculateRiskScore,
  generateAIRecommendation,
  determineValidationStatus,
  evaluateFormalRequirements,
} from "./risk.service";
import type {
  AutomaticValidation,
  FormalRequirement,
  SubstantialRequirement,
} from "@/types";

const EMPTY_DASHBOARD_STATS: DashboardStats = {
  totalValidaciones: 0,
  riesgoPromedio: 0,
  validacionesMes: 0,
  observacionesPendientes: 0,
};

function emptyReportData(): ReportData {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"];
  return {
    validacionesPorMes: months.map((mes) => ({ mes, cantidad: 0 })),
    erroresFrecuentes: [],
    proveedoresObservados: [],
    riesgoPromedioPorMes: months.map((mes) => ({ mes, promedio: 0 })),
  };
}

function localStorageKey(userId: string): string {
  return `${STORAGE_KEYS.validations}:${userId}`;
}

function mapRow(v: Record<string, unknown>): ValidationRecord {
  return {
    id: String(v.id),
    userId: String(v.user_id ?? v.userId ?? ""),
    comprobante: v.comprobante as ValidationRecord["comprobante"],
    automaticValidation: (v.automatic_validation ??
      v.automaticValidation) as ValidationRecord["automaticValidation"],
    formalRequirements: (v.formal_requirements ??
      v.formalRequirements) as ValidationRecord["formalRequirements"],
    substantialRequirements: (v.substantial_requirements ??
      v.substantialRequirements) as ValidationRecord["substantialRequirements"],
    riskAssessment: (v.risk_assessment ??
      v.riskAssessment) as ValidationRecord["riskAssessment"],
    aiRecommendation: (v.ai_recommendation ??
      v.aiRecommendation) as ValidationRecord["aiRecommendation"],
    status: v.status as ValidationRecord["status"],
    createdAt: String(v.created_at ?? v.createdAt ?? ""),
    updatedAt: String(v.updated_at ?? v.updatedAt ?? ""),
  };
}

/** Historial local aislado por usuario. Usuario nuevo = arreglo vacío (sin mocks). */
function getLocalValidations(userId: string): ValidationRecord[] {
  if (typeof window === "undefined" || !userId) return [];

  const key = localStorageKey(userId);
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (v: ValidationRecord) => !v.userId || v.userId === userId
      );
    } catch {
      return [];
    }
  }

  // Primera vez: historial vacío (no sembrar datos de demo)
  localStorage.setItem(key, JSON.stringify([]));
  return [];
}

function saveLocalValidations(
  userId: string,
  validations: ValidationRecord[]
): void {
  if (typeof window === "undefined" || !userId) return;
  localStorage.setItem(localStorageKey(userId), JSON.stringify(validations));
}

/**
 * Consulta validaciones del usuario autenticado.
 * Sin userId no se devuelven datos (aislamiento estricto).
 */
export async function getValidations(userId?: string): Promise<ValidationRecord[]> {
  if (!userId) return [];

  if (isSupabaseConfigured) {
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase
        .from("validaciones")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        return data.map((v: Record<string, unknown>) => mapRow(v));
      }
    }
  }

  return getLocalValidations(userId);
}

export async function getValidationById(
  id: string,
  userId?: string
): Promise<ValidationRecord | null> {
  if (!id) return null;

  if (isSupabaseConfigured) {
    const supabase = getSupabaseClient();

    if (supabase) {
      let query = supabase.from("validaciones").select("*").eq("id", id);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error(error);
        return null;
      }

      if (data) {
        return mapRow(data as Record<string, unknown>);
      }
    }
  }

  if (!userId) return null;

  const validations = getLocalValidations(userId);
  return validations.find((v) => v.id === id) ?? null;
}

export async function saveValidation(
  data: {
    comprobante: Comprobante;
    automaticValidation: AutomaticValidation;
    formalRequirements: FormalRequirement[];
    substantialRequirements: SubstantialRequirement[];
  },
  userId: string
): Promise<ValidationRecord> {
  if (!userId) {
    throw new Error("No se puede guardar la validación sin usuario autenticado.");
  }

  const riskAssessment = calculateRiskScore(
    data.automaticValidation,
    data.formalRequirements,
    data.substantialRequirements
  );
  const aiRecommendation = generateAIRecommendation(
    riskAssessment,
    data.automaticValidation,
    data.substantialRequirements
  );

  const record: ValidationRecord = {
    id: generateId(),
    userId,
    comprobante: data.comprobante,
    automaticValidation: data.automaticValidation,
    formalRequirements: data.formalRequirements,
    substantialRequirements: data.substantialRequirements,
    riskAssessment,
    aiRecommendation,
    status: determineValidationStatus(riskAssessment),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const supabase = getSupabaseClient();

    if (supabase) {
      const { error } = await supabase.from("validaciones").insert({
        id: record.id,
        user_id: record.userId,
        comprobante: record.comprobante,
        automatic_validation: record.automaticValidation,
        formal_requirements: record.formalRequirements,
        substantial_requirements: record.substantialRequirements,
        risk_assessment: record.riskAssessment,
        ai_recommendation: record.aiRecommendation,
        status: record.status,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      });

      if (error) {
        console.error("INSERT ERROR:", error);
      }
    }
  }

  const validations = getLocalValidations(userId);
  validations.unshift(record);
  saveLocalValidations(userId, validations);

  return record;
}

export async function getDashboardStats(
  userId?: string
): Promise<DashboardStats> {
  if (!userId) return EMPTY_DASHBOARD_STATS;

  const validations = await getValidations(userId);
  if (validations.length === 0) return EMPTY_DASHBOARD_STATS;

  const avgRisk =
    validations.reduce((sum, v) => sum + (v.riskAssessment?.puntaje ?? 0), 0) /
    validations.length;

  return {
    totalValidaciones: validations.length,
    riesgoPromedio: Math.round(avgRisk),
    validacionesMes: validations.filter((v) => {
      const date = new Date(v.createdAt);
      const now = new Date();
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length,
    observacionesPendientes: validations.filter((v) => v.status === "observado")
      .length,
  };
}

export async function getReportData(userId?: string): Promise<ReportData> {
  if (!userId) return emptyReportData();

  const validations = await getValidations(userId);
  if (validations.length === 0) return emptyReportData();

  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const now = new Date();

  const validacionesPorMes = months.slice(0, 6).map((mes, i) => {
    const monthIndex = (now.getMonth() - 5 + i + 12) % 12;
    const count = validations.filter(
      (v) => new Date(v.createdAt).getMonth() === monthIndex
    ).length;
    return { mes: months[monthIndex] ?? mes, cantidad: count };
  });

  const errorMap = new Map<string, number>();
  validations.forEach((v) => {
    v.automaticValidation?.observaciones?.forEach((obs) => {
      errorMap.set(obs, (errorMap.get(obs) ?? 0) + 1);
    });
  });

  const erroresFrecuentes = Array.from(errorMap.entries())
    .map(([error, cantidad]) => ({ error, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const providerMap = new Map<
    string,
    { razonSocial: string; cantidad: number }
  >();
  validations
    .filter((v) => v.status !== "aprobado")
    .forEach((v) => {
      const key = v.comprobante.rucProveedor;
      const existing = providerMap.get(key);
      providerMap.set(key, {
        razonSocial: v.comprobante.razonSocial,
        cantidad: (existing?.cantidad ?? 0) + 1,
      });
    });

  const proveedoresObservados = Array.from(providerMap.entries())
    .map(([ruc, data]) => ({ ruc, ...data }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const riesgoPromedioPorMes = validacionesPorMes.map(({ mes, cantidad }) => {
    const monthIndex = months.indexOf(mes);
    const monthValidations = validations.filter(
      (v) => new Date(v.createdAt).getMonth() === monthIndex
    );
    const promedio =
      monthValidations.length === 0
        ? 0
        : Math.round(
            monthValidations.reduce(
              (sum, v) => sum + (v.riskAssessment?.puntaje ?? 0),
              0
            ) / monthValidations.length
          );
    return { mes, promedio: cantidad > 0 ? promedio : 0 };
  });

  return {
    validacionesPorMes,
    erroresFrecuentes,
    proveedoresObservados,
    riesgoPromedioPorMes,
  };
}

export { evaluateFormalRequirements };

// ─── Motor de Validación Tributaria ───────────────────────────────────────────

type ReglaTributaria = (comprobante: Comprobante) => ValidationResult;

const REGLAS_TRIBUTARIAS: ReglaTributaria[] = [
  validarIGV,
  validarFecha,
  validarRUC,
  validarComprobante,
  validarDuplicado,
];

function calcularScoreMotor(resultados: ValidationResult[]): number {
  let score = 100;

  for (const resultado of resultados) {
    if (resultado.estado === "error") score -= 25;
    else if (resultado.estado === "warning") score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/** Orquestador del motor de reglas tributarias. Ejecuta todas las reglas y devuelve el resumen. */
export function ejecutarMotorValidacionTributaria(
  comprobante: Comprobante
): ValidationSummary {
  const resultados = REGLAS_TRIBUTARIAS.map((regla) => regla(comprobante));
  const score = calcularScoreMotor(resultados);
  const riesgo = getRiskLevel(score);

  return { riesgo, score, resultados };
}
