/**
 * Servicio de consultas SUNAT (capa de aplicación / cliente).
 * - RUC: proxy /api/sunat/ruc (APIsPeru u otro proveedor)
 * - Validez CPE: proxy /api/sunat/validar (API oficial SUNAT)
 * El token OAuth nunca se expone al cliente.
 */
import type { AutomaticValidation, Comprobante } from "@/types";
import type {
  SunatApiErrorBody,
  SunatValidacionResultado,
} from "@/types/sunat";
import { validateRuc } from "@/utils";
import { sunatLog } from "@/lib/sunat-logger";
import { getMockSunatRucResponse } from "./mock-data";
import type { Moneda } from "@/types";

export interface SunatRucResponse {
  ruc: string;
  razonSocial: string;
  estado: "ACTIVO" | "INACTIVO";
  condicion: "HABIDO" | "NO HABIDO";
  emisorElectronico: boolean;
}

function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function getInternalRucApiUrl(ruc: string): string {
  if (typeof window === "undefined") {
    return `${getAppBaseUrl()}/api/sunat/ruc?ruc=${ruc}`;
  }
  return `/api/sunat/ruc?ruc=${ruc}`;
}

function getInternalValidarApiUrl(): string {
  if (typeof window === "undefined") {
    return `${getAppBaseUrl()}/api/sunat/validar`;
  }
  return `/api/sunat/validar`;
}

