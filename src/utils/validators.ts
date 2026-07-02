import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  remember: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
});

export const comprobanteSchema = z.object({
  rucProveedor: z
    .string()
    .length(11, "El RUC debe tener 11 dígitos")
    .regex(/^\d+$/, "El RUC solo debe contener números"),
  razonSocial: z.string().min(3, "Ingresa la razón social"),
  tipoComprobante: z.enum(["01", "03", "07", "08", "12", "14"]),
  serie: z.string().min(1, "Ingresa la serie"),
  numero: z.string().min(1, "Ingresa el número"),
  fecha: z.string().min(1, "Selecciona la fecha"),
  importe: z.coerce.number().positive("El importe debe ser mayor a 0"),
  igv: z.coerce.number().min(0, "El IGV no puede ser negativo"),
  moneda: z.enum(["PEN", "USD"]),
});

export const profileSchema = z.object({
  fullName: z.string().min(2, "Ingresa tu nombre completo"),
  company: z.string().optional(),
  ruc: z.string().optional(),
  role: z.enum(["contador", "auxiliar", "tributario", "empresa", "contribuyente"]),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ComprobanteFormData = z.infer<typeof comprobanteSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
