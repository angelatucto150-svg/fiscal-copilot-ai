import { NextRequest, NextResponse } from "next/server";
import { validarComprobanteSUNATNormalizado } from "@/services/sunat-cpe.service";
import {
  buildSunatPayload,
  validarPayloadSunat,
} from "@/utils/sunat-validators";
import { sunatLog } from "@/lib/sunat-logger";
import {
  SunatApiError,
  type SunatApiErrorBody,
  type SunatValidarRequest,
} from "@/types/sunat";

export async function GET() {
  return NextResponse.json({
    message:
      "La API de validación está funcionando. Usa una petición POST para consultar SUNAT.",
  });
}

function errorBody(
  error: SunatApiError | { message: string; status: number; code: SunatApiErrorBody["code"]; allowFallback: boolean },
  extra?: { errors?: { field: string; message: string }[] }
): SunatApiErrorBody {
  return {
    success: false,
    allowFallback: error.allowFallback,
    code: error.code,
    message: error.message,
    valido: false,
    estado: "DESCONOCIDO",
    riesgo: "ALTO",
    observaciones: [error.message],
    ...(extra?.errors ? { errors: extra.errors } : {}),
  };
}

/**
 * POST /api/sunat/validar
 *
 * Acepta:
 * A) Payload oficial SUNAT (numRuc, codComp, ...)
 * B) Payload de dominio Fiscal Copilot (rucProveedor, serie, numero, fecha, importe, ...)
 *
 * Responde DTO normalizado (sin códigos estadoCp).
 * En error incluye allowFallback para que el cliente decida.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let payload: SunatValidarRequest;

    if (body.numRuc && body.codComp) {
      payload = {
        numRuc: String(body.numRuc),
        codComp: String(body.codComp),
        numeroSerie: String(body.numeroSerie ?? ""),
        numero: String(body.numero ?? ""),
        fechaEmision: String(body.fechaEmision ?? ""),
        monto: String(body.monto ?? ""),
      };
    } else if (body.rucProveedor && body.tipoComprobante) {
      try {
        payload = buildSunatPayload({
          rucProveedor: String(body.rucProveedor),
          tipoComprobante: String(body.tipoComprobante),
          serie: String(body.serie ?? ""),
          numero: String(body.numero ?? ""),
          fecha: String(body.fecha ?? ""),
          importe: Number(body.importe ?? body.monto ?? 0),
        });
      } catch (buildError) {
        const message =
          buildError instanceof Error
            ? buildError.message
            : "No se pudo construir el payload SUNAT";
        return NextResponse.json(
          errorBody({
            message,
            status: 400,
            code: "BAD_REQUEST",
            allowFallback: false,
          }),
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        errorBody({
          message:
            "Body inválido. Envíe campos SUNAT (numRuc, codComp, ...) o dominio (rucProveedor, tipoComprobante, ...).",
          status: 400,
          code: "BAD_REQUEST",
          allowFallback: false,
        }),
        { status: 400 }
      );
    }

    const errors = validarPayloadSunat(payload);
    if (errors.length > 0) {
      return NextResponse.json(
        errorBody(
          {
            message: "Payload de validación inválido",
            status: 400,
            code: "BAD_REQUEST",
            allowFallback: false,
          },
          { errors }
        ),
        { status: 400 }
      );
    }

    const resultado = await validarComprobanteSUNATNormalizado(payload);

    return NextResponse.json({
      success: true,
      ...resultado,
    });
  } catch (error) {
    if (error instanceof SunatApiError) {
      if (error.allowFallback) {
        sunatLog("Fallback permitido por API", {
          code: error.code,
          status: error.status,
        }, "warn");
      }

      return NextResponse.json(errorBody(error), { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Error desconocido";

    sunatLog("SUNAT no disponible", { reason: "unhandled", detail: message }, "error");

    return NextResponse.json(
      errorBody({
        message,
        status: 503,
        code: "UNAVAILABLE",
        allowFallback: true,
      }),
      { status: 503 }
    );
  }
}
