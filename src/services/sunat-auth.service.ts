import { SUNAT_API, type SunatTokenResponse } from "@/lib/sunat";
import { sunatLog, tokenPreview } from "@/lib/sunat-logger";

let tokenCache: string | null = null;
let tokenExpiration = 0;

/** Indica si las credenciales server-side están configuradas. */
export function isSunatConfigurado(): boolean {
  return Boolean(
    process.env.SUNAT_CLIENT_ID &&
      process.env.SUNAT_CLIENT_SECRET &&
      process.env.SUNAT_RUC_CONSULTA
  );
}

/** Invalida el token en caché (p. ej. tras HTTP 401 de SUNAT). */
export function invalidarTokenSUNAT(): void {
  tokenCache = null;
  tokenExpiration = 0;
  sunatLog("Token invalidado");
}

export async function obtenerTokenSUNAT(
  options: { forceRenew?: boolean } = {}
): Promise<string> {
  const now = Date.now();
  const forceRenew = options.forceRenew === true;

  if (!forceRenew && tokenCache && now < tokenExpiration) {
    return tokenCache;
  }

  const wasRenewal = forceRenew || Boolean(tokenCache);

  const clientId = process.env.SUNAT_CLIENT_ID;
  const clientSecret = process.env.SUNAT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Faltan las credenciales de SUNAT.");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "https://api.sunat.gob.pe/v1/contribuyente/contribuyentes",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const maxAttempts = 2; // 1 intento + 1 reintento ante AbortError/timeout

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      SUNAT_API.REQUEST_TIMEOUT_MS
    );

    try {
      const response = await fetch(
        `${SUNAT_API.SECURITY_URL}${SUNAT_API.TOKEN_ENDPOINT(clientId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
          cache: "no-store",
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        sunatLog(
          "Error OAuth SUNAT",
          { status: response.status, detail: error.slice(0, 200) },
          "error"
        );
        throw new Error(`Error OAuth SUNAT: ${error}`);
      }

      const data = (await response.json()) as SunatTokenResponse;

      tokenCache = data.access_token;

      const skew = SUNAT_API.TOKEN_SKEW_SECONDS;
      tokenExpiration = now + (data.expires_in - skew) * 1000;

      sunatLog(wasRenewal ? "Token renovado" : "Token obtenido", {
        expiresIn: data.expires_in,
        preview: tokenPreview(data.access_token),
      });

      return tokenCache;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        if (attempt < maxAttempts) {
          sunatLog("Reintentando consulta", { reason: "token_timeout" });
          continue;
        }
        throw new Error("Timeout al obtener token OAuth de SUNAT");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error("Timeout al obtener token OAuth de SUNAT");
}
