"use client";

import { cn } from "@/utils";
import type { RiskTrafficLight } from "@/types";

interface RiskGaugeProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

export function RiskGauge({ score, label, size = "md" }: RiskGaugeProps) {
  const sizes = {
    sm: { container: "w-32 h-32", text: "text-2xl", label: "text-xs" },
    md: { container: "w-44 h-44", text: "text-3xl", label: "text-sm" },
    lg: { container: "w-56 h-56", text: "text-4xl", label: "text-base" },
  };

  const s = sizes[size];
  const rotation = (score / 100) * 180 - 90;
  const color = score >= 80 ? "#16a34a" : score >= 50 ? "#eab308" : "#dc2626";

  return (
    <div className="flex flex-col items-center">
      <div className={cn("relative", s.container)}>
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 251} 251`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className={cn("font-bold", s.text)} style={{ color }}>
            {score}
          </span>
          <span className="text-muted-foreground text-xs">/ 100</span>
        </div>
        <div
          className="absolute bottom-0 left-1/2 w-1 h-16 origin-bottom transition-transform duration-700"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        >
          <div className="w-2 h-2 rounded-full bg-foreground mx-auto -mt-1" />
          <div className="w-0.5 h-14 bg-foreground mx-auto rounded-full" />
        </div>
      </div>
      <p className={cn("font-semibold mt-2", s.label)} style={{ color }}>
        {label}
      </p>
    </div>
  );
}

interface TrafficLightProps {
  semaforo: RiskTrafficLight;
  className?: string;
}

export function TrafficLight({ semaforo, className }: TrafficLightProps) {
  const lights: RiskTrafficLight[] = ["rojo", "amarillo", "verde"];

  return (
    <div className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border bg-card", className)}>
      <p className="text-xs font-medium text-muted-foreground mb-1">Semáforo de Riesgo</p>
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50">
        {lights.map((light) => (
          <div
            key={light}
            className={cn(
              "h-8 w-8 rounded-full border-2 transition-all duration-500",
              light === "rojo" && semaforo === "rojo" && "bg-red-500 border-red-600 shadow-lg shadow-red-500/50 scale-110",
              light === "amarillo" && semaforo === "amarillo" && "bg-yellow-400 border-yellow-500 shadow-lg shadow-yellow-400/50 scale-110",
              light === "verde" && semaforo === "verde" && "bg-green-500 border-green-600 shadow-lg shadow-green-500/50 scale-110",
              light !== semaforo && "bg-muted border-muted-foreground/20 opacity-40"
            )}
          />
        ))}
      </div>
    </div>
  );
}
