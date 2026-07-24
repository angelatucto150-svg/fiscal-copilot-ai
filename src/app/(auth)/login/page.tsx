"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  FileCheck,
  Loader2,
  ShieldCheck,
  BrainCircuit,
  Bot,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseClient } from "@/lib/supabase";
import {
  loginSchema,
  registerSchema,
  type LoginFormData,
  type RegisterFormData,
} from "@/utils/validators";
import { APP_NAME } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/utils";

type AuthTab = "login" | "register";

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Consulta oficial SUNAT",
    description: "Valida comprobantes electrónicos con la API oficial.",
  },
  {
    icon: BrainCircuit,
    title: "Análisis inteligente de riesgo tributario",
    description: "Evalúa el riesgo antes del registro contable.",
  },
  {
    icon: Bot,
    title: "Asistente IA Fiscal Copilot",
    description: "Resuelve dudas tributarias con apoyo de IA.",
  },
] as const;

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>("login");
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  const onLogin = async (data: LoginFormData) => {
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

  const onRegister = async (data: RegisterFormData) => {
    setLoading(true);

    try {
      const supabase = getSupabaseClient();

      if (!supabase) {
        toast.error("Servicio de autenticación no disponible");
        setLoading(false);
        return;
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            fullName: data.fullName,
            name: data.fullName,
          },
        },
      });

      if (error) {
        toast.error(error.message || "No se pudo crear la cuenta");
        setLoading(false);
        return;
      }

      if (signUpData.session) {
        const success = await login(data.email, data.password);
        setLoading(false);

        if (success) {
          toast.success("Cuenta creada. Bienvenido a Fiscal Copilot AI");
          router.push("/dashboard");
          return;
        }
      }

      setLoading(false);
      toast.success(
        "Cuenta creada correctamente. Revisa tu correo para confirmar el acceso."
      );
      setTab("login");
      loginForm.setValue("email", data.email);
      registerForm.reset();
    } catch {
      setLoading(false);
      toast.error("Ocurrió un error al crear la cuenta");
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Panel lateral */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden items-center justify-center p-12 gradient-primary">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,0,0,0.12),_transparent_50%)]" />

        <div className="relative z-10 text-white max-w-md animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20 shadow-lg">
              <FileCheck className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70 font-medium">
                Software tributario
              </p>
              <h1 className="text-3xl font-bold leading-tight">{APP_NAME}</h1>
            </div>
          </div>

          <p className="text-base font-light leading-relaxed mb-10 text-white/90">
            Valida el crédito fiscal antes del registro contable mediante
            inteligencia artificial y consultas oficiales SUNAT.
          </p>

          <div className="space-y-4">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="flex gap-3 rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm p-4 transition-transform duration-300 hover:translate-x-1"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <benefit.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    {benefit.title}
                  </p>
                  <p className="text-xs text-white/75 mt-1 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary mb-3 shadow-md">
              <FileCheck className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
              Valida el crédito fiscal antes del registro contable mediante
              inteligencia artificial y consultas oficiales SUNAT.
            </p>
          </div>

          <Card className="border shadow-xl shadow-primary/5 overflow-hidden">
            <CardHeader className="pb-4">
              {/* Tabs */}
              <div className="relative grid grid-cols-2 rounded-lg bg-muted p-1 mb-4">
                <div
                  className={cn(
                    "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-card shadow-sm transition-all duration-300 ease-out",
                    tab === "login" ? "left-1" : "left-[calc(50%+0px)]"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className={cn(
                    "relative z-10 rounded-md py-2 text-sm font-medium transition-colors duration-300",
                    tab === "login"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className={cn(
                    "relative z-10 rounded-md py-2 text-sm font-medium transition-colors duration-300",
                    tab === "register"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Crear Cuenta
                </button>
              </div>

              <div
                key={tab}
                className="animate-fade-in transition-opacity duration-300"
              >
                <CardTitle className="text-2xl text-center">
                  {tab === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
                </CardTitle>
                <CardDescription className="text-center mt-1.5">
                  {tab === "login"
                    ? "Ingresa tus credenciales para continuar"
                    : "Regístrate para comenzar a validar comprobantes"}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <div className="relative overflow-hidden min-h-[320px]">
                {/* Login */}
                <div
                  className={cn(
                    "transition-all duration-300 ease-out",
                    tab === "login"
                      ? "opacity-100 translate-x-0 relative"
                      : "opacity-0 -translate-x-4 absolute inset-0 pointer-events-none"
                  )}
                >
                  <form
                    onSubmit={loginForm.handleSubmit(onLogin)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Correo electrónico</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="correo@empresa.com"
                        autoComplete="email"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-xs text-destructive">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Contraseña</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-xs text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          {...loginForm.register("remember")}
                          className="rounded border-input"
                        />
                        Recordarme
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-sm text-primary hover:underline"
                      >
                        Recuperar contraseña
                      </Link>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && tab === "login" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Ingresar"
                      )}
                    </Button>
                  </form>
                </div>

                {/* Registro */}
                <div
                  className={cn(
                    "transition-all duration-300 ease-out",
                    tab === "register"
                      ? "opacity-100 translate-x-0 relative"
                      : "opacity-0 translate-x-4 absolute inset-0 pointer-events-none"
                  )}
                >
                  <form
                    onSubmit={registerForm.handleSubmit(onRegister)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="register-fullName">Nombre completo</Label>
                      <Input
                        id="register-fullName"
                        type="text"
                        placeholder="Juan Pérez"
                        autoComplete="name"
                        {...registerForm.register("fullName")}
                      />
                      {registerForm.formState.errors.fullName && (
                        <p className="text-xs text-destructive">
                          {registerForm.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Correo electrónico</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="correo@empresa.com"
                        autoComplete="email"
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-xs text-destructive">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Contraseña</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        autoComplete="new-password"
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-xs text-destructive">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-confirmPassword">
                        Confirmar contraseña
                      </Label>
                      <Input
                        id="register-confirmPassword"
                        type="password"
                        placeholder="Repite tu contraseña"
                        autoComplete="new-password"
                        {...registerForm.register("confirmPassword")}
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-xs text-destructive">
                          {
                            registerForm.formState.errors.confirmPassword
                              .message
                          }
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && tab === "register" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Crear cuenta"
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
            Al continuar, aceptas el uso responsable de la plataforma como apoyo
            preventivo. No reemplaza las consultas oficiales ante SUNAT.
          </p>
        </div>
      </div>
    </div>
  );
}
