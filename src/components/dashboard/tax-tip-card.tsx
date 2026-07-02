"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";
import { MOCK_TAX_TIPS } from "@/services/mock-data";

export function TaxTipCard() {
  const tip = MOCK_TAX_TIPS[0];

  return (
    <Card className="border-l-4 border-l-secondary animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-5 w-5 text-secondary" />
          Consejo Tributario del Día
          <Badge variant="secondary" className="ml-auto text-[10px]">Hoy</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h4 className="font-semibold text-sm mb-1">{tip.titulo}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{tip.contenido}</p>
      </CardContent>
    </Card>
  );
}
