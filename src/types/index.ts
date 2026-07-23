export type RiskLevel = "bajo" | "medio" | "alto";
export type RiskTrafficLight = "verde" | "amarillo" | "rojo";
export type ValidationStatus = "aprobado" | "observado" | "rechazado" | "pendiente";
export type SubstantialAnswer = "si" | "no" | "no_se";
export type ComprobanteTipo = "01" | "03" | "07" | "08" | "12" | "14";
export type Moneda = "PEN" | "USD";
export type InputMethod = "manual" | "qr" | "xml" | "pdf" | "imagen";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  company?: string;
  ruc?: string;
  role: "contador" | "auxiliar" | "tributario" | "empresa" | "contribuyente";
  avatarUrl?: string;
  createdAt: string;
}

export interface Comprobante {
  id?: string;
  rucProveedor: string;
  razonSocial: string;
  tipoComprobante: ComprobanteTipo;
  serie: string;
  numero: string;
  fecha: string;
  importe: number;
  igv: number;
  moneda: Moneda;
  adjuntoUrl?: string;
  inputMethod: InputMethod;
}

export interface AutomaticValidation {
  rucActivo: boolean;
  rucHabido: boolean;
  comprobanteValido: boolean;
  emisorElectronico: boolean;
  coincidenciaDatos: boolean;
  observaciones: string[];
}

export interface FormalRequirement {
  id: string;
  nombre: string;
  descripcion: string;
  cumple: boolean;
  observaciones?: string;
}

export interface SubstantialRequirement {
  id: string;
  pregunta: string;
  respuesta: SubstantialAnswer | null;
  explicacion?: string;
  ayudaContextual?: string;
}

export interface RiskAssessment {
  puntaje: number;
  nivel: RiskLevel;
  semaforo: RiskTrafficLight;
  etiqueta: string;
  factores: string[];
}

export interface AIRecommendation {
  resumen: string;
  recomendaciones: string[];
  documentosFaltantes: string[];
}

export interface ValidationRecord {
  id: string;
  userId: string;
  comprobante: Comprobante;
  automaticValidation: AutomaticValidation;
  formalRequirements: FormalRequirement[];
  substantialRequirements: SubstantialRequirement[];
  riskAssessment: RiskAssessment;
  aiRecommendation: AIRecommendation;
  status: ValidationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  validationId?: string;
}

export interface DashboardStats {
  totalValidaciones: number;
  riesgoPromedio: number;
  validacionesMes: number;
  observacionesPendientes: number;
}

export interface ReportData {
  validacionesPorMes: { mes: string; cantidad: number }[];
  erroresFrecuentes: { error: string; cantidad: number }[];
  proveedoresObservados: { ruc: string; razonSocial: string; cantidad: number }[];
  riesgoPromedioPorMes: { mes: string; promedio: number }[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  read: boolean;
  createdAt: string;
}

export interface TaxTip {
  id: string;
  titulo: string;
  contenido: string;
  fecha: string;
}

export interface ValidationWizardState {
  step: number;
  inputMethod: InputMethod;
  comprobante: Partial<Comprobante>;
  automaticValidation?: AutomaticValidation;
  formalRequirements?: FormalRequirement[];
  substantialRequirements?: SubstantialRequirement[];
  riskAssessment?: RiskAssessment;
  aiRecommendation?: AIRecommendation;
}

export const COMPROBANTE_TIPOS: Record<ComprobanteTipo, string> = {
  "01": "Factura",
  "03": "Boleta de Venta",
  "07": "Nota de Crédito",
  "08": "Nota de Débito",
  "12": "Ticket",
  "14": "Recibo por Servicios Públicos",
};

export const SUBSTANTIAL_QUESTIONS = [
  {
    id: "actividad_empresa",
    pregunta: "¿La compra está relacionada con la actividad de la empresa?",
    ayudaContextual:
      "El crédito fiscal solo procede si el gasto o costo está vinculado a la actividad económica declarada ante SUNAT. Por ejemplo, si tu empresa vende ropa, la compra de telas sí estaría relacionada; una compra personal no.",
  },
  {
    id: "costo_gasto",
    pregunta: "¿La compra constituye costo o gasto para efectos tributarios?",
    ayudaContextual:
      "No todo gasto genera crédito fiscal. Debe ser un costo o gasto necesario para la operación del negocio y estar debidamente sustentado. Gastos personales o no deducibles no generan crédito.",
  },
  {
    id: "operacion_real",
    pregunta: "¿La operación realmente ocurrió?",
    ayudaContextual:
      "La operación real significa que efectivamente recibiste el bien o servicio. Comprobantes ficticios o sin entrega real representan alto riesgo tributario y pueden derivar en multas.",
  },
  {
    id: "sustento_documental",
    pregunta: "¿Existe sustento documental?",
    ayudaContextual:
      "Además del comprobante de pago, debes contar con documentos que respalden la operación: orden de compra, guía de remisión, contrato, acta de conformidad, etc.",
  },
] as const;

export interface ValidationResult {
  regla: string;
  estado: "success" | "warning" | "error";
  mensaje: string;
  recomendacion: string;
}

export interface ValidationSummary {
  riesgo: RiskLevel;
  score: number;
  resultados: ValidationResult[];
}