export async function consultarRuc(ruc: string): Promise<SunatRucResponse> {
  const rucValido = validateRuc(ruc);

  if (!rucValido) {
    throw new Error("RUC inválido");
  }

  const useRealApi = process.env.USE_REAL_API === "true";

  try {
    const response = await fetch(getInternalRucApiUrl(ruc), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (response.ok) {
      return (await response.json()) as SunatRucResponse;
    }

    // USE_REAL_API=false → mock ante 401 / 429 / 500 (comportamiento histórico)
    if (
      !useRealApi &&
      (response.status === 401 ||
        response.status === 429 ||
        response.status === 500)
    ) {
      return getMockSunatRucResponse(ruc);
    }

    // USE_REAL_API=true → propagar el error real (nunca mock)
    let detail = "No se pudo consultar el RUC";
    try {
      const body = await response.json();
      if (body?.error) detail = String(body.error);
      else if (body?.message) detail = String(body.message);
    } catch {
      /* body no JSON */
    }

    throw new Error(`${detail} (${response.status})`);
  } catch (error) {
    if (error instanceof Error && error.message === "RUC inválido") {
      throw error;
    }

    // USE_REAL_API=true → nunca mock; re-lanzar el error real
    if (useRealApi) {
      throw error instanceof Error
        ? error
        : new Error("No se pudo consultar el RUC");
    }

    // USE_REAL_API=false → degradar a mock
    return getMockSunatRucResponse(ruc);
  }
}

/**
 * Validación local histórica (fallback).
 * Conserva el comportamiento original del wizard.
 * NO eliminar: XML/PDF/OCR/IA/riesgo dependen de AutomaticValidation.
 */
async function validarComprobanteLocal(
  comprobante: Comprobante
): Promise<AutomaticValidation> {
  const rucData = await consultarRuc(comprobante.rucProveedor);
  const observaciones: string[] = [];

  const rucActivo = rucData.estado === "ACTIVO";
  const rucHabido = rucData.condicion === "HABIDO";
  const emisorElectronico = rucData.emisorElectronico;

  if (!rucActivo) observaciones.push("El RUC del proveedor no se encuentra activo");
  if (!rucHabido) observaciones.push("El RUC del proveedor no se encuentra habido");
  if (!emisorElectronico) {
    observaciones.push("El proveedor no está registrado como emisor electrónico");
  }

  const comprobanteValido =
    comprobante.serie.length >= 3 &&
    comprobante.numero.length >= 1 &&
    comprobante.importe > 0;

  if (!comprobanteValido) {
    observaciones.push("El comprobante presenta inconsistencias en sus datos");
  }

  const razonSocialCoincide =
    comprobante.razonSocial.toUpperCase().includes(rucData.razonSocial.split(" ")[0]) ||
    rucData.razonSocial.includes(
      comprobante.razonSocial.split(" ")[0]?.toUpperCase() ?? ""
    );

  if (!razonSocialCoincide) {
    observaciones.push(
      "La razón social no coincide exactamente con los registros consultados"
    );
  }

  return {
    rucActivo,
    rucHabido,
    comprobanteValido,
    emisorElectronico,
    coincidenciaDatos: razonSocialCoincide,
    observaciones,
  };
}

/**
 * Mapea el DTO normalizado de SUNAT + datos de RUC al contrato
 * AutomaticValidation que consumen formales / riesgo / resultado.
 */
function mapSunatToAutomaticValidation(
  sunat: SunatValidacionResultado,
  rucData: SunatRucResponse,
  comprobante: Comprobante
): AutomaticValidation {
  const rucActivo =
    sunat.estadoRuc === "ACTIVO" ||
    (sunat.estadoRuc === "DESCONOCIDO" && rucData.estado === "ACTIVO");

  const rucHabido =
    sunat.condicionDomicilio === "HABIDO" ||
    (sunat.condicionDomicilio === "DESCONOCIDO" &&
      rucData.condicion === "HABIDO");

  const razonSocialCoincide =
    comprobante.razonSocial.toUpperCase().includes(rucData.razonSocial.split(" ")[0]) ||
    rucData.razonSocial.includes(
      comprobante.razonSocial.split(" ")[0]?.toUpperCase() ?? ""
    );

  const observaciones = [...sunat.observaciones];

  if (!rucActivo) {
    observaciones.push("El RUC del proveedor no se encuentra activo");
  }
  if (!rucHabido) {
    observaciones.push("El RUC del proveedor no se encuentra habido");
  }
  if (!rucData.emisorElectronico && !sunat.valido) {
    observaciones.push("El proveedor no está registrado como emisor electrónico");
  }
  if (!razonSocialCoincide) {
    observaciones.push(
      "La razón social no coincide exactamente con los registros consultados"
    );
  }
  if (sunat.estado !== "DESCONOCIDO") {
    observaciones.unshift(
      `SUNAT: comprobante ${sunat.estado} (riesgo ${sunat.riesgo})`
    );
  }

  return {
    rucActivo,
    rucHabido,
    comprobanteValido: sunat.valido,
    emisorElectronico: rucData.emisorElectronico || sunat.valido,
    coincidenciaDatos: razonSocialCoincide || sunat.valido,
    observaciones: [...new Set(observaciones)],
  };
}

type SunatClientAttempt =
  | { kind: "ok"; data: SunatValidacionResultado }
  | { kind: "fallback"; message: string; status?: number }
  | { kind: "error"; message: string };

function mensajeFallbackSunat(status?: number, motivo?: string): string {
  const codigo = status ?? "N/D";
  if (motivo) {
    return `Consulta oficial SUNAT no disponible (${codigo}). Motivo: ${motivo}. Se utilizó la validación local.`;
  }
  return `Consulta oficial SUNAT no disponible (${codigo}). Se utilizó la validación local.`;
}

/**
 * Intenta la consulta oficial vía /api/sunat/validar.
 * Decide fallback según allowFallback / status HTTP (no degrada ante cualquier error).
 */
async function intentarValidacionSunatOficial(
  comprobante: Comprobante
): Promise<SunatClientAttempt> {
  try {
    sunatLog("Consultando SUNAT", {
      via: "/api/sunat/validar",
      ruc: comprobante.rucProveedor,
    });

    const response = await fetch(getInternalValidarApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        rucProveedor: comprobante.rucProveedor,
        tipoComprobante: comprobante.tipoComprobante,
        serie: comprobante.serie,
        numero: comprobante.numero,
        fecha: comprobante.fecha,
        importe: comprobante.importe,
      }),
      cache: "no-store",
    });

    const data = await response.json();

    if (response.ok && data.success !== false && typeof data.valido === "boolean") {
      return {
        kind: "ok",
        data: {
          valido: Boolean(data.valido),
          estado: data.estado,
          riesgo: data.riesgo,
          observaciones: Array.isArray(data.observaciones)
            ? data.observaciones
            : [],
          estadoRuc: data.estadoRuc ?? "DESCONOCIDO",
          condicionDomicilio: data.condicionDomicilio ?? "DESCONOCIDO",
          message: data.message ?? "",
        },
      };
    }

    const errorBody = data as Partial<SunatApiErrorBody>;
    const message =
      errorBody.message ??
      (Array.isArray(errorBody.observaciones)
        ? errorBody.observaciones[0]
        : undefined) ??
      `Error SUNAT (${response.status})`;

    const allowFallback =
      errorBody.allowFallback === true ||
      response.status === 500 ||
      response.status === 502 ||
      response.status === 503 ||
      response.status === 504 ||
      response.status === 429;

    // 400 → error al usuario, sin fallback
    if (response.status === 400 || errorBody.code === "BAD_REQUEST") {
      sunatLog("Error de validación SUNAT (400)", { message }, "error");
      return { kind: "error", message };
    }

    // 403 → sin autorización, sin fallback
    if (response.status === 403 || errorBody.code === "FORBIDDEN") {
      sunatLog("Aplicación sin autorización SUNAT (403)", { message }, "error");
      return {
        kind: "error",
        message:
          message ||
          "La aplicación no tiene autorización para consultar SUNAT.",
      };
    }

    // 404 → error de configuración (se registra; sin fallback silencioso)
    if (response.status === 404 || errorBody.code === "NOT_FOUND") {
      sunatLog("Error de configuración SUNAT (404)", { message }, "error");
      return {
        kind: "error",
        message:
          message ||
          "Error de configuración: endpoint SUNAT no encontrado.",
      };
    }

    // 401 persistente tras reintentos del servidor → error de autenticación
    if (
      response.status === 401 &&
      errorBody.allowFallback !== true
    ) {
      sunatLog("SUNAT respondió 401", { message }, "error");
      return {
        kind: "error",
        message: message || "No se pudo autenticar con SUNAT.",
      };
    }

    if (allowFallback) {
      sunatLog("SUNAT no disponible", {
        status: response.status,
        code: errorBody.code,
      }, "warn");
      return { kind: "fallback", message, status: response.status };
    }

    return { kind: "error", message };
  } catch (error) {
    // Fallo de red hacia nuestro propio API → SUNAT no disponible → fallback
    const detail = error instanceof Error ? error.message : "unknown";
    sunatLog(
      "SUNAT no disponible",
      {
        reason: "client_network",
        detail,
      },
      "warn"
    );
    return {
      kind: "fallback",
      message: detail || "No se pudo contactar el servicio de validación SUNAT",
      status: 503,
    };
  }
}

