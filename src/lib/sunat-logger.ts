/**
 * Logging estructurado SUNAT.
 * Nunca registrar client_secret ni access_token completo.
 */

type SunatLogLevel = "info" | "warn" | "error";

export function sunatLog(
  event: string,
  meta?: Record<string, unknown>,
  level: SunatLogLevel = "info"
): void {
  const entry = {
    scope: "sunat",
    event,
    ts: new Date().toISOString(),
    ...(meta ?? {}),
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

/** Preview seguro de token (nunca el valor completo). */
export function tokenPreview(token: string): string {
  if (!token) return "(empty)";
  if (token.length <= 12) return `${token.slice(0, 4)}…`;
  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}
