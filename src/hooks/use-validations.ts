"use client";

import { useEffect, useState } from "react";
import type { ValidationRecord, DashboardStats, ReportData } from "@/types";
import {
  getValidations,
  getDashboardStats,
  getReportData,
} from "@/services/validation.service";
import { useAuth } from "@/hooks/use-auth";

export function useValidations() {
  const { user } = useAuth();
  const [validations, setValidations] = useState<ValidationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setValidations([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getValidations(user.id)
      .then((data) => {
        if (!cancelled) {
          setValidations(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setValidations([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const refresh = () => {
    if (!user?.id) {
      setValidations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getValidations(user.id)
      .then((data) => {
        setValidations(data);
        setLoading(false);
      })
      .catch(() => {
        setValidations([]);
        setLoading(false);
      });
  };

  return { validations, loading, refresh };
}

export function useDashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setStats({
        totalValidaciones: 0,
        riesgoPromedio: 0,
        validacionesMes: 0,
        observacionesPendientes: 0,
      });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getDashboardStats(user.id)
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats({
            totalValidaciones: 0,
            riesgoPromedio: 0,
            validacionesMes: 0,
            observacionesPendientes: 0,
          });
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { stats, loading };
}

export function useReportData() {
  const { user } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setData({
        validacionesPorMes: [],
        erroresFrecuentes: [],
        proveedoresObservados: [],
        riesgoPromedioPorMes: [],
      });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getReportData(user.id)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData({
            validacionesPorMes: [],
            erroresFrecuentes: [],
            proveedoresObservados: [],
            riesgoPromedioPorMes: [],
          });
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { data, loading };
}
