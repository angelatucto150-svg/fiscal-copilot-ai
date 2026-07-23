/**
 * Servicio para consultas SUNAT vía Decolecta (proxy server-side).
 * El token nunca se expone al cliente: las consultas pasan por /api/sunat/ruc.
 */
import type { AutomaticValidation, Comprobante } from "@/types";
import { validateRuc } from "@/utils";
import { getMockSunatRucResponse } from "./mock-data";

export interface SunatRucResponse {
  ruc: string;
  razonSocial: string;
  estado: "ACTIVO" | "INACTIVO";
  condicion: "HABIDO" | "NO HABIDO";
  emisorElectronico: boolean;
}

function getInternalRucApiUrl(ruc: string): string {
  if (typeof window === "undefined") {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return `${baseUrl}/api/sunat/ruc?ruc=${ruc}`;
  }
  return `/api/sunat/ruc?ruc=${ruc}`;
}

export async function consultarRuc(ruc: string): Promise<SunatRucResponse> {
  const rucValido = validateRuc(ruc);

  if (!rucValido) {
    throw new Error("RUC inválido");
  }

  try {
    const response = await fetch(getInternalRucApiUrl(ruc), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (response.ok) {
      return (await response.json()) as SunatRucResponse;
    }

    // Fallback mock si Decolecta falla (401 sin token, límite mensual, etc.)
    if (response.status === 401 || response.status === 429 || response.status === 500) {
      return getMockSunatRucResponse(ruc);
    }

    throw new Error("No se pudo consultar el RUC");
  } catch {
    return getMockSunatRucResponse(ruc);
  }
}

export async function validarComprobante(
  comprobante: Comprobante
): Promise<AutomaticValidation> {

  const rucData = await consultarRuc(comprobante.rucProveedor);
  const observaciones: string[] = [];

  const rucActivo = rucData.estado === "ACTIVO";
  const rucHabido = rucData.condicion === "HABIDO";
  const emisorElectronico = rucData.emisorElectronico;

  if (!rucActivo) observaciones.push("El RUC del proveedor no se encuentra activo");
  if (!rucHabido) observaciones.push("El RUC del proveedor no se encuentra habido");
  if (!emisorElectronico) observaciones.push("El proveedor no está registrado como emisor electrónico");

  const comprobanteValido =
    comprobante.serie.length >= 3 &&
    comprobante.numero.length >= 1 &&
    comprobante.importe > 0;

  if (!comprobanteValido) observaciones.push("El comprobante presenta inconsistencias en sus datos");

  const razonSocialCoincide =
    comprobante.razonSocial.toUpperCase().includes(rucData.razonSocial.split(" ")[0]) ||
    rucData.razonSocial.includes(comprobante.razonSocial.split(" ")[0]?.toUpperCase() ?? "");

  if (!razonSocialCoincide) {
    observaciones.push("La razón social no coincide exactamente con los registros consultados");
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

export async function parsearXML(file: File): Promise<Partial<Comprobante>> {
  
  const xml = await file.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  
  console.log(doc.getElementsByTagName("cac:AccountingSupplierParty").length);
  console.log(doc.getElementsByTagName("cbc:ID").length);

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

  const moneda = obtener("cbc:DocumentCurrencyCode") || "PEN";

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

  console.log("Fecha QR:", fecha);

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
