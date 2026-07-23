import type { Comprobante } from "@/types";

export async function parsearXMLSUNAT(
  file: File
): Promise<Partial<Comprobante>> {

  const xml = await file.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");

  // Aquí irá todo el parser

  return {};
}