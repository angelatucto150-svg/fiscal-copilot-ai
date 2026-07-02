"use client";

import { useEffect, useState } from "react";
import type { ValidationRecord, DashboardStats, ReportData } from "@/types";
import { getValidations, getDashboardStats, getReportData } from "@/services/validation.service";

export function useValidations() {
  const [validations, setValidations] = useState<ValidationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getValidations().then((data) => {
      setValidations(data);
      setLoading(false);
    });
  }, []);

  const refresh = () => {
    setLoading(true);
    getValidations().then((data) => {
      setValidations(data);
      setLoading(false);
    });
  };

  return { validations, loading, refresh };
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  return { stats, loading };
}

export function useReportData() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReportData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
