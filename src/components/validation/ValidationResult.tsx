"use client";

import { AlertTriangle, CheckCircle2, Shield, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { ValidationSummary, ValidationResult as ReglaValidacion, RiskLevel } from "@/types";
import { cn } from "@/utils";

interface ValidationResultProps {
  summary: ValidationSummary;
  className?: string;
}

const RIESGO_CONFIG: Record<
  RiskLevel,
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  bajo: {
    label: "Riesgo Bajo",
    variant: "success",
  },
  medio: {
    label: "Riesgo Moderado",
    variant: "warning",
  },
  alto: {
    label: "Alto Riesgo",
    variant: "danger",
  },
};

const ESTADO_CONFIG = {
  success: {
    icon: CheckCircle2,
    badge: "success" as const,
    label: "Correcto",
    border: "border-success/30",
    iconClass: "text-success",
  },
  warning: {
    icon: AlertTriangle,
    badge: "warning" as const,
    label: "Advertencia",
    border: "border-warning/30",
    iconClass: "text-warning",
  },
  error: {
    icon: XCircle,
    badge: "danger" as const,
    label: "Error",
    border: "border-danger/30",
    iconClass: "text-danger",
  },
};

function formatReglaNombre(regla: string): string {
  return regla
    .replace(/^validar/, "Validar ")
    .replace(/([A-Z])/g, " $1")
    .trim();
}

function ReglaItem({ resultado }: { resultado: ReglaValidacion }) {
  const config = ESTADO_CONFIG[resultado.estado];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 animate-fade-in transition-colors",
        config.border
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconClass)} />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{formatReglaNombre(resultado.regla)}</p>
              <Badge variant={config.badge}>{config.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{resultado.mensaje}</p>
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Recomendación</p>
              <p className="text-sm">{resultado.recomendacion}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ValidationResult({ summary, className }: ValidationResultProps) {
  const riesgoConfig = RIESGO_CONFIG[summary.riesgo];

  return (
    <Card className={cn("animate-fade-in", className)}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Motor de Validación Tributaria
            </CardTitle>
            <CardDescription className="mt-1">
              Resultado del análisis de reglas formales del comprobante
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums">{summary.score}</p>
              <p className="text-xs text-muted-foreground">/ 100</p>
            </div>
            <Badge variant={riesgoConfig.variant} className="text-sm px-3 py-1">
              {riesgoConfig.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Score de cumplimiento</span>
            <span>{summary.score}%</span>
          </div>
          <Progress value={summary.score} className="h-2" />
        </div>

        <Separator />

        <div className="space-y-1">
          <p className="text-sm font-medium">
            Validaciones ({summary.resultados.length})
          </p>
          <p className="text-xs text-muted-foreground">
            Detalle de cada regla aplicada al comprobante
          </p>
        </div>

        <div className="space-y-3">
          {summary.resultados.map((resultado) => (
            <ReglaItem key={resultado.regla} resultado={resultado} />
          ))}
        </div>

        {summary.resultados.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay resultados de validación disponibles.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
