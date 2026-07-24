import { NextResponse } from "next/server";
import { obtenerTokenSUNAT } from "@/services/sunat-auth.service";

export async function GET() {
  try {
    const token = await obtenerTokenSUNAT();

    return NextResponse.json({
      success: true,
      message: "Token obtenido correctamente",
      token: token.substring(0, 20) + "...",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}