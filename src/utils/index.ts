import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RiskLevel, RiskTrafficLight } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, moneda: string = "PEN"): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getRiskLabel(puntaje: number): string {
  if (puntaje >= 80) return "Riesgo Bajo";
  if (puntaje >= 50) return "Revisar documentación";
  return "Alto Riesgo";
}

export function getRiskLevel(puntaje: number): RiskLevel {
  if (puntaje >= 80) return "bajo";
  if (puntaje >= 50) return "medio";
  return "alto";
}

export function getRiskTrafficLight(puntaje: number): RiskTrafficLight {
  if (puntaje >= 80) return "verde";
  if (puntaje >= 50) return "amarillo";
  return "rojo";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    aprobado: "text-success bg-success/10 border-success/20",
    observado: "text-warning bg-warning/10 border-warning/20",
    rechazado: "text-danger bg-danger/10 border-danger/20",
    pendiente: "text-muted-foreground bg-muted border-border",
  };
  return colors[status] ?? colors.pendiente;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function validateRuc(ruc: string): boolean {
  if (!/^\d{11}$/.test(ruc)) return false;
  const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = ruc.split("").map(Number);
  const sum = factors.reduce((acc, factor, i) => acc + factor * digits[i], 0);
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? remainder : 11 - remainder;
  return checkDigit === digits[10];
}
