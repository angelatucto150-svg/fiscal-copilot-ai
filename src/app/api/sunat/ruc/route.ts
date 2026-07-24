import { NextResponse } from "next/server";

/**
 * GET /api/sunat/ruc?ruc=XXXXXXXXXXX
 * Consulta real al proveedor de RUC (APIsPeru). Sin mocks.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ruc = searchParams.get("ruc");

  if (!ruc || ruc.length !== 11 || !/^\d{11}$/.test(ruc)) {
    return NextResponse.json({ error: "RUC inválido" }, { status: 400 });
  }

  const token = process.env.APISPERU_TOKEN?.trim();

  if (!token) {
    return NextResponse.json(
      { error: "APISPERU_TOKEN no configurado en el servidor" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://dniruc.apisperu.com/api/v1/ruc/${ruc}?token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        (data as { error?: string; message?: string })?.error ||
        (data as { message?: string })?.message ||
        `Error al consultar RUC (${response.status})`;

      return NextResponse.json(
        { error: message },
        { status: response.status >= 400 ? response.status : 500 }
      );
    }

    if (!(data as { ruc?: string; razonSocial?: string }).razonSocial && !(data as { ruc?: string }).ruc) {
      return NextResponse.json(
        { error: "El proveedor de RUC no devolvió datos válidos" },
        { status: 502 }
      );
    }

    const payload = data as {
      ruc?: string;
      razonSocial?: string;
      estado?: string;
      condicion?: string;
      emisorElectronico?: boolean;
    };

    return NextResponse.json({
      ruc: payload.ruc ?? ruc,
      razonSocial: payload.razonSocial ?? "",
      estado: payload.estado === "ACTIVO" ? "ACTIVO" : "INACTIVO",
      condicion: payload.condicion === "HABIDO" ? "HABIDO" : "NO HABIDO",
      emisorElectronico: payload.emisorElectronico ?? true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno al consultar el RUC",
      },
      { status: 500 }
    );
  }
}
