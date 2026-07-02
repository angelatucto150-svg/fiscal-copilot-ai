export const APP_NAME = "Fiscal Copilot AI";
export const APP_SLOGAN = "Valida el crédito fiscal antes del registro contable.";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/validacion/nueva", label: "Nueva Validación", icon: "FileCheck" },
  { href: "/historial", label: "Historial", icon: "History" },
  { href: "/reportes", label: "Reportes", icon: "BarChart3" },
  { href: "/ayuda", label: "Centro de Ayuda", icon: "HelpCircle" },
  { href: "/configuracion", label: "Configuración", icon: "Settings" },
] as const;

export const VALIDATION_STEPS = [
  { id: 1, label: "Comprobante", path: "comprobante" },
  { id: 2, label: "Validaciones", path: "automaticas" },
  { id: 3, label: "Formales", path: "formales" },
  { id: 4, label: "Sustanciales", path: "sustanciales" },
  { id: 5, label: "Riesgo", path: "riesgo" },
  { id: 6, label: "Resultado", path: "resultado" },
] as const;

export const DEMO_CREDENTIALS = {
  email: "demo@fiscalcopilot.pe",
  password: "demo123",
};

export const STORAGE_KEYS = {
  validations: "fiscal-copilot-validations",
  user: "fiscal-copilot-user",
  wizard: "fiscal-copilot-wizard",
  notifications: "fiscal-copilot-notifications",
  theme: "fiscal-copilot-theme",
} as const;
