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
  MOCK_VALIDATIONS,
  MOCK_DASHBOARD_STATS,
  MOCK_REPORT_DATA,
} from "./mock-data";
import {
  calculateRiskScore,
  generateAIRecommendation,
  determineValidationStatus,
  evaluateFormalRequirements,
} from "./risk.service";
import type { AutomaticValidation, FormalRequirement, SubstantialRequirement } from "@/types";

function getLocalValidations(): ValidationRecord[] {
  if (typeof window === "undefined") return MOCK_VALIDATIONS;
  const stored = localStorage.getItem(STORAGE_KEYS.validations);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return MOCK_VALIDATIONS;
    }
  }
  localStorage.setItem(STORAGE_KEYS.validations, JSON.stringify(MOCK_VALIDATIONS));
  return MOCK_VALIDATIONS;
}

function saveLocalValidations(validations: ValidationRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.validations, JSON.stringify(validations));
}

export async function getValidations(userId?: string): Promise<ValidationRecord[]> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseClient();

    if (supabase) {
      let query = supabase
        .from("validaciones")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data) {
        return data.map((v: any) => ({
          id: v.id,
          userId: v.user_id,
          comprobante: v.comprobante,
          automaticValidation: v.automatic_validation,
          formalRequirements: v.formal_requirements,
          substantialRequirements: v.substantial_requirements,
          riskAssessment: v.risk_assessment,
          aiRecommendation: v.ai_recommendation,
          status: v.status,
          createdAt: v.created_at,
          updatedAt: v.updated_at,
        }));
      }
    }
  }

  return getLocalValidations();
}

export async function getValidationById(id: string): Promise<ValidationRecord | null> {
  const validations = await getValidations();
  return validations.find((v) => v.id === id) ?? null;
}

export async function saveValidation(
  data: {
    comprobante: Comprobante;
    automaticValidation: AutomaticValidation;
    formalRequirements: FormalRequirement[];
    substantialRequirements: SubstantialRequirement[];
  },
  userId: string = "user-demo-001"
): Promise<ValidationRecord> {
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
      const { data, error } = await supabase
        .from("validaciones")
        .insert({
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

  const validations = getLocalValidations();
  validations.unshift(record);
  saveLocalValidations(validations);

  return record;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const validations = await getValidations();
  if (validations.length === 0) return MOCK_DASHBOARD_STATS;

  const avgRisk =
    validations.reduce((sum, v) => sum + v.riskAssessment.puntaje, 0) / validations.length;

  return {
    totalValidaciones: validations.length,
    riesgoPromedio: Math.round(avgRisk),
    validacionesMes: validations.filter((v) => {
      const date = new Date(v.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
    observacionesPendientes: validations.filter((v) => v.status === "observado").length,
  };
}

export async function getReportData(): Promise<ReportData> {
  const validations = await getValidations();
  if (validations.length < 3) return MOCK_REPORT_DATA;

  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const now = new Date();

  const validacionesPorMes = months.slice(0, 6).map((mes, i) => {
    const monthIndex = (now.getMonth() - 5 + i + 12) % 12;
    const count = validations.filter((v) => new Date(v.createdAt).getMonth() === monthIndex).length;
    return { mes, cantidad: count || Math.floor(Math.random() * 5) + 1 };
  });

  const errorMap = new Map<string, number>();
  validations.forEach((v) => {
    v.automaticValidation.observaciones.forEach((obs) => {
      errorMap.set(obs, (errorMap.get(obs) ?? 0) + 1);
    });
  });

  const erroresFrecuentes = Array.from(errorMap.entries())
    .map(([error, cantidad]) => ({ error, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const providerMap = new Map<string, { razonSocial: string; cantidad: number }>();
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

  return {
    validacionesPorMes,
    erroresFrecuentes: erroresFrecuentes.length ? erroresFrecuentes : MOCK_REPORT_DATA.erroresFrecuentes,
    proveedoresObservados: proveedoresObservados.length ? proveedoresObservados : MOCK_REPORT_DATA.proveedoresObservados,
    riesgoPromedioPorMes: MOCK_REPORT_DATA.riesgoPromedioPorMes,
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
export function ejecutarMotorValidacionTributaria(comprobante: Comprobante): ValidationSummary {
  const resultados = REGLAS_TRIBUTARIAS.map((regla) => regla(comprobante));
  const score = calcularScoreMotor(resultados);
  const riesgo = getRiskLevel(score);

  return { riesgo, score, resultados };
}
