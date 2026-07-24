import {
  invalidarTokenSUNAT,
  isSunatConfigurado,
  obtenerTokenSUNAT,
} from "@/services/sunat-auth.service";
import { SUNAT_API } from "@/lib/sunat";
import { sunatLog } from "@/lib/sunat-logger";
import {
  construirResultadoValidacion,
  SunatApiError,
  type SunatValidarRequest,
  type SunatValidarResponse,
  type SunatValidacionResultado,
} from "@/types/sunat";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchValidarComprobante(
  payload: SunatValidarRequest,
  token: string,
  attempt = 1
): Promise<Response> {
  const rucConsulta = process.env.SUNAT_RUC_CONSULTA;

  if (!rucConsulta) {
    throw new SunatApiError(
      "Configuración incompleta: falta SUNAT_RUC_CONSULTA",
      404,
      "CONFIG",
      false
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    SUNAT_API.REQUEST_TIMEOUT_MS
  );

  try {
    return await fetch(
      `${SUNAT_API.BASE_URL}${SUNAT_API.VALIDAR_COMPROBANTE_ENDPOINT(rucConsulta)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: controller.signal,
      }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // Timeout: reintentar automáticamente UNA vez antes del fallback
      if (attempt < 2) {
        sunatLog("Reintentando consulta", { reason: "timeout" });
        return fetchValidarComprobante(payload, token, attempt + 1);
      }
      sunatLog("SUNAT no disponible", { reason: "timeout", afterRetry: true }, "warn");
      throw new SunatApiError(
        "Timeout al consultar validez del comprobante en SUNAT",
        503,
        "UNAVAILABLE",
        true
      );
    }
    sunatLog(
      "SUNAT no disponible",
      { reason: "network", detail: error instanceof Error ? error.message : "unknown" },
      "warn"
    );
    throw new SunatApiError(
      "SUNAT no disponible (error de red)",
      503,
      "UNAVAILABLE",
      true
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

async function mapHttpError(
  response: Response
): Promise<never> {
  const bodyText = await response.text();
  const detail = bodyText.slice(0, 300);
  const status = response.status;

  sunatLog(`SUNAT respondió ${status}`, { detail }, status >= 500 ? "warn" : "error");

  if (status === 400) {
    throw new SunatApiError(
      "Solicitud inválida hacia SUNAT. Verifique los datos del comprobante.",
      400,
      "BAD_REQUEST",
      false
    );
  }

  if (status === 403) {
    throw new SunatApiError(
      "La aplicación no tiene autorización para consultar SUNAT.",
      403,
      "FORBIDDEN",
      false
    );
  }

  if (status === 404) {
    sunatLog("Error de configuración SUNAT", { status: 404, detail }, "error");
    throw new SunatApiError(
      "Endpoint SUNAT no encontrado. Revise la configuración de la API.",
      404,
      "NOT_FOUND",
      false
    );
  }

  if (status === 429) {
    throw new SunatApiError(
      "Límite de consultas SUNAT excedido. Intente nuevamente.",
      429,
      "RATE_LIMIT",
      true
    );
  }

  if (status === 500 || status === 502 || status === 503 || status === 504) {
    sunatLog("SUNAT no disponible", { status }, "warn");
    throw new SunatApiError(
      `SUNAT no disponible temporalmente (${status})`,
      status,
      "UNAVAILABLE",
      true
    );
  }

  if (status === 401) {
    throw new SunatApiError(
      "Token SUNAT inválido o expirado",
      401,
      "UNAUTHORIZED",
      false
    );
  }

  throw new SunatApiError(
    `Error inesperado de SUNAT (${status})`,
    status,
    "UNKNOWN",
    false
  );
}

/**
 * Consulta oficial SUNAT (respuesta cruda).
 *
 * - 401 → invalidar token, renovar, reintentar UNA vez
 * - 429 → esperar 1s, reintentar UNA vez
 * - 5xx → error con allowFallback
 * - 400/403/404 → error sin fallback
 */
export async function validarComprobanteSUNAT(
  payload: SunatValidarRequest
): Promise<SunatValidarResponse> {
  if (!isSunatConfigurado()) {
    sunatLog("SUNAT no disponible", { reason: "not_configured" }, "warn");
    throw new SunatApiError(
      "SUNAT no está configurado en el servidor",
      503,
      "CONFIG",
      true
    );
  }

  sunatLog("Consultando SUNAT", {
    numRuc: payload.numRuc,
    codComp: payload.codComp,
    numeroSerie: payload.numeroSerie,
    numero: payload.numero,
  });

  let token = await obtenerTokenSUNAT();
  let response = await fetchValidarComprobante(payload, token);

  // 401 → renovar token y reintentar una sola vez
  if (response.status === 401) {
    sunatLog("SUNAT respondió 401", {}, "warn");
    sunatLog("Reintentando consulta", { reason: "401_token_refresh" });
    invalidarTokenSUNAT();
    token = await obtenerTokenSUNAT({ forceRenew: true });
    response = await fetchValidarComprobante(payload, token);

    if (response.status === 401) {
      sunatLog("SUNAT respondió 401", { afterRetry: true }, "error");
      throw new SunatApiError(
        "No se pudo autenticar con SUNAT tras renovar el token.",
        401,
        "UNAUTHORIZED",
        false
      );
    }
  }

  // 429 → esperar 1s y reintentar una sola vez
  if (response.status === 429) {
    sunatLog("SUNAT respondió 429", {}, "warn");
    sunatLog("Reintentando consulta", { reason: "429_rate_limit", waitMs: 1000 });
    await sleep(1000);
    response = await fetchValidarComprobante(payload, token);

    if (response.status === 429) {
      sunatLog("SUNAT respondió 429", { afterRetry: true }, "warn");
      throw new SunatApiError(
        "Límite de consultas SUNAT excedido. Intente nuevamente.",
        429,
        "RATE_LIMIT",
        true
      );
    }
  }

  if (!response.ok) {
    await mapHttpError(response);
  }

  const raw = (await response.json()) as SunatValidarResponse;
  sunatLog("Consulta SUNAT completada", {
    success: raw.success,
    // No loguear códigos crudos al cliente; en server sí es útil el estadoCp
    estadoCp: raw.data?.estadoCp,
  });

  return raw;
}

/**
 * Consulta oficial + normalización para el frontend.
 * El cliente nunca recibe códigos estadoCp / estadoRuc / condDomiRuc.
 */
export async function validarComprobanteSUNATNormalizado(
  payload: SunatValidarRequest
): Promise<SunatValidacionResultado> {
  const raw = await validarComprobanteSUNAT(payload);
  return construirResultadoValidacion(raw);
}
