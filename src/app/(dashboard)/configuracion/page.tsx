"use client";

import { Moon, Sun, Bell, Shield, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function ConfiguracionPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm">Personaliza tu experiencia en Fiscal Copilot AI</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Apariencia
          </CardTitle>
          <CardDescription>Configura el tema de la aplicación</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode">Modo oscuro</Label>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" /> Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Validaciones completadas</Label>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label>Consejos tributarios</Label>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label>Alertas de riesgo alto</Label>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" /> Integraciones
          </CardTitle>
          <CardDescription>Estado de servicios conectados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Supabase</span>
            <Badge variant={isSupabaseConfigured ? "success" : "warning"}>
              {isSupabaseConfigured ? "Conectado" : "Local Storage"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">OpenAI API</span>
            <Badge variant="outline">Preparado</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">SUNAT API</span>
            <Badge variant="outline">Mock (Simulado)</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">OCR / QR Scanner</span>
            <Badge variant="outline">Preparado</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fiscal Copilot AI no reemplaza a SUNAT. Es una herramienta de apoyo para validación preventiva
            del crédito fiscal antes del registro contable.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
