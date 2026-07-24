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

const TRAFFIC_LIGHTS: RiskTrafficLight[] = ["rojo", "amarillo", "verde"];

const TRAFFIC_LABELS: Record<RiskTrafficLight, string> = {
  verde: "RIESGO BAJO",
  amarillo: "RIESGO MODERADO",
  rojo: "RIESGO ALTO",
};

const TRAFFIC_LABEL_COLOR: Record<RiskTrafficLight, string> = {
  verde: "text-green-600 dark:text-green-400",
  amarillo: "text-amber-600 dark:text-amber-400",
  rojo: "text-red-600 dark:text-red-400",
};

export function TrafficLight({ semaforo, className }: TrafficLightProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 p-4 rounded-2xl border bg-card shadow-sm",
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Semáforo de Riesgo
      </p>

      <div className="flex items-stretch gap-2">
        {/* Cuerpo del semáforo */}
        <div className="relative flex flex-col items-center gap-3 rounded-2xl bg-zinc-900 dark:bg-zinc-950 p-3.5 shadow-inner border border-zinc-700/80">
          <div className="pointer-events-none absolute inset-x-2 top-2 h-8 rounded-full bg-gradient-to-b from-white/10 to-transparent" />

          {TRAFFIC_LIGHTS.map((light) => {
            const isActive = light === semaforo;

            return (
              <div
                key={light}
                className={cn(
                  "relative h-10 w-10 rounded-full transition-all duration-500 ease-out",
                  !isActive &&
                    "bg-zinc-800 border-2 border-zinc-600/60 opacity-45 scale-95",
                  isActive &&
                    light === "rojo" &&
                    "bg-red-500 border-2 border-red-300 scale-105 shadow-[0_0_16px_4px_rgba(239,68,68,0.75),0_0_32px_8px_rgba(239,68,68,0.35)]",
                  isActive &&
                    light === "amarillo" &&
                    "bg-amber-400 border-2 border-amber-200 scale-105 shadow-[0_0_16px_4px_rgba(251,191,36,0.8),0_0_32px_8px_rgba(251,191,36,0.35)]",
                  isActive &&
                    light === "verde" &&
                    "bg-emerald-500 border-2 border-emerald-300 scale-105 shadow-[0_0_16px_4px_rgba(16,185,129,0.75),0_0_32px_8px_rgba(16,185,129,0.35)]"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1.5 left-1.5 h-3 w-3 rounded-full transition-opacity duration-500",
                    isActive ? "bg-white/50 opacity-100" : "bg-white/10 opacity-40"
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Flecha alineada fila a fila con cada foco */}
        <div className="flex flex-col justify-between py-3.5 w-5" aria-hidden>
          {TRAFFIC_LIGHTS.map((light) => {
            const isActive = light === semaforo;

            return (
              <div key={light} className="flex h-10 items-center justify-start">
                <div
                  className={cn(
                    "h-0 w-0 border-y-[7px] border-y-transparent border-r-[10px] transition-all duration-500 ease-out",
                    isActive ? "opacity-100 scale-100" : "opacity-0 scale-75",
                    isActive && light === "rojo" && "border-r-red-500",
                    isActive && light === "amarillo" && "border-r-amber-400",
                    isActive && light === "verde" && "border-r-emerald-500",
                    !isActive && "border-r-transparent"
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>

      <p
        className={cn(
          "text-xs font-bold tracking-widest transition-colors duration-500",
          TRAFFIC_LABEL_COLOR[semaforo]
        )}
      >
        {TRAFFIC_LABELS[semaforo]}
      </p>
    </div>
  );
}
