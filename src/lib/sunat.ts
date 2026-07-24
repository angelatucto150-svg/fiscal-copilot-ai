/**
 * Configuración oficial de la API SUNAT
 * Fiscal Copilot AI
 *
 * Tipos de dominio viven en @/types/sunat; aquí solo infraestructura.
 */

export {
  type SunatTokenResponse,
  type SunatValidarRequest,
  type SunatValidarResponse,
  type SunatValidacionResultado,
} from "@/types/sunat";

export const SUNAT_API = {
  SECURITY_URL: "https://api-seguridad.sunat.gob.pe",
  BASE_URL: "https://api.sunat.gob.pe",

  TOKEN_ENDPOINT: (clientId: string) =>
    `/v1/clientesextranet/${clientId}/oauth2/token/`,

  VALIDAR_COMPROBANTE_ENDPOINT: (rucConsulta: string) =>
    `/v1/contribuyente/contribuyentes/${rucConsulta}/validarcomprobante`,

  /** Timeout de red hacia SUNAT (ms) */
  REQUEST_TIMEOUT_MS: 15_000,

  /** Segundos de anticipación para renovar el token */
  TOKEN_SKEW_SECONDS: 120,
} as const;
