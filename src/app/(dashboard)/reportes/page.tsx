"use client";

import { Loader2 } from "lucide-react";
import { ReportsCharts } from "@/components/charts/reports-charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { useReportData, useDashboardStats } from "@/hooks/use-validations";
import { FileCheck, Shield, AlertTriangle, TrendingUp } from "lucide-react";

export default function ReportesPage() {
  const { data, loading } = useReportData();
  const { stats, loading: loadingStats } = useDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-muted-foreground text-sm">Análisis y métricas de validaciones tributarias</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Validaciones" value={loadingStats ? "..." : stats?.totalValidaciones ?? 0} icon={FileCheck} />
        <StatCard title="Riesgo Promedio" value={loadingStats ? "..." : `${stats?.riesgoPromedio ?? 0}/100`} icon={Shield} />
        <StatCard title="Observaciones" value={loadingStats ? "..." : stats?.observacionesPendientes ?? 0} icon={AlertTriangle} />
        <StatCard title="Este Mes" value={loadingStats ? "..." : stats?.validacionesMes ?? 0} icon={TrendingUp} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <ReportsCharts data={data} />
      ) : null}
    </div>
  );
}
