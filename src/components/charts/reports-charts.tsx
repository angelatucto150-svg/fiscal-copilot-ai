"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportData } from "@/types";

const COLORS = ["#2563eb", "#16a34a", "#eab308", "#dc2626", "#8b5cf6"];

interface ReportsChartsProps {
  data: ReportData;
}

export function ReportsCharts({ data }: ReportsChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-base">Validaciones por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.validacionesPorMes}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-base">Riesgo Promedio por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.riesgoPromedioPorMes}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" />
              <YAxis domain={[0, 100]} className="text-xs" />
              <Tooltip />
              <Line type="monotone" dataKey="promedio" stroke="#16a34a" strokeWidth={2} dot={{ fill: "#16a34a" }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-base">Errores Frecuentes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.erroresFrecuentes}
                dataKey="cantidad"
                nameKey="error"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ error, cantidad }) => `${cantidad}`}
              >
                {data.erroresFrecuentes.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {data.erroresFrecuentes.map((item, i) => (
              <div key={item.error} className="flex items-center gap-1 text-[10px]">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {item.error}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-base">Proveedores Observados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.proveedoresObservados.map((p) => (
              <div key={p.ruc} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">{p.razonSocial}</p>
                  <p className="text-xs text-muted-foreground">RUC: {p.ruc}</p>
                </div>
                <span className="text-lg font-bold text-warning">{p.cantidad}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
