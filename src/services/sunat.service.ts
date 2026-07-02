/**
 * Servicio mock para consultas SUNAT.
 * Reemplazar por integración real con APIs permitidas de SUNAT.
 */
import type { AutomaticValidation, Comprobante } from "@/types";
import { validateRuc } from "@/utils";
import { getMockRucData } from "./mock-data";

export interface SunatRucResponse {
  ruc: string;
  razonSocial: string;
  estado: "ACTIVO" | "INACTIVO";
  condicion: "HABIDO" | "NO HABIDO";
  emisorElectronico: boolean;
}

export async function consultarRuc(ruc: string): Promise<SunatRucResponse> {
  await simulateNetworkDelay();

  const mockData = getMockRucData(ruc);
  const rucValido = validateRuc(ruc);

  return {
    ruc,
    razonSocial: mockData.razonSocial,
    estado: mockData.activo && rucValido ? "ACTIVO" : "INACTIVO",
    condicion: mockData.habido ? "HABIDO" : "NO HABIDO",
    emisorElectronico: mockData.emisorElectronico,
  };
}

export async function validarComprobante(
  comprobante: Comprobante
): Promise<AutomaticValidation> {
  await simulateNetworkDelay();

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
  await simulateNetworkDelay();
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

export async function parsearXML(_file: File): Promise<Partial<Comprobante>> {
  await simulateNetworkDelay();
  return {
    rucProveedor: "20100070970",
    razonSocial: "SUPERMERCADOS PERUANOS S.A.",
    tipoComprobante: "01",
    serie: "F001",
    numero: "00099887",
    fecha: "2025-06-18",
    importe: 3540,
    igv: 540,
    moneda: "PEN",
  };
}

export async function parsearPDF(_file: File): Promise<Partial<Comprobante>> {
  await simulateNetworkDelay();
  return {
    rucProveedor: "20654321098",
    razonSocial: "TECNOLOGIA EMPRESARIAL PERU SAC",
    tipoComprobante: "01",
    serie: "E001",
    numero: "00044556",
    fecha: "2025-06-19",
    importe: 2360,
    igv: 360,
    moneda: "PEN",
  };
}

export async function parsearImagen(_file: File): Promise<Partial<Comprobante>> {
  await simulateNetworkDelay();
  return {
    rucProveedor: "20512345678",
    razonSocial: "DISTRIBUIDORA LIMA NORTE EIRL",
    tipoComprobante: "03",
    serie: "B001",
    numero: "00011223",
    fecha: "2025-06-17",
    importe: 118,
    igv: 18,
    moneda: "PEN",
  };
}

function simulateNetworkDelay(ms = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
