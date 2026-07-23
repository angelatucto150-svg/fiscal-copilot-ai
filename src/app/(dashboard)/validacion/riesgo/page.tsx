"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ValidationSteps } from "@/components/validation/validation-steps";
import { RiskGauge, TrafficLight } from "@/components/validation/risk-gauge";
import { useValidation } from "@/hooks/use-validation";
import { useAuth } from "@/hooks/use-auth"; // <-- AGREGA ESTA LÍNEA
import { calculateRiskScore, generateAIRecommendation } from "@/services/risk.service";
import { saveValidation } from "@/services/validation.service";
import type { Comprobante, RiskAssessment, AIRecommendation } from "@/types";
import { toast } from "sonner";

export default function RiesgoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { state, setValidationId, setStep } = useValidation();
  const [risk, setRisk] = useState<RiskAssessment | null>(state.riskAssessment ?? null);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(state.aiRecommendation ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!state.automaticValidation || !state.formalRequirements || !state.substantialRequirements) {
      router.push("/validacion/nueva");
      return;
    }

    const assessment = calculateRiskScore(
      state.automaticValidation,
      state.formalRequirements,
      state.substantialRequirements
    );
    const aiRec = generateAIRecommendation(
      assessment,
      state.automaticValidation,
      state.substantialRequirements
    );
    setRisk(assessment);
    setRecommendation(aiRec);
  }, [state, router]);

  const handleFinish = async () => {
    if (!state.automaticValidation || !state.formalRequirements || !state.substantialRequirements || !risk) return;

    setSaving(true);
    try {
      const record = await saveValidation(
        {
          comprobante: {
            ...state.comprobante,
            inputMethod: state.inputMethod,
          } as Comprobante,
          automaticValidation: state.automaticValidation,
          formalRequirements: state.formalRequirements,
          substantialRequirements: state.substantialRequirements,
        },
        user!.id
      );
    
      setValidationId(record.id);
      setStep(6);
      toast.success("Validación guardada correctamente");
      router.push(`/validacion/${record.id}/resultado`);
    } catch {
      toast.error("Error al guardar la validación");
    } finally {
      setSaving(false);
    } 
  };

  if (!risk) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Índice de Riesgo Tributario</h1>
        <p className="text-muted-foreground text-sm">Resultado del análisis de riesgo</p>
      </div>

      <ValidationSteps currentStep={5} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex items-center justify-center p-8 animate-fade-in">
          <RiskGauge score={risk.puntaje} label={risk.etiqueta} size="lg" />
        </Card>
        <TrafficLight semaforo={risk.semaforo} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Factores de Riesgo</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {risk.factores.map((factor, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {factor}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {recommendation && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Recomendación Preliminar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{recommendation.resumen}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/validacion/sustanciales")}>
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button onClick={handleFinish} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Ver Resultado <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}
