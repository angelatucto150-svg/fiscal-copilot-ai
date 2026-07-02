"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { profileSchema, type ProfileFormData } from "@/utils/validators";
import { toast } from "sonner";
import { Controller } from "react-hook-form";

export default function PerfilPage() {
  const { user, updateProfile } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? "",
      company: user?.company ?? "",
      ruc: user?.ruc ?? "",
      role: user?.role ?? "contador",
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfile(data);
    toast.success("Perfil actualizado correctamente");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground text-sm">Administra tu información personal</p>
      </div>

      <Card>
        <CardContent className="pt-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {user?.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user?.fullName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Información Personal
          </CardTitle>
          <CardDescription>Actualiza tus datos de perfil</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" {...register("company")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ruc">RUC</Label>
              <Input id="ruc" maxLength={11} {...register("ruc")} />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contador">Contador</SelectItem>
                      <SelectItem value="auxiliar">Auxiliar contable</SelectItem>
                      <SelectItem value="tributario">Responsable tributario</SelectItem>
                      <SelectItem value="empresa">Empresa</SelectItem>
                      <SelectItem value="contribuyente">Contribuyente</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <Button type="submit"><Save className="h-4 w-4" /> Guardar cambios</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
