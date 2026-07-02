"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ValidationRecord } from "@/types";
import { formatCurrency, formatDate, getStatusColor } from "@/utils";
import { ArrowRight } from "lucide-react";

interface RecentValidationsProps {
  validations: ValidationRecord[];
}

export function RecentValidations({ validations }: RecentValidationsProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Últimas Validaciones</CardTitle>
        <Link href="/historial">
          <Button variant="ghost" size="sm" className="text-xs">
            Ver todas <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {validations.slice(0, 5).map((v) => (
            <Link
              key={v.id}
              href={`/validacion/${v.id}/resultado`}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-all group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{v.comprobante.razonSocial}</p>
                <p className="text-xs text-muted-foreground">
                  {v.comprobante.serie}-{v.comprobante.numero} · {formatDate(v.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="text-sm font-semibold">{v.riskAssessment.puntaje}</span>
                <Badge variant={v.riskAssessment.semaforo === "verde" ? "success" : v.riskAssessment.semaforo === "amarillo" ? "warning" : "danger"}>
                  {v.riskAssessment.etiqueta}
                </Badge>
              </div>
            </Link>
          ))}
          {validations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay validaciones aún. ¡Inicia tu primera validación!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ValidationListItem({ validation: v }: { validation: ValidationRecord }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border hover:shadow-sm transition-all">
      <div>
        <p className="font-medium">{v.comprobante.razonSocial}</p>
        <p className="text-sm text-muted-foreground">
          RUC: {v.comprobante.rucProveedor} · {v.comprobante.serie}-{v.comprobante.numero}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatCurrency(v.comprobante.importe, v.comprobante.moneda)} · {formatDate(v.createdAt)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Badge className={getStatusColor(v.status)}>{v.status}</Badge>
        <Badge variant={v.riskAssessment.semaforo === "verde" ? "success" : v.riskAssessment.semaforo === "amarillo" ? "warning" : "danger"}>
          {v.riskAssessment.puntaje}/100
        </Badge>
      </div>
    </div>
  );
}
