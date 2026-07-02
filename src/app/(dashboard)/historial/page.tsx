"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, Eye, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useValidations } from "@/hooks/use-validations";
import { formatCurrency, formatDate, getStatusColor } from "@/utils";
import { cn } from "@/utils";

export default function HistorialPage() {
  const { validations, loading } = useValidations();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return validations.filter((v) => {
      const matchSearch =
        !search ||
        v.comprobante.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
        v.comprobante.rucProveedor.includes(search) ||
        v.comprobante.numero.includes(search);

      const matchRisk =
        riskFilter === "all" ||
        (riskFilter === "bajo" && v.riskAssessment.puntaje >= 80) ||
        (riskFilter === "medio" && v.riskAssessment.puntaje >= 50 && v.riskAssessment.puntaje < 80) ||
        (riskFilter === "alto" && v.riskAssessment.puntaje < 50);

      const matchStatus = statusFilter === "all" || v.status === statusFilter;

      return matchSearch && matchRisk && matchStatus;
    });
  }, [validations, search, riskFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historial de Validaciones</h1>
        <p className="text-muted-foreground text-sm">Consulta y filtra todas tus validaciones</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por proveedor, RUC o número..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Riesgo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los riesgos</SelectItem>
                <SelectItem value="bajo">Riesgo bajo</SelectItem>
                <SelectItem value="medio">Riesgo medio</SelectItem>
                <SelectItem value="alto">Riesgo alto</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="observado">Observado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => (
            <Card key={v.id} className="hover:shadow-md transition-all animate-fade-in">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{v.comprobante.razonSocial}</p>
                      <Badge className={cn("text-[10px]", getStatusColor(v.status))}>{v.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      RUC: {v.comprobante.rucProveedor} · {v.comprobante.serie}-{v.comprobante.numero}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(v.comprobante.importe, v.comprobante.moneda)} · {formatDate(v.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold">{v.riskAssessment.puntaje}</p>
                      <Badge variant={v.riskAssessment.semaforo === "verde" ? "success" : v.riskAssessment.semaforo === "amarillo" ? "warning" : "danger"}>
                        {v.riskAssessment.etiqueta}
                      </Badge>
                    </div>
                    <Link href={`/validacion/${v.id}/resultado`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" /> Ver
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                No se encontraron validaciones con los filtros aplicados
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
