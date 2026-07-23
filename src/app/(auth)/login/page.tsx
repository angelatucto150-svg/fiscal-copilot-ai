"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { FileCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { loginSchema, type LoginFormData } from "@/utils/validators";
import { APP_NAME, APP_SLOGAN, DEMO_CREDENTIALS } from "@/lib/constants";
import { toast } from "sonner";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    const success = await login(data.email, data.password);
    setLoading(false);

    if (success) {
      toast.success("Bienvenido a Fiscal Copilot AI");
      router.push("/dashboard");
    } else {
      toast.error("Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="text-white max-w-md animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <FileCheck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{APP_NAME}</h1>
            </div>
          </div>
          <p className="text-xl font-light mb-6 opacity-90">{APP_SLOGAN}</p>
          <div className="space-y-4 text-sm opacity-80">
            <p>✓ Validación preventiva de crédito fiscal</p>
            <p>✓ Análisis de riesgo tributario con IA</p>
            <p>✓ Requisitos formales y sustanciales</p>
            <p>✓ Reportes y historial completo</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md animate-fade-in border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="lg:hidden flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                <FileCheck className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" placeholder="correo@empresa.com" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("remember")} className="rounded border-input" />
                  Recordarme
                </label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Recuperar contraseña
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingresar"}
              </Button>
            </form>


          </CardContent>
        </Card>
      </div>
    </div>
  );
}
