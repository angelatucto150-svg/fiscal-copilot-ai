import type {
  AutomaticValidation,
  FormalRequirement,
  SubstantialRequirement,
  RiskAssessment,
  AIRecommendation,
  ValidationStatus,
} from "@/types";
import {
  getRiskLabel,
  getRiskLevel,
  getRiskTrafficLight,
} from "@/utils";

export function calculateRiskScore(
  automatic: AutomaticValidation,
  formal: FormalRequirement[],
  substantial: SubstantialRequirement[]
): RiskAssessment {
  let puntaje = 100;
  const factores: string[] = [];

  if (!automatic.rucActivo) {
    puntaje -= 25;
    factores.push("RUC no activo");
  }
  if (!automatic.rucHabido) {
    puntaje -= 20;
    factores.push("RUC no habido");
  }
  if (!automatic.comprobanteValido) {
    puntaje -= 20;
    factores.push("Comprobante inválido");
  }
  if (!automatic.emisorElectronico) {
    puntaje -= 10;
    factores.push("No es emisor electrónico");
  }
  if (!automatic.coincidenciaDatos) {
    puntaje -= 10;
    factores.push("Datos no coinciden");
  }

  formal.forEach((req) => {
    if (!req.cumple) {
      puntaje -= 8;
      factores.push(`Requisito formal: ${req.nombre}`);
    }
  });

  substantial.forEach((req) => {
    if (req.respuesta === "no") {
      puntaje -= 15;
      factores.push(`Respuesta negativa: ${req.pregunta.slice(0, 40)}...`);
    } else if (req.respuesta === "no_se") {
      puntaje -= 8;
      factores.push(`Incertidumbre: ${req.pregunta.slice(0, 40)}...`);
    }
  });

  puntaje = Math.max(0, Math.min(100, puntaje));

  if (factores.length === 0) {
    factores.push("Todas las validaciones superadas");
  }

  return {
    puntaje,
    nivel: getRiskLevel(puntaje),
    semaforo: getRiskTrafficLight(puntaje),
    etiqueta: getRiskLabel(puntaje),
    factores,
  };
}

export function generateAIRecommendation(
  risk: RiskAssessment,
  automatic: AutomaticValidation,
  substantial: SubstantialRequirement[]
): AIRecommendation {
  const documentosFaltantes: string[] = [];
  const recomendaciones: string[] = [];

  if (!automatic.rucHabido) {
    recomendaciones.push("Verificar el estado actual del RUC en SUNAT antes de registrar");
  }
  if (!automatic.emisorElectronico) {
    recomendaciones.push("Confirmar que el comprobante cumple con los requisitos para no emisores electrónicos");
  }

  substantial.forEach((req) => {
    if (req.respuesta === "no" && req.id === "sustento_documental") {
      documentosFaltantes.push("Orden de compra", "Guía de remisión", "Contrato o acta de conformidad");
    }
    if (req.respuesta === "no_se" && req.id === "operacion_real") {
      recomendaciones.push("Confirmar con el área operativa que la entrega del bien o servicio fue real");
    }
  });

  if (risk.puntaje >= 80) {
    return {
      resumen:
        "El comprobante presenta bajo riesgo tributario. Puede proceder con el registro contable, conservando el sustento documental.",
      recomendaciones:
        recomendaciones.length > 0
          ? recomendaciones
          : ["Registrar en el periodo correspondiente", "Archivar sustento documental por el plazo legal"],
      documentosFaltantes,
    };
  }

  if (risk.puntaje >= 50) {
    return {
      resumen:
        "Riesgo moderado detectado. Se recomienda revisar las observaciones antes de registrar el crédito fiscal.",
      recomendaciones:
        recomendaciones.length > 0
          ? recomendaciones
          : ["Revisar documentación de sustento", "Consultar con el responsable tributario"],
      documentosFaltantes,
    };
  }

  return {
    resumen:
      "Alto riesgo tributario. No se recomienda registrar este comprobante como crédito fiscal hasta resolver todas las observaciones.",
    recomendaciones:
      recomendaciones.length > 0
        ? recomendaciones
        : [
            "No registrar hasta resolver observaciones",
            "Solicitar documentación adicional al proveedor",
            "Consultar con un especialista tributario",
          ],
    documentosFaltantes:
      documentosFaltantes.length > 0
        ? documentosFaltantes
        : ["Sustento documental completo", "Evidencia de operación real"],
  };
}

export function determineValidationStatus(risk: RiskAssessment): ValidationStatus {
  if (risk.puntaje >= 80) return "aprobado";
  if (risk.puntaje >= 50) return "observado";
  return "rechazado";
}

export function evaluateFormalRequirements(
  automatic: AutomaticValidation,
  comprobanteComplete: boolean
): FormalRequirement[] {
  return [
    {
      id: "f1",
      nombre: "Comprobante válido",
      descripcion: "El comprobante cumple con los requisitos de validez formal",
      cumple: automatic.comprobanteValido,
      observaciones: automatic.comprobanteValido ? undefined : "Verificar serie, número e importe",
    },
    {
      id: "f2",
      nombre: "Información completa",
      descripcion: "Todos los campos obligatorios están completos",
      cumple: comprobanteComplete,
      observaciones: comprobanteComplete ? undefined : "Complete todos los datos del comprobante",
    },
    {
      id: "f3",
      nombre: "Registro correcto",
      descripcion: "El comprobante puede registrarse en el periodo tributario correspondiente",
      cumple: automatic.rucActivo && automatic.comprobanteValido,
      observaciones:
        automatic.rucActivo && automatic.comprobanteValido
          ? undefined
          : "Verificar periodo y estado del proveedor",
    },
    {
      id: "f4",
      nombre: "Cumplimiento de requisitos legales",
      descripcion: "Cumple con la normativa tributaria vigente",
      cumple: automatic.rucActivo && automatic.rucHabido && automatic.comprobanteValido,
      observaciones:
        automatic.rucActivo && automatic.rucHabido
          ? undefined
          : "El RUC del proveedor presenta observaciones legales",
    },
  ];
}
