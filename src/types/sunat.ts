/**
 * Tipos y catálogos oficiales SUNAT — Consulta Integrada CPE.
 * El frontend nunca debe consumir códigos crudos (estadoCp, etc.).
 */

/** Request oficial hacia SUNAT validarcomprobante */
export interface SunatValidarRequest {
  numRuc: string;
  codComp: string;
  numeroSerie: string;
  numero: string;
  fechaEmision: string;
  monto: string;
}

/** Response cruda de SUNAT */
export interface SunatValidarResponse {
  success: boolean;
  message: string;
  errorCode?: string;
  data?: {
    estadoCp: string;
    estadoRuc: string;
    condDomiRuc: string;
    observaciones?: string[];
  };
}

export interface SunatTokenResponse {
  access_token: string;
  token_type: "Bearer" | string;
  expires_in: number;
}

/** Estados de comprobante legibles */
export type SunatEstadoComprobante =
  | "NO EXISTE"
  | "ACEPTADO"
  | "ANULADO"
  | "AUTORIZADO"
  | "NO AUTORIZADO"
  | "DESCONOCIDO";

export type SunatEstadoRuc =
  | "ACTIVO"
  | "BAJA PROVISIONAL"
  | "BAJA PROV. POR OFICIO"
  | "SUSPENSION TEMPORAL"
  | "BAJA DEFINITIVA"
  | "BAJA DE OFICIO"
  | "INHABILITADO-VENT.UNICA"
  | "DESCONOCIDO";

export type SunatCondicionDomicilio =
  | "HABIDO"
  | "PENDIENTE"
  | "POR VERIFICAR"
  | "NO HABIDO"
  | "NO HALLADO"
  | "DESCONOCIDO";

export type SunatRiesgoNivel = "BAJO" | "MEDIO" | "ALTO";

/**
 * Contrato hacia el frontend.
 * Sin códigos SUNAT: solo etiquetas y flags de negocio.
 */
export interface SunatValidacionResultado {
  valido: boolean;
  estado: SunatEstadoComprobante;
  riesgo: SunatRiesgoNivel;
  observaciones: string[];
  /** Etiquetas auxiliares para mapear a AutomaticValidation */
  estadoRuc: SunatEstadoRuc;
  condicionDomicilio: SunatCondicionDomicilio;
  message: string;
}

export const ESTADO_CP_MAP: Record<string, SunatEstadoComprobante> = {
  "0": "NO EXISTE",
  "1": "ACEPTADO",
  "2": "ANULADO",
  "3": "AUTORIZADO",
  "4": "NO AUTORIZADO",
};

export const ESTADO_RUC_MAP: Record<string, SunatEstadoRuc> = {
  "00": "ACTIVO",
  "01": "BAJA PROVISIONAL",
  "02": "BAJA PROV. POR OFICIO",
  "03": "SUSPENSION TEMPORAL",
  "10": "BAJA DEFINITIVA",
  "11": "BAJA DE OFICIO",
  "22": "INHABILITADO-VENT.UNICA",
};

export const COND_DOMI_RUC_MAP: Record<string, SunatCondicionDomicilio> = {
  "00": "HABIDO",
  "09": "PENDIENTE",
  "11": "POR VERIFICAR",
  "12": "NO HABIDO",
  "20": "NO HALLADO",
};

export function normalizarEstadoCp(codigo: string | undefined): SunatEstadoComprobante {
  if (!codigo) return "DESCONOCIDO";
  return ESTADO_CP_MAP[codigo] ?? "DESCONOCIDO";
}

export function normalizarEstadoRuc(codigo: string | undefined): SunatEstadoRuc {
  if (!codigo) return "DESCONOCIDO";
  return ESTADO_RUC_MAP[codigo] ?? "DESCONOCIDO";
}

export function normalizarCondDomiRuc(
  codigo: string | undefined
): SunatCondicionDomicilio {
  if (!codigo) return "DESCONOCIDO";
  return COND_DOMI_RUC_MAP[codigo] ?? "DESCONOCIDO";
}

/** Deriva validez y riesgo comercial a partir de la respuesta SUNAT */
export function construirResultadoValidacion(
  raw: SunatValidarResponse
): SunatValidacionResultado {
  const estado = normalizarEstadoCp(raw.data?.estadoCp);
  const estadoRuc = normalizarEstadoRuc(raw.data?.estadoRuc);
  const condicionDomicilio = normalizarCondDomiRuc(raw.data?.condDomiRuc);

  const observaciones: string[] = [
    ...(raw.data?.observaciones ?? []),
  ];

  if (!raw.success && raw.message) {
    observaciones.push(raw.message);
  }

  if (estado === "NO EXISTE") {
    observaciones.push("El comprobante no figura en los registros de SUNAT");
  }
  if (estado === "ANULADO") {
    observaciones.push("El comprobante fue anulado (baja) ante SUNAT");
  }
  if (estado === "NO AUTORIZADO") {
    observaciones.push("El comprobante no está autorizado por imprenta/SUNAT");
  }
  if (estadoRuc !== "ACTIVO" && estadoRuc !== "DESCONOCIDO") {
    observaciones.push(`El RUC del emisor se encuentra en estado: ${estadoRuc}`);
  }
  if (
    condicionDomicilio !== "HABIDO" &&
    condicionDomicilio !== "DESCONOCIDO"
  ) {
    observaciones.push(
      `Condición domiciliaria del emisor: ${condicionDomicilio}`
    );
  }

  const valido = estado === "ACEPTADO" || estado === "AUTORIZADO";

  let riesgo: SunatRiesgoNivel = "BAJO";

  if (!valido) {
    riesgo = "ALTO";
  } else if (
    estadoRuc !== "ACTIVO" ||
    condicionDomicilio !== "HABIDO" ||
    estado === "AUTORIZADO"
  ) {
    riesgo = "MEDIO";
  }

  return {
    valido,
    estado,
    riesgo,
    observaciones: [...new Set(observaciones)],
    estadoRuc,
    condicionDomicilio,
    message: raw.message || "Consulta SUNAT completada",
  };
}

/** Códigos de error controlados hacia la capa API / cliente */
export type SunatErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMIT"
  | "UNAVAILABLE"
  | "CONFIG"
  | "UNKNOWN";

/**
 * Error tipado de la integración SUNAT.
 * allowFallback=true → el cliente puede usar validación local.
 * allowFallback=false → se propaga el error al usuario.
 */
export class SunatApiError extends Error {
  readonly status: number;
  readonly code: SunatErrorCode;
  readonly allowFallback: boolean;

  constructor(
    message: string,
    status: number,
    code: SunatErrorCode,
    allowFallback: boolean
  ) {
    super(message);
    this.name = "SunatApiError";
    this.status = status;
    this.code = code;
    this.allowFallback = allowFallback;
  }
}

/** Respuesta de error del endpoint /api/sunat/validar */
export interface SunatApiErrorBody {
  success: false;
  allowFallback: boolean;
  code: SunatErrorCode;
  message: string;
  valido: false;
  estado: "DESCONOCIDO";
  riesgo: "ALTO";
  observaciones: string[];
  errors?: { field: string; message: string }[];
}
