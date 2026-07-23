import { NextResponse } from "next/server";
import { getMockSunatRucResponse } from "@/services/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ruc = searchParams.get("ruc");

  if (!ruc || ruc.length !== 11) {
    return NextResponse.json(
      { error: "RUC inválido" },
      { status: 400 }
    );
  }

  const useRealApi = process.env.USE_REAL_API === "true";

  if (!useRealApi) {
    return NextResponse.json(
      getMockSunatRucResponse(ruc)
    );
  }

  const token = process.env.APISPERU_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "APISPERU_TOKEN no configurado" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://dniruc.apisperu.com/api/v1/ruc/${ruc}?token=${token}`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, {
        status: response.status,
      });
    }

    return NextResponse.json({
      ruc: data.ruc,
      razonSocial: data.razonSocial,
      estado: data.estado,
      condicion: data.condicion,
      emisorElectronico: data.emisorElectronico ?? true,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}