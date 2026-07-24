"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PenLine,
  QrCode,
  FileCode,
  FileText,
  Image,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ValidationSteps } from "@/components/validation/validation-steps";
import { ValidationResult } from "@/components/validation/ValidationResult";
import { useValidation } from "@/hooks/use-validation";
import QRScanner from "@/components/validation/QRScanner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { comprobanteSchema, type ComprobanteFormData } from "@/utils/validators";
import { COMPROBANTE_TIPOS, type InputMethod, type Comprobante, type ValidationSummary } from "@/types";
import {
  parsearQR,
  parsearXML,
  parsearPDF,
  parsearImagen,
} from "@/services/sunat.service";
import { ejecutarMotorValidacionTributaria } from "@/services/validation.service";
import { toast } from "sonner";
import { cn } from "@/utils";

const INPUT_METHODS = [
  { id: "manual" as InputMethod, label: "Ingresar manualmente", icon: PenLine, description: "Completa los datos del comprobante" },
  { id: "qr" as InputMethod, label: "Escanear QR", icon: QrCode, description: "Escanea el código QR del comprobante" },
  { id: "xml" as InputMethod, label: "Subir XML", icon: FileCode, description: "Carga el archivo XML electrónico" },
  { id: "pdf" as InputMethod, label: "Subir PDF", icon: FileText, description: "Carga el PDF del comprobante" },
  { id: "imagen" as InputMethod, label: "Subir Imagen", icon: Image, description: "Carga una foto del comprobante" },
];

export default function NuevaValidacionPage() {
  const router = useRouter();
  const { setInputMethod, setComprobante, setStep, state } = useValidation();
  const [selectedMethod, setSelectedMethod] = useState<InputMethod>(state.inputMethod);
  const [processing, setProcessing] = useState(false);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [loadingExplicacion, setLoadingExplicacion] = useState(false);
  const [explicacionIA, setExplicacionIA] = useState<string | null>(null);
  const [errorExplicacion, setErrorExplicacion] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ComprobanteFormData>({
    resolver: zodResolver(comprobanteSchema),
    defaultValues: {
      rucProveedor: state.comprobante.rucProveedor ?? "",
      razonSocial: state.comprobante.razonSocial ?? "",
      tipoComprobante: state.comprobante.tipoComprobante ?? "01",
      serie: state.comprobante.serie ?? "",
      numero: state.comprobante.numero ?? "",
      fecha: state.comprobante.fecha ?? new Date().toISOString().split("T")[0],
      importe: state.comprobante.importe ?? 0,
      igv: state.comprobante.igv ?? 0,
      moneda: state.comprobante.moneda ?? "PEN",
    },
  });

  const rucProveedor = watch("rucProveedor");
  
  const handleMethodSelect = (method: InputMethod) => {
    setSelectedMethod(method);
    setInputMethod(method);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: InputMethod) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    try {
      let data;
      switch (type) {
        case "xml":
          data = await parsearXML(file);
          break;
        case "pdf":
          data = await parsearPDF(file);
          break;
        case "imagen":
          data = await parsearImagen(file);
          break;
        default:
          return;
      }

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) setValue(key as keyof ComprobanteFormData, value as never, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      });
      toast.success("Datos extraídos correctamente (simulado)");
    } catch {
      toast.error("Error al procesar el archivo");
    } finally {
      setProcessing(false);
    }
  };


  useEffect(() => {
    const consultarRucApi = async () => {
      if (rucProveedor?.length !== 11) return;

      try {
        const response = await fetch(`/api/sunat/ruc?ruc=${rucProveedor}`);
        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "No se pudo consultar el RUC");
          return;
        }

        if (data.razonSocial) {
          setValue("razonSocial", data.razonSocial);
          toast.success("RUC validado correctamente");
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Error al consultar el RUC"
        );
      }
    };

    void consultarRucApi();
  }, [rucProveedor, setValue]);

  const onSubmit = (data: ComprobanteFormData) => {
    setComprobante({ ...data, inputMethod: selectedMethod });
    setStep(2);
    router.push("/validacion/automaticas");
  };

  const solicitarExplicacionIA = async (summary: ValidationSummary) => {
    setLoadingExplicacion(true);
    setExplicacionIA(null);
    setErrorExplicacion(false);

    try {
      const response = await fetch("/api/explicar-validacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summary),
      });

      if (!response.ok) {
        setErrorExplicacion(true);
        return;
      }

      const data = await response.json();
      setExplicacionIA(data.explicacion);
    } catch {
      setErrorExplicacion(true);
    } finally {
      setLoadingExplicacion(false);
    }
  };

  const onValidar = handleSubmit((data) => {
    const comprobante: Comprobante = {
      ...data,
      inputMethod: selectedMethod,
    };
    const summary = ejecutarMotorValidacionTributaria(comprobante);
    setValidationSummary(summary);
    setExplicacionIA(null);
    setErrorExplicacion(false);
    setLoadingExplicacion(true);
    void solicitarExplicacionIA(summary);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nueva Validación</h1>
        <p className="text-muted-foreground text-sm">Ingresa o carga los datos del comprobante</p>
      </div>

      <ValidationSteps currentStep={1} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {INPUT_METHODS.map((method) => {
          const Icon = method.icon;
          return (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className={cn(
                "flex flex-col items-start p-4 rounded-xl border text-left transition-all hover:shadow-md",
                selectedMethod === method.id ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20" : "hover:border-primary/30"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-2", selectedMethod === method.id ? "text-primary" : "text-muted-foreground")} />
              <span className="font-medium text-sm">{method.label}</span>
              <span className="text-xs text-muted-foreground mt-1">{method.description}</span>
            </button>
          );
        })}
      </div>

      {selectedMethod === "qr" && (
  <Card>
    <CardContent className="pt-6">
    <QRScanner
  onScanSuccess={async (decodedText) => {
    try {
      const data = parsearQR(decodedText);

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          setValue(key as keyof ComprobanteFormData, value as never);
        }
      });

      if (data.rucProveedor && data.rucProveedor.length === 11) {
        const response = await fetch(`/api/sunat/ruc?ruc=${data.rucProveedor}`);
        const rucData = await response.json();
        if (!response.ok) {
          toast.error(rucData.error || "No se pudo consultar el RUC del QR");
        } else if (rucData.razonSocial) {
          setValue("razonSocial", rucData.razonSocial);
        }
      }

      toast.success("QR leído correctamente");

      setSelectedMethod("manual");
    } catch (error) {
      console.error(error);
      toast.error("QR inválido");
    }
  }}
  onClose={() => {
    setSelectedMethod("manual");
  }}
/>
    </CardContent>
  </Card>
)}

      {(selectedMethod === "xml" || selectedMethod === "pdf" || selectedMethod === "imagen") && (
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="file-upload">Seleccionar archivo</Label>
            <Input
              id="file-upload"
              type="file"
              accept={selectedMethod === "xml" ? ".xml" : selectedMethod === "pdf" ? ".pdf" : "image/*"}
              onChange={(e) => handleFileUpload(e, selectedMethod)}
              className="mt-2"
              disabled={processing}
            />
            {processing && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Procesando archivo...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del Comprobante</CardTitle>
          <CardDescription>Complete la información del comprobante de pago</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rucProveedor">RUC Proveedor</Label>
                <Input id="rucProveedor" placeholder="20100070970" maxLength={11} {...register("rucProveedor")} />
                {errors.rucProveedor && <p className="text-xs text-destructive">{errors.rucProveedor.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="razonSocial">Razón Social</Label>
                <Input id="razonSocial" placeholder="EMPRESA SAC" {...register("razonSocial")} />
                {errors.razonSocial && <p className="text-xs text-destructive">{errors.razonSocial.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tipo de Comprobante</Label>
                <Controller
                  control={control}
                  name="tipoComprobante"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(COMPROBANTE_TIPOS).map(([code, name]) => (
                          <SelectItem key={code} value={code}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Controller
                  control={control}
                  name="moneda"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PEN">Soles (PEN)</SelectItem>
                        <SelectItem value="USD">Dólares (USD)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serie">Serie</Label>
                <Input id="serie" placeholder="F001" {...register("serie")} />
                {errors.serie && <p className="text-xs text-destructive">{errors.serie.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" placeholder="00012345" {...register("numero")} />
                {errors.numero && <p className="text-xs text-destructive">{errors.numero.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input id="fecha" type="date" {...register("fecha")} />
                {errors.fecha && <p className="text-xs text-destructive">{errors.fecha.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="importe">Importe Total</Label>
                <Input id="importe" type="number" step="0.01" {...register("importe")} />
                {errors.importe && <p className="text-xs text-destructive">{errors.importe.message}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="igv">IGV</Label>
                <Input id="igv" type="number" step="0.01" {...register("igv")} />
                {errors.igv && <p className="text-xs text-destructive">{errors.igv.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjunto">Adjuntar Comprobante (opcional)</Label>
              <Input id="adjunto" type="file" accept=".pdf,.xml,image/*" />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" size="lg" onClick={onValidar}>
                Validar
              </Button>
              <Button type="submit" size="lg">
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {validationSummary && <ValidationResult summary={validationSummary} />}

      {validationSummary && loadingExplicacion && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              🤖 Analizando comprobante...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-3 w-full rounded-md bg-muted animate-pulse" />
            <div className="h-3 w-5/6 rounded-md bg-muted animate-pulse" />
            <div className="h-3 w-4/6 rounded-md bg-muted animate-pulse" />
          </CardContent>
        </Card>
      )}

      {validationSummary && errorExplicacion && !loadingExplicacion && (
        <Card className="animate-fade-in border-destructive/30">
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              No fue posible generar la explicación automática.
            </p>
          </CardContent>
        </Card>
      )}

      {validationSummary && explicacionIA && !loadingExplicacion && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base">🤖 Análisis Inteligente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-line">{explicacionIA}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
