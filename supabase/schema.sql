-- Fiscal Copilot AI - Database Schema
-- Ejecutar en Supabase SQL Editor

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Perfiles de usuario (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  company TEXT,
  ruc TEXT,
  role TEXT NOT NULL DEFAULT 'contador' CHECK (role IN ('contador', 'auxiliar', 'tributario', 'empresa', 'contribuyente')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comprobantes
CREATE TABLE IF NOT EXISTS comprobantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ruc_proveedor TEXT NOT NULL,
  razon_social TEXT NOT NULL,
  tipo_comprobante TEXT NOT NULL,
  serie TEXT NOT NULL,
  numero TEXT NOT NULL,
  fecha DATE NOT NULL,
  importe DECIMAL(12, 2) NOT NULL,
  igv DECIMAL(12, 2) NOT NULL DEFAULT 0,
  moneda TEXT NOT NULL DEFAULT 'PEN' CHECK (moneda IN ('PEN', 'USD')),
  adjunto_url TEXT,
  input_method TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Validaciones
CREATE TABLE IF NOT EXISTS validaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comprobante_id UUID REFERENCES comprobantes(id),
  comprobante JSONB NOT NULL,
  automatic_validation JSONB NOT NULL,
  formal_requirements JSONB NOT NULL DEFAULT '[]',
  substantial_requirements JSONB NOT NULL DEFAULT '[]',
  risk_assessment JSONB NOT NULL,
  ai_recommendation JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('aprobado', 'observado', 'rechazado', 'pendiente')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Requisitos formales (histórico detallado)
CREATE TABLE IF NOT EXISTS requisitos_formales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  validacion_id UUID NOT NULL REFERENCES validaciones(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  cumple BOOLEAN NOT NULL DEFAULT FALSE,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Requisitos sustanciales (histórico detallado)
CREATE TABLE IF NOT EXISTS requisitos_sustanciales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  validacion_id UUID NOT NULL REFERENCES validaciones(id) ON DELETE CASCADE,
  pregunta TEXT NOT NULL,
  respuesta TEXT CHECK (respuesta IN ('si', 'no', 'no_se')),
  explicacion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Historial de chat IA
CREATE TABLE IF NOT EXISTS historial_ia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  validacion_id UUID REFERENCES validaciones(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reportes generados
CREATE TABLE IF NOT EXISTS reportes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  validacion_id UUID REFERENCES validaciones(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL DEFAULT 'pdf',
  url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consejos tributarios
CREATE TABLE IF NOT EXISTS consejos_tributarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_validaciones_user_id ON validaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_validaciones_status ON validaciones(status);
CREATE INDEX IF NOT EXISTS idx_validaciones_created_at ON validaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comprobantes_ruc ON comprobantes(ruc_proveedor);
CREATE INDEX IF NOT EXISTS idx_historial_ia_user_id ON historial_ia(user_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_id ON notificaciones(user_id);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE validaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own validations" ON validaciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own validations" ON validaciones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own chat history" ON historial_ia FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON historial_ia FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications" ON notificaciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own reports" ON reportes FOR SELECT USING (auth.uid() = user_id);

-- Datos de ejemplo
INSERT INTO consejos_tributarios (titulo, contenido) VALUES
  ('Verifica el estado del RUC', 'Antes de usar un comprobante como crédito fiscal, confirma que el RUC del proveedor esté activo y habido.'),
  ('Conserva el sustento documental', 'Además del comprobante, mantén órdenes de compra, guías de remisión y contratos.'),
  ('Plazo de registro', 'El crédito fiscal debe registrarse en el periodo tributario correspondiente.');
