"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ValidationSteps } from "@/components/validation/validation-steps";
import { useValidation } from "@/hooks/use-validation";
import type { SubstantialAnswer } from "@/types";
import { cn } from "@/utils";
import { toast } from "sonner";

const ANSWERS: { value: SubstantialAnswer; label: string }[] = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
  { value: "no_se", label: "No lo sé" },
];

export default function RequisitosSustancialesPage() {
  const router = useRouter();
  const { state, updateSubstantialAnswer, setStep } = useValidation();
  const [explaining, setExplaining] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [loadingExplain, setLoadingExplain] = useState(false);

  const requirements = state.substantialRequirements ?? [];

  const handleExplain = async (id: string) => {
    setExplaining(id);
    setLoadingExplain(true);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementId: id }),
      });
      const data = await res.json();
      setExplanation(data.explanation);
    } catch {
      toast.error("Error al obtener explicación");
    } finally {
      setLoadingExplain(false);
    }
  };

  const allAnswered = requirements.every((r) => r.respuesta !== null);

  const handleContinue = () => {
    if (!allAnswered) {
      toast.error("Responde todas las preguntas antes de continuar");
      return;
    }
    setStep(5);
    router.push("/validacion/riesgo");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Requisitos Sustanciales</h1>
        <p className="text-muted-foreground text-sm">Responde las preguntas para evaluar el riesgo tributario</p>
      </div>

      <ValidationSteps currentStep={4} />

      <div className="space-y-4">
        {requirements.map((req, index) => (
          <Card key={req.id} className="animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-start gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                  {index + 1}
                </span>
                {req.pregunta}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {ANSWERS.map((answer) => (
                  <Button
                    key={answer.value}
                    variant={req.respuesta === answer.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSubstantialAnswer(req.id, answer.value)}
                    className={cn(
                      req.respuesta === answer.value && answer.value === "si" && "bg-secondary hover:bg-secondary/90",
                      req.respuesta === answer.value && answer.value === "no" && "bg-destructive hover:bg-destructive/90",
                      req.respuesta === answer.value && answer.value === "no_se" && "bg-warning text-warning-foreground hover:bg-warning/90"
                    )}
                  >
                    {answer.label}
                  </Button>
                ))}
              </div>

              {req.respuesta === "no_se" && (
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" onClick={() => handleExplain(req.id)} className="text-primary">
                    <HelpCircle className="h-4 w-4" /> Explícame
                  </Button>
                  {explaining === req.id && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                      {loadingExplain ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Generando explicación...
                        </div>
                      ) : (
                        explanation
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/validacion/formales")}>
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button onClick={handleContinue} disabled={!allAnswered}>
          Calcular Riesgo <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
