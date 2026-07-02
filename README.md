# Fiscal Copilot AI

> **Valida el crédito fiscal antes del registro contable.**

Plataforma inteligente que ayuda a contribuyentes y profesionales contables a validar preventivamente el crédito fiscal, reduciendo contingencias tributarias mediante automatización, análisis de riesgos e inteligencia artificial.

**Importante:** Esta aplicación NO reemplaza a SUNAT. Centraliza información, analiza riesgos y ayuda a tomar decisiones antes de registrar el comprobante.

---

## Stack Tecnológico

| Tecnología | Uso |
|---|---|
| **Next.js 15** | Framework React con App Router |
| **TypeScript** | Tipado estático |
| **TailwindCSS** | Estilos utility-first |
| **Shadcn UI** | Componentes UI (Radix + Tailwind) |
| **Supabase** | Base de datos y autenticación |
| **OpenAI API** | IA Fiscal Copilot (integración preparada) |
| **Recharts** | Gráficos y reportes |
| **React Hook Form + Zod** | Formularios y validación |
| **Lucide Icons** | Iconografía |
| **jsPDF** | Generación de reportes PDF |

---

## Instalación

### Requisitos

- Node.js 18+
- npm o yarn

### Pasos

```bash
# 1. Entrar al directorio del proyecto
cd fiscal-copilot-ai

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local

# 4. Editar .env.local con tus credenciales (opcional para demo)
# Sin Supabase/OpenAI, la app funciona con datos mock y localStorage

# 5. Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### Credenciales Demo

| Campo | Valor |
|---|---|
| Email | `demo@fiscalcopilot.pe` |
| Contraseña | `demo123` |

---

## Arquitectura

```
fiscal-copilot-ai/
├── src/
│   ├── app/                    # Pages (App Router)
│   │   ├── (auth)/             # Login, recuperar contraseña
│   │   ├── (dashboard)/        # Pantallas autenticadas
│   │   │   ├── dashboard/      # Dashboard principal
│   │   │   ├── validacion/     # Flujo de validación (6 pasos)
│   │   │   ├── historial/      # Historial con filtros
│   │   │   ├── reportes/       # Gráficos y métricas
│   │   │   ├── perfil/         # Perfil de usuario
│   │   │   ├── configuracion/  # Ajustes
│   │   │   └── ayuda/          # Centro de ayuda + FAQ
│   │   └── api/                # API Routes
│   │       ├── ai/             # Chat y explicaciones IA
│   │       ├── validaciones/   # CRUD validaciones
│   │       └── sunat/          # Consultas RUC (mock)
│   ├── components/
│   │   ├── ui/                 # Componentes Shadcn
│   │   ├── layout/             # Sidebar, Header
│   │   ├── dashboard/          # Cards, stats
│   │   ├── validation/         # Gauge, chat, steps
│   │   ├── charts/             # Recharts
│   │   └── shared/             # Componentes compartidos
│   ├── hooks/                  # Custom hooks (auth, validation)
│   ├── services/               # Lógica de negocio
│   │   ├── sunat.service.ts    # Mock SUNAT (reemplazable)
│   │   ├── risk.service.ts     # Algoritmo de riesgo
│   │   ├── ai.service.ts       # OpenAI / mock IA
│   │   ├── validation.service.ts
│   │   └── pdf.service.ts      # Generación PDF
│   ├── types/                  # TypeScript interfaces
│   ├── utils/                  # Helpers y validadores Zod
│   └── lib/                    # Config (Supabase, constantes)
├── supabase/
│   └── schema.sql              # Esquema de base de datos
└── public/                     # Assets estáticos
```

---

## Flujo de Validación

```
1. Comprobante     → Ingreso manual / QR / XML / PDF / Imagen
2. Automáticas     → RUC activo, habido, validez, emisor electrónico
3. Formales        → Comprobante válido, info completa, registro correcto
4. Sustanciales    → Preguntas con IA explicativa ("Explícame")
5. Riesgo          → Puntaje 0-100, velocímetro, semáforo
6. Resultado       → Resumen + recomendación + PDF + chat IA
```

---

## Algoritmo de Riesgo

| Puntaje | Nivel | Semáforo | Acción |
|---|---|---|---|
| 80 - 100 | Bajo | Verde | Proceder con registro |
| 50 - 79 | Moderado | Amarillo | Revisar documentación |
| 0 - 49 | Alto | Rojo | No registrar hasta resolver |

**Factores evaluados:**
- Estado del RUC (activo/habido): -25 / -20 pts
- Validez del comprobante: -20 pts
- Emisor electrónico: -10 pts
- Coincidencia de datos: -10 pts
- Requisitos formales no cumplidos: -8 pts c/u
- Respuesta "No" sustancial: -15 pts
- Respuesta "No lo sé": -8 pts

---

## Integraciones Futuras

La arquitectura está preparada para reemplazar los servicios mock:

| Servicio | Archivo | Estado |
|---|---|---|
| SUNAT RUC | `src/services/sunat.service.ts` | Mock → API real |
| OpenAI | `src/services/ai.service.ts` | Mock → GPT-4 |
| OCR | `sunat.service.ts → parsearImagen/PDF` | Preparado |
| QR Scanner | `sunat.service.ts → escanearQR` | Preparado |
| Supabase | `src/lib/supabase.ts` | Configuración lista |
| PDF | `src/services/pdf.service.ts` | Funcional (jsPDF) |

---

## Base de Datos

Ejecutar `supabase/schema.sql` en el SQL Editor de Supabase.

**Tablas:**
- `profiles` — Usuarios
- `comprobantes` — Datos de comprobantes
- `validaciones` — Validaciones completas
- `requisitos_formales` — Detalle formal
- `requisitos_sustanciales` — Detalle sustancial
- `historial_ia` — Chat con Copilot
- `reportes` — PDFs generados
- `consejos_tributarios` — Tips del día
- `notificaciones` — Alertas

---

## Scripts

```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run start    # Servidor producción
npm run lint     # ESLint
```

---

## Licencia

Proyecto privado — Fiscal Copilot AI © 2025
