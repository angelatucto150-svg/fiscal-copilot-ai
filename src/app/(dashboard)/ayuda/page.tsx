"use client";

import { HelpCircle, MessageCircle, BookOpen, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccordionItem } from "@/components/shared/accordion-item";
import { FiscalCopilotChat } from "@/components/validation/fiscal-copilot-chat";

const FAQ = [
  {
    question: "¿Fiscal Copilot AI reemplaza a SUNAT?",
    answer: "No. Fiscal Copilot AI es una herramienta de apoyo que ayuda a validar preventivamente el crédito fiscal antes del registro contable. No reemplaza las consultas oficiales ante SUNAT.",
  },
  {
    question: "¿Qué es el crédito fiscal?",
    answer: "El crédito fiscal es el IGV soportado en tus compras que puedes deducir del IGV de tus ventas. Para usarlo, el comprobante debe cumplir requisitos formales y sustanciales.",
  },
  {
    question: "¿Cómo se calcula el índice de riesgo?",
    answer: "El algoritmo evalúa el estado del RUC, validez del comprobante, requisitos formales y tus respuestas a los requisitos sustanciales. El puntaje va de 0 a 100, donde 80+ es bajo riesgo, 50-79 es moderado y menos de 50 es alto riesgo.",
  },
  {
    question: "¿Qué significa RUC no habido?",
    answer: "Un RUC no habido indica que SUNAT no ha verificado la domicilio fiscal del contribuyente. Usar comprobantes de proveedores no habidos representa un riesgo tributario significativo.",
  },
  {
    question: "¿Puedo generar reportes PDF?",
    answer: "Sí, al finalizar cada validación puedes generar un reporte PDF con el resumen completo del análisis, incluyendo riesgo, recomendaciones y observaciones.",
  },
];

export default function AyudaPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Centro de Ayuda</h1>
        <p className="text-muted-foreground text-sm">Encuentra respuestas y soporte para usar Fiscal Copilot AI</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover:shadow-md transition-all cursor-pointer">
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="font-medium text-sm">Guía de uso</p>
            <p className="text-xs text-muted-foreground mt-1">Aprende a validar comprobantes</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-all cursor-pointer">
          <CardContent className="pt-6 text-center">
            <MessageCircle className="h-8 w-8 mx-auto text-secondary mb-2" />
            <p className="font-medium text-sm">Chat con Copilot</p>
            <p className="text-xs text-muted-foreground mt-1">Pregunta a la IA tributaria</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-all cursor-pointer">
          <CardContent className="pt-6 text-center">
            <Mail className="h-8 w-8 mx-auto text-warning mb-2" />
            <p className="font-medium text-sm">Contacto</p>
            <p className="text-xs text-muted-foreground mt-1">soporte@fiscalcopilot.pe</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4" /> Preguntas Frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {FAQ.map((item, i) => (
            <AccordionItem key={i} question={item.question} answer={item.answer} />
          ))}
        </CardContent>
      </Card>

      <FiscalCopilotChat />
    </div>
  );
}
