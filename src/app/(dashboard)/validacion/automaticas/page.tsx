"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ValidationSteps } from "@/components/validation/validation-steps";
import { useValidation } from "@/hooks/use-validation";
import { validarComprobante } from "@/services/sunat.service";
import { evaluateFormalRequirements } from "@/services/validation.service";
import type { Comprobante } from "@/types";
import { toast } from "sonner";
import { cn } from "@/utils";

const VALIDATION_ITEMS = [
  { key: "rucActivo", label: "Estado del RUC", sublabel: "Activo / No activo" },
  { key: "rucHabido", label: "Condición del RUC", sublabel: "Habido / No habido" },
  { key: "comprobanteValido", label: "Validez del Comprobante", sublabel: "Válido / Inválido" },
  { key: "emisorElectronico", label: "Emisor Electrónico", sublabel: "Registrado / No registrado" },
  { key: "coincidenciaDatos", label: "Coincidencia de Datos", sublabel: "Coincide / No coincide" },
] as const;

export default function ValidacionesAutomaticasPage() {
  const router = useRouter();
  const { state, setAutomaticValidation, setFormalRequirements, setStep } = useValidation();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(state.automaticValidation);

  useEffect(() => {
    if (!state.comprobante.rucProveedor) {
      router.push("/validacion/nueva");
      return;
    }

    const runValidation = async () => {
      setLoading(true);
      try {
        const comprobante = state.comprobante as Comprobante;
        const validation = await validarComprobante(comprobante);
        setResult(validation);
        setAutomaticValidation(validation);

        const formal = evaluateFormalRequirements(validation, true);
        setFormalRequirements(formal);
      } catch {
        toast.error("Error al ejecutar validaciones");
      } finally {
        setLoading(false);
      }
    };

    if (!state.automaticValidation) {
      runValidation();
    } else {
      setResult(state.automaticValidation);
      setLoading(false);
    }
  }, [state.comprobante, state.automaticValidation, router, setAutomaticValidation, setFormalRequirements]);

  const handleContinue = () => {
    setStep(3);
    router.push("/validacion/formales");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Validaciones Automáticas</h1>
        <p className="text-muted-foreground text-sm">Consulta simulada — reemplazable por API SUNAT</p>
      </div>

      <ValidationSteps currentStep={2} />

      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Consultando datos del proveedor...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {VALIDATION_ITEMS.map((item) => {
              const passed = result?.[item.key] ?? false;
              return (
                <Card key={item.key} className={cn("transition-all animate-fade-in", passed ? "border-success/30" : "border-danger/30")}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", passed ? "bg-success/10" : "bg-danger/10")}>
                        {passed ? <Check className="h-5 w-5 text-success" /> : <X className="h-5 w-5 text-danger" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                      </div>
                    </div>
                    <Badge variant={passed ? "success" : "danger"}>{passed ? "Correcto" : "Observado"}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {result && result.observaciones.length > 0 && (
            <Card className="border-warning/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-warning">Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.observaciones.map((obs, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {obs}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/validacion/nueva")}>
              <ArrowLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button onClick={handleContinue}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
