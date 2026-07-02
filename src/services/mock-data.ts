import type {
  AutomaticValidation,
  Comprobante,
  FormalRequirement,
  SubstantialRequirement,
  ValidationRecord,
  DashboardStats,
  ReportData,
  TaxTip,
  Notification,
  UserProfile,
} from "@/types";
import { generateId } from "@/utils";

export const MOCK_USER: UserProfile = {
  id: "user-demo-001",
  email: "demo@fiscalcopilot.pe",
  fullName: "María González",
  company: "Consultores Tributarios SAC",
  ruc: "20123456789",
  role: "contador",
  createdAt: "2025-01-15T10:00:00Z",
};

export const MOCK_RUC_DATABASE: Record<
  string,
  { razonSocial: string; activo: boolean; habido: boolean; emisorElectronico: boolean }
> = {
  "20100070970": {
    razonSocial: "SUPERMERCADOS PERUANOS S.A.",
    activo: true,
    habido: true,
    emisorElectronico: true,
  },
  "20512345678": {
    razonSocial: "DISTRIBUIDORA LIMA NORTE EIRL",
    activo: true,
    habido: true,
    emisorElectronico: true,
  },
  "20456789012": {
    razonSocial: "SERVICIOS GENERALES DEL SUR SAC",
    activo: true,
    habido: false,
    emisorElectronico: false,
  },
  "20987654321": {
    razonSocial: "COMERCIAL INACTIVA SAC",
    activo: false,
    habido: false,
    emisorElectronico: false,
  },
  "20654321098": {
    razonSocial: "TECNOLOGIA EMPRESARIAL PERU SAC",
    activo: true,
    habido: true,
    emisorElectronico: true,
  },
};

