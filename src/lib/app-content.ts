/**
 * Contenido estático de la aplicación (tips, notificaciones, plantillas).
 * No incluye datos mock de RUC ni respuestas ficticias de APIs.
 */
import type { Notification, SubstantialRequirement, TaxTip } from "@/types";

export const TAX_TIPS: TaxTip[] = [
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

export const APP_NOTIFICATIONS: Notification[] = [
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

export function createSubstantialRequirements(): SubstantialRequirement[] {
  return [
    {
      id: "actividad_empresa",
      pregunta: "¿La compra está relacionada con la actividad de la empresa?",
      respuesta: null,
    },
    {
      id: "costo_gasto",
      pregunta: "¿La compra constituye costo o gasto para efectos tributarios?",
      respuesta: null,
    },
    {
      id: "operacion_real",
      pregunta: "¿La operación realmente ocurrió?",
      respuesta: null,
    },
    {
      id: "sustento_documental",
      pregunta: "¿Existe sustento documental?",
      respuesta: null,
    },
  ];
}
