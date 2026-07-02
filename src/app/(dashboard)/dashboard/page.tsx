"use client";

import Link from "next/link";
import { FileCheck, Plus, Shield, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaxTipCard } from "@/components/dashboard/tax-tip-card";
import { RecentValidations } from "@/components/dashboard/recent-validations";
import { FiscalCopilotChat } from "@/components/validation/fiscal-copilot-chat";
import { useValidations, useDashboardStats } from "@/hooks/use-validations";
import { APP_SLOGAN } from "@/lib/constants";

export default function DashboardPage() {
  const { validations, loading: loadingValidations } = useValidations();
  const { stats, loading: loadingStats } = useDashboardStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">{APP_SLOGAN}</p>
        </div>
        <Link href="/validacion/nueva">
          <Button size="lg" className="gradient-primary shadow-lg">
            <Plus className="h-4 w-4" /> Nueva Validación
          </Button>
        </Link>
      </div>

      <TaxTipCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Validaciones Totales"
          value={loadingStats ? "..." : stats?.totalValidaciones ?? 0}
          icon={FileCheck}
          description="Historial completo"
        />
        <StatCard
          title="Este Mes"
          value={loadingStats ? "..." : stats?.validacionesMes ?? 0}
          icon={TrendingUp}
          trend="+12% vs mes anterior"
        />
        <StatCard
          title="Riesgo Promedio"
          value={loadingStats ? "..." : `${stats?.riesgoPromedio ?? 0}/100`}
          icon={Shield}
          description="Índice general"
        />
        <StatCard
          title="Observaciones"
          value={loadingStats ? "..." : stats?.observacionesPendientes ?? 0}
          icon={AlertTriangle}
          description="Pendientes de revisión"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentValidations validations={loadingValidations ? [] : validations} />
        <FiscalCopilotChat compact />
      </div>
    </div>
  );
}