export const MOCK_VALIDATIONS: ValidationRecord[] = [
  {
    id: "val-001",
    userId: "user-demo-001",
    comprobante: {
      rucProveedor: "20100070970",
      razonSocial: "SUPERMERCADOS PERUANOS S.A.",
      tipoComprobante: "01",
      serie: "F001",
      numero: "00012345",
      fecha: "2025-06-15",
      importe: 1180.0,
      igv: 180.0,
      moneda: "PEN",
      inputMethod: "manual",
    },
    automaticValidation: {
      rucActivo: true,
      rucHabido: true,
      comprobanteValido: true,
      emisorElectronico: true,
      coincidenciaDatos: true,
      observaciones: [],
    },
    formalRequirements: [
      { id: "f1", nombre: "Comprobante válido", descripcion: "Comprobante de pago válido", cumple: true },
      { id: "f2", nombre: "Información completa", descripcion: "Datos completos del comprobante", cumple: true },
      { id: "f3", nombre: "Registro correcto", descripcion: "Registro en periodo correcto", cumple: true },
      { id: "f4", nombre: "Requisitos legales", descripcion: "Cumple requisitos legales", cumple: true },
    ],
    substantialRequirements: [
      { id: "actividad_empresa", pregunta: "¿La compra está relacionada con la actividad de la empresa?", respuesta: "si" },
      { id: "costo_gasto", pregunta: "¿La compra constituye costo o gasto?", respuesta: "si" },
      { id: "operacion_real", pregunta: "¿La operación realmente ocurrió?", respuesta: "si" },
      { id: "sustento_documental", pregunta: "¿Existe sustento documental?", respuesta: "si" },
    ],
    riskAssessment: {
      puntaje: 95,
      nivel: "bajo",
      semaforo: "verde",
      etiqueta: "Riesgo Bajo",
      factores: ["RUC activo y habido", "Comprobante válido", "Requisitos sustanciales cumplidos"],
    },
    aiRecommendation: {
      resumen: "El comprobante presenta bajo riesgo tributario. Puede proceder con el registro contable.",
      recomendaciones: ["Registrar en el periodo correspondiente", "Archivar sustento documental"],
      documentosFaltantes: [],
    },
    status: "aprobado",
    createdAt: "2025-06-15T14:30:00Z",
    updatedAt: "2025-06-15T14:35:00Z",
  },
  {
    id: "val-002",
    userId: "user-demo-001",
    comprobante: {
      rucProveedor: "20456789012",
      razonSocial: "SERVICIOS GENERALES DEL SUR SAC",
      tipoComprobante: "01",
      serie: "E001",
      numero: "00098765",
      fecha: "2025-06-10",
      importe: 5900.0,
      igv: 900.0,
      moneda: "PEN",
      inputMethod: "xml",
    },
    automaticValidation: {
      rucActivo: true,
      rucHabido: false,
      comprobanteValido: true,
      emisorElectronico: false,
      coincidenciaDatos: true,
      observaciones: ["RUC no habido", "Proveedor no es emisor electrónico"],
    },
    formalRequirements: [
      { id: "f1", nombre: "Comprobante válido", descripcion: "Comprobante de pago válido", cumple: true },
      { id: "f2", nombre: "Información completa", descripcion: "Datos completos", cumple: true },
      { id: "f3", nombre: "Registro correcto", descripcion: "Periodo correcto", cumple: false, observaciones: "Verificar periodo de emisión" },
      { id: "f4", nombre: "Requisitos legales", descripcion: "Requisitos legales", cumple: false, observaciones: "RUC no habido al momento de emisión" },
    ],
    substantialRequirements: [
      { id: "actividad_empresa", pregunta: "¿La compra está relacionada con la actividad de la empresa?", respuesta: "si" },
      { id: "costo_gasto", pregunta: "¿La compra constituye costo o gasto?", respuesta: "no_se" },
      { id: "operacion_real", pregunta: "¿La operación realmente ocurrió?", respuesta: "si" },
      { id: "sustento_documental", pregunta: "¿Existe sustento documental?", respuesta: "no" },
    ],
    riskAssessment: {
      puntaje: 42,
      nivel: "alto",
      semaforo: "rojo",
      etiqueta: "Alto Riesgo",
      factores: ["RUC no habido", "Sin sustento documental", "Incertidumbre en clasificación contable"],
    },
    aiRecommendation: {
      resumen: "Este comprobante presenta alto riesgo. Se recomienda no registrar el crédito fiscal hasta resolver las observaciones.",
      recomendaciones: [
        "Verificar estado del RUC en SUNAT",
        "Solicitar sustento documental al proveedor",
        "Consultar con el área contable antes de registrar",
      ],
      documentosFaltantes: ["Orden de compra", "Guía de remisión", "Acta de conformidad"],
    },
    status: "rechazado",
    createdAt: "2025-06-10T09:15:00Z",
    updatedAt: "2025-06-10T09:20:00Z",
  },
  {
    id: "val-003",
    userId: "user-demo-001",
    comprobante: {
      rucProveedor: "20512345678",
      razonSocial: "DISTRIBUIDORA LIMA NORTE EIRL",
      tipoComprobante: "01",
      serie: "F001",
      numero: "00055443",
      fecha: "2025-06-20",
      importe: 2360.0,
      igv: 360.0,
      moneda: "PEN",
      inputMethod: "pdf",
    },
    automaticValidation: {
      rucActivo: true,
      rucHabido: true,
      comprobanteValido: true,
      emisorElectronico: true,
      coincidenciaDatos: true,
      observaciones: [],
    },
    formalRequirements: [
      { id: "f1", nombre: "Comprobante válido", descripcion: "Comprobante válido", cumple: true },
      { id: "f2", nombre: "Información completa", descripcion: "Información completa", cumple: true },
      { id: "f3", nombre: "Registro correcto", descripcion: "Registro correcto", cumple: true },
      { id: "f4", nombre: "Requisitos legales", descripcion: "Requisitos legales", cumple: true },
    ],
    substantialRequirements: [
      { id: "actividad_empresa", pregunta: "¿La compra está relacionada con la actividad de la empresa?", respuesta: "si" },
      { id: "costo_gasto", pregunta: "¿La compra constituye costo o gasto?", respuesta: "si" },
      { id: "operacion_real", pregunta: "¿La operación realmente ocurrió?", respuesta: "no_se" },
      { id: "sustento_documental", pregunta: "¿Existe sustento documental?", respuesta: "si" },
    ],
    riskAssessment: {
      puntaje: 68,
      nivel: "medio",
      semaforo: "amarillo",
      etiqueta: "Revisar documentación",
      factores: ["Incertidumbre sobre operación real", "Resto de validaciones correctas"],
    },
    aiRecommendation: {
      resumen: "Riesgo moderado. Se recomienda verificar la operación real antes de usar el crédito fiscal.",
      recomendaciones: ["Confirmar recepción del bien o servicio", "Documentar evidencia de la operación"],
      documentosFaltantes: ["Acta de conformidad del servicio"],
    },
    status: "observado",
    createdAt: "2025-06-20T16:45:00Z",
    updatedAt: "2025-06-20T16:50:00Z",
  },
];

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalValidaciones: 47,
  riesgoPromedio: 72,
  validacionesMes: 12,
  observacionesPendientes: 3,
};

