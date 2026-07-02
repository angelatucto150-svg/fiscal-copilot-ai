"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/utils/validators";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (_data: ForgotPasswordFormData) => {
    toast.success("Se ha enviado un enlace de recuperación a tu correo");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>Recuperar Contraseña</CardTitle>
          <CardDescription>Ingresa tu correo y te enviaremos un enlace de recuperación</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="correo@empresa.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full">Enviar enlace</Button>
          </form>
          <Link href="/login" className="flex items-center justify-center gap-1 mt-4 text-sm text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Volver al login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
