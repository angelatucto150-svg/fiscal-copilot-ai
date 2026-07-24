"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileDown, Check, X, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RiskGauge, TrafficLight } from "@/components/validation/risk-gauge";
import { FiscalCopilotChat } from "@/components/validation/fiscal-copilot-chat";
import { getValidationById } from "@/services/validation.service";
import { generateValidationPDF } from "@/services/pdf.service";
import type { ValidationRecord } from "@/types";
import { formatCurrency, formatDate, getStatusColor, cn } from "@/utils";
import { COMPROBANTE_TIPOS } from "@/types";
import { useValidation } from "@/hooks/use-validation";
import { toast } from "sonner";

export default function ResultadoPage() {
  const params = useParams();
  const router = useRouter();
  const { resetWizard } = useValidation();
  const [validation, setValidation] = useState<ValidationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    getValidationById(id).then((data) => {
      setValidation(data);
      setLoading(false);
    });
  }, [params.id]);

  const handleGeneratePDF = async () => {
    if (!validation) return;
    setGeneratingPdf(true);
    try {
      await generateValidationPDF(validation);
      toast.success("Reporte PDF generado");
    } catch {
      toast.error("Error al generar PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleNewValidation = () => {
    resetWizard();
    router.push("/validacion/nueva");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Validación no encontrada</p>
        <Button className="mt-4" onClick={() => router.push("/historial")}>Ir al historial</Button>
      </div>
    );
  }

  const v = validation;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Resultado Final</h1>
          <p className="text-muted-foreground text-sm">
            {v.comprobante.serie}-{v.comprobante.numero} · {formatDate(v.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGeneratePDF} disabled={generatingPdf}>
            {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Generar Reporte PDF
          </Button>
          <Button onClick={handleNewValidation}>
            <RotateCcw className="h-4 w-4" /> Nueva Validación
          </Button>
        </div>
      </div>

      <Card className="animate-fade-in">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <Badge className={cn("mb-2", getStatusColor(v.status))}>{v.status.toUpperCase()}</Badge>
              <h2 className="text-lg font-semibold">{v.comprobante.razonSocial}</h2>
              <p className="text-sm text-muted-foreground">
                RUC: {v.comprobante.rucProveedor} · {COMPROBANTE_TIPOS[v.comprobante.tipoComprobante]}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(v.comprobante.importe, v.comprobante.moneda)} · IGV: {formatCurrency(v.comprobante.igv, v.comprobante.moneda)}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <RiskGauge score={v.riskAssessment.puntaje} label={v.riskAssessment.etiqueta} />
              <TrafficLight semaforo={v.riskAssessment.semaforo} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Validaciones Realizadas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "RUC Activo", ok: v.automaticValidation.rucActivo },
              { label: "RUC Habido", ok: v.automaticValidation.rucHabido },
              { label: "Comprobante Válido", ok: v.automaticValidation.comprobanteValido },
              { label: "Emisor Electrónico", ok: v.automaticValidation.emisorElectronico },
              { label: "Coincidencia de Datos", ok: v.automaticValidation.coincidenciaDatos },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span>{item.label}</span>
                {item.ok ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-danger" />}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Requisitos Formales</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {v.formalRequirements.map((req) => (
              <div key={req.id} className="flex items-center justify-between text-sm">
                <span>{req.nombre}</span>
                <Badge variant={req.cumple ? "success" : "danger"}>{req.cumple ? "Cumple" : "No cumple"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Requisitos Sustanciales</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {v.substantialRequirements.map((req) => (
              <div key={req.id} className="text-sm">
                <p className="text-muted-foreground text-xs mb-1">{req.pregunta}</p>
                <Badge variant={req.respuesta === "si" ? "success" : req.respuesta === "no" ? "danger" : "warning"}>
                  {req.respuesta === "si" ? "Sí" : req.respuesta === "no" ? "No" : "No lo sé"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader><CardTitle className="text-base">Recomendación del Copilot</CardTitle></CardHeader>
          <CardContent className="space-y-3">
          <p className="text-sm">
            {v.aiRecommendation?.resumen ?? "Sin recomendación disponible"}
          </p>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Recomendaciones:</p>
              <ul className="space-y-1">
              {(v.aiRecommendation?.recomendaciones ?? []).map((rec, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary font-bold">{i + 1}.</span> {rec}
                  </li>
                ))}
              </ul>
            </div>
            {(v.aiRecommendation?.documentosFaltantes ?? []).length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Documentos faltantes:</p>
                  <div className="flex flex-wrap gap-1">
                  {(v.aiRecommendation?.documentosFaltantes ?? []).map((doc) => (
                      <Badge key={doc} variant="outline">{doc}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <FiscalCopilotChat validation={validation} />
    </div>
  );
}
