"use client";

import { VALIDATION_STEPS } from "@/lib/constants";
import { cn } from "@/utils";
import { Check } from "lucide-react";

interface ValidationStepsProps {
  currentStep: number;
}

export function ValidationSteps({ currentStep }: ValidationStepsProps) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center justify-between min-w-[600px] px-2">
        {VALIDATION_STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
                    isCompleted && "bg-secondary border-secondary text-white",
                    isCurrent && "border-primary bg-primary text-primary-foreground shadow-md scale-110",
                    !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span
                  className={cn(
                    "mt-1.5 text-[10px] font-medium text-center max-w-[70px]",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < VALIDATION_STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    isCompleted ? "bg-secondary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