export const MOCK_REPORT_DATA: ReportData = {
  validacionesPorMes: [
    { mes: "Ene", cantidad: 8 },
    { mes: "Feb", cantidad: 12 },
    { mes: "Mar", cantidad: 15 },
    { mes: "Abr", cantidad: 10 },
    { mes: "May", cantidad: 18 },
    { mes: "Jun", cantidad: 12 },
  ],
  erroresFrecuentes: [
    { error: "RUC no habido", cantidad: 8 },
    { error: "Sin sustento documental", cantidad: 6 },
    { error: "Comprobante fuera de periodo", cantidad: 4 },
    { error: "Datos no coinciden", cantidad: 3 },
    { error: "No emisor electrónico", cantidad: 2 },
  ],
  proveedoresObservados: [
    { ruc: "20456789012", razonSocial: "SERVICIOS GENERALES DEL SUR SAC", cantidad: 5 },
    { ruc: "20987654321", razonSocial: "COMERCIAL INACTIVA SAC", cantidad: 3 },
    { ruc: "20123456789", razonSocial: "PROVEEDOR GENERICO SAC", cantidad: 2 },
  ],
  riesgoPromedioPorMes: [
    { mes: "Ene", promedio: 78 },
    { mes: "Feb", promedio: 75 },
    { mes: "Mar", promedio: 82 },
    { mes: "Abr", promedio: 70 },
    { mes: "May", promedio: 68 },
    { mes: "Jun", promedio: 72 },
  ],
};

export const MOCK_TAX_TIPS: TaxTip[] = [
  {
    id: "tip-001",
    titulo: "Verifica el estado del RUC antes de registrar",
    contenido:
      "Antes de usar un comprobante como crédito fiscal, confirma que el RUC del proveedor esté activo y habido en la fecha de emisión. Un RUC no habido puede invalidar el crédito.",
    fecha: new Date().toISOString(),
  },
  {
    id: "tip-002",
    titulo: "Conserva el sustento documental",
    contenido:
      "Además del comprobante de pago, mantén ordenes de compra, guías de remisión y contratos. SUNAT puede solicitarlos en una fiscalización.",
    fecha: new Date().toISOString(),
  },
  {
    id: "tip-003",
    titulo: "Plazo de registro del crédito fiscal",
    contenido:
      "El crédito fiscal debe registrarse en el mismo periodo tributario de la emisión del comprobante o en los periodos siguientes según el régimen aplicable.",
    fecha: new Date().toISOString(),
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-001",
    title: "Validación completada",
    message: "La validación F001-00055443 fue procesada con riesgo moderado.",
    type: "warning",
    read: false,
    createdAt: "2025-06-20T16:50:00Z",
  },
  {
    id: "notif-002",
    title: "Nuevo consejo tributario",
    message: "Revisa el consejo del día sobre verificación de RUC.",
    type: "info",
    read: false,
    createdAt: "2025-06-20T08:00:00Z",
  },
  {
    id: "notif-003",
    title: "Validación aprobada",
    message: "El comprobante F001-00012345 fue aprobado con riesgo bajo.",
    type: "success",
    read: true,
    createdAt: "2025-06-15T14:35:00Z",
  },
];

export function getMockRucData(ruc: string) {
  return (
    MOCK_RUC_DATABASE[ruc] ?? {
      razonSocial: "PROVEEDOR NO REGISTRADO EN MOCK",
      activo: Math.random() > 0.3,
      habido: Math.random() > 0.4,
      emisorElectronico: Math.random() > 0.5,
    }
  );
}

export function createMockFormalRequirements(): FormalRequirement[] {
  return [
    {
      id: "f1",
      nombre: "Comprobante válido",
      descripcion: "El comprobante cumple con los requisitos de validez formal",
      cumple: true,
    },
    {
      id: "f2",
      nombre: "Información completa",
      descripcion: "Todos los campos obligatorios están completos",
      cumple: true,
    },
    {
      id: "f3",
      nombre: "Registro correcto",
      descripcion: "El comprobante puede registrarse en el periodo tributario correspondiente",
      cumple: true,
    },
    {
      id: "f4",
      nombre: "Cumplimiento de requisitos legales",
      descripcion: "Cumple con la normativa tributaria vigente",
      cumple: true,
    },
  ];
}

export function createMockSubstantialRequirements(): SubstantialRequirement[] {
  return [
    { id: "actividad_empresa", pregunta: "¿La compra está relacionada con la actividad de la empresa?", respuesta: null },
    { id: "costo_gasto", pregunta: "¿La compra constituye costo o gasto para efectos tributarios?", respuesta: null },
    { id: "operacion_real", pregunta: "¿La operación realmente ocurrió?", respuesta: null },
    { id: "sustento_documental", pregunta: "¿Existe sustento documental?", respuesta: null },
  ];
}

export function createEmptyAutomaticValidation(): AutomaticValidation {
  return {
    rucActivo: false,
    rucHabido: false,
    comprobanteValido: false,
    emisorElectronico: false,
    coincidenciaDatos: false,
    observaciones: [],
  };
}

export function createSampleComprobante(): Comprobante {
  return {
    id: generateId(),
    rucProveedor: "20654321098",
    razonSocial: "TECNOLOGIA EMPRESARIAL PERU SAC",
    tipoComprobante: "01",
    serie: "F001",
    numero: "00000123",
    fecha: new Date().toISOString().split("T")[0],
    importe: 1180,
    igv: 180,
    moneda: "PEN",
    inputMethod: "manual",
  };
}