/**
 * Validación automática del wizard.
 *
 * if (SUNAT disponible / éxito)
 *   → resultado oficial normalizado → AutomaticValidation
 * else if (error recuperable: 5xx / 429 / red / no configurado)
 *   → validación local histórica (fallback)
 * else (400 / 403 / 404 / 401 persistente)
 *   → error al usuario (NO fallback)
 *
 * No modifica formales / sustanciales / riesgo / resultado.
 */
export async function validarComprobante(
  comprobante: Comprobante
): Promise<AutomaticValidation> {
  const [rucData, sunatAttempt] = await Promise.all([
    consultarRuc(comprobante.rucProveedor),
    intentarValidacionSunatOficial(comprobante),
  ]);

  if (sunatAttempt.kind === "ok") {
    return mapSunatToAutomaticValidation(
      sunatAttempt.data,
      rucData,
      comprobante
    );
  }

  if (sunatAttempt.kind === "error") {
    throw new Error(sunatAttempt.message);
  }

  // Fallback controlado
  sunatLog("Fallback activado", {
    reason: sunatAttempt.message,
    status: sunatAttempt.status,
  }, "warn");
  const fallback = await validarComprobanteLocal(comprobante);
  return {
    ...fallback,
    observaciones: [
      mensajeFallbackSunat(sunatAttempt.status, sunatAttempt.message),
      ...fallback.observaciones,
    ],
  };
}

export async function escanearQR(_qrData: string): Promise<Partial<Comprobante>> {

  return {
    rucProveedor: "20512345678",
    razonSocial: "DISTRIBUIDORA LIMA NORTE EIRL",
    tipoComprobante: "01",
    serie: "F001",
    numero: "00088776",
    fecha: new Date().toISOString().split("T")[0],
    importe: 590,
    igv: 90,
    moneda: "PEN",
  };
}

/**
 * Parseo de XML UBL — requiere DOMParser (solo navegador).
 * Debe invocarse desde Client Components (p. ej. validacion/nueva).
 */
export async function parsearXML(file: File): Promise<Partial<Comprobante>> {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    throw new Error(
      "parsearXML() solo puede ejecutarse en el cliente (DOMParser no disponible en el servidor)."
    );
  }

  const xml = await file.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");

  const obtener = (tag: string) =>
    doc.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";

  const supplier =
  doc.getElementsByTagName("cac:AccountingSupplierParty")[0];

  const rucProveedor =
   supplier
      ?.getElementsByTagName("cbc:ID")[0]
      ?.textContent
      ?.trim() ?? "";

  const razonSocial =
    obtener("cbc:RegistrationName") ||
    obtener("cac:PartyLegalEntity cbc:RegistrationName");

  const serieNumero = obtener("cbc:ID");

  let serie = "";
  let numero = "";

  if (serieNumero.includes("-")) {
    [serie, numero] = serieNumero.split("-");
  }

  const fecha = obtener("cbc:IssueDate");

  const moneda: Moneda =
  obtener("cbc:DocumentCurrencyCode") === "USD" ? "USD" : "PEN";

  const importe =
    Number(
      obtener("cbc:PayableAmount") ||
      obtener("cbc:LineExtensionAmount")
    ) || 0;

  const igv =
    Number(
      obtener("cbc:TaxAmount")
    ) || 0;

  return {
    rucProveedor,
    razonSocial,
    tipoComprobante: "01",
    serie,
    numero,
    fecha,
    importe,
    igv,
    moneda,
    inputMethod: "xml",
  };
}

export async function parsearPDF(file: File): Promise<Partial<Comprobante>> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/extraer-documento", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("No se pudo leer el PDF.");
  }

  return await response.json();
}

export async function parsearImagen(file: File): Promise<Partial<Comprobante>> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/extraer-documento", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("No se pudo leer la imagen.");
  }

  return await response.json();
}

export function parsearQR(qr: string) {
  const partes = qr.split("|");

  const [dia, mes, anio] = partes[6].split("/");

  const fecha = `${anio}-${mes}-${dia}`;

  return {
    rucProveedor: partes[0],
    tipoComprobante: partes[1],
    serie: partes[2],
    numero: partes[3],
    igv: Number(partes[4]),
    importe: Number(partes[5]),
    fecha,
  };
}

function simulateNetworkDelay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
