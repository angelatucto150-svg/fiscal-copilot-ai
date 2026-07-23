import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Archivo no recibido" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();

    const base64 = Buffer.from(bytes).toString("base64");

    const prompt = `
    Analiza el comprobante de pago peruano.
    
    Extrae exactamente este JSON.
    
    {
      "rucProveedor":"",
      "razonSocial":"",
      "tipoComprobante":"",
      "serie":"",
      "numero":"",
      "fecha":"",
      "igv":0,
      "importe":0
    }
    
    Reglas:
    
    - tipoComprobante debe ser:
      FACTURA
      BOLETA
      NOTA DE CREDITO
      NOTA DE DEBITO
    
    - fecha debe estar en formato:
      YYYY-MM-DD
    
    Ejemplo:
    
    30/06/2026
    
    ↓
    
    2026-06-30
    
    No inventes datos.
    
    Devuelve únicamente el JSON.
    `;


    const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
      contents: [
        {
          inlineData: {
            mimeType: file.type,
            data: base64,
          },
        },
        {
          text: prompt,
        },
      ],
    });

    let texto = response.text ?? "";

    texto = texto
      .replace("```json", "")
      .replace("```", "")
      .trim();


      const json = JSON.parse(texto);
      
      const mapaTipos: Record<string, string> = {
        FACTURA: "01",
        BOLETA: "03",
        "BOLETA DE VENTA": "03",
        "NOTA DE CRÉDITO": "07",
        "NOTA DE CREDITO": "07",
        "NOTA DE DÉBITO": "08",
        "NOTA DE DEBITO": "08",
      };
      
      json.tipoComprobante =
        mapaTipos[json.tipoComprobante?.toUpperCase()] ??
        json.tipoComprobante;
      
      return NextResponse.json(json);
  } catch (e: any) {
    console.error("ERROR COMPLETO");
    console.error(e);
    console.error(e.message);
    console.error(e.stack);
  
    return NextResponse.json(
      { error: "No fue posible leer el documento." },
      { status: 500 }
    );
  }
}