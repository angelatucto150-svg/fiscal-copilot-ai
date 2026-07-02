"use client";

import { useRouter } from "next/navigation";
import { Check, X, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ValidationSteps } from "@/components/validation/validation-steps";
import { useValidation } from "@/hooks/use-validation";
import { createMockSubstantialRequirements } from "@/services/mock-data";
import { cn } from "@/utils";

export default function RequisitosFormalesPage() {
  const router = useRouter();
  const { state, setSubstantialRequirements, setStep } = useValidation();
  const requirements = state.formalRequirements ?? [];

  const handleContinue = () => {
    if (!state.substantialRequirements) {
      setSubstantialRequirements(createMockSubstantialRequirements());
    }
    setStep(4);
    router.push("/validacion/sustanciales");
  };

  const allPassed = requirements.every((r) => r.cumple);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Requisitos Formales</h1>
        <p className="text-muted-foreground text-sm">Evaluación automática de cumplimiento formal</p>
      </div>

      <ValidationSteps currentStep={3} />

      <div className="space-y-3">
        {requirements.map((req) => (
          <Card key={req.id} className={cn("animate-fade-in", req.cumple ? "border-success/30" : "border-danger/30")}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full mt-0.5", req.cumple ? "bg-success/10" : "bg-danger/10")}>
                    {req.cumple ? <Check className="h-5 w-5 text-success" /> : <X className="h-5 w-5 text-danger" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{req.nombre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{req.descripcion}</p>
                    {req.observaciones && (
                      <p className="text-xs text-warning mt-1">{req.observaciones}</p>
                    )}
                  </div>
                </div>
                <Badge variant={req.cumple ? "success" : "danger"} className="shrink-0">
                  {req.cumple ? "Cumple" : "No cumple"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={cn(allPassed ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20")}>
        <CardContent className="p-4 text-center">
          <p className="text-sm font-medium">
            {allPassed
              ? "Todos los requisitos formales han sido cumplidos"
              : "Algunos requisitos formales requieren atención"}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/validacion/automaticas")}>
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button onClick={handleContinue}>
          Continuar <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
