-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
-- Este archivo debe contener todas las políticas RLS
-- Última actualización: 2026-02-05

-- TODO: Copiar las políticas RLS desde el dashboard de Supabase:
-- 1. Ve a Database → Policies en cada tabla
-- 2. Copia el SQL de cada policy
-- 3. Pégalas aquí organizadas por tabla

-- EJEMPLO DE FORMATO:
-- ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Usuarios pueden ver evaluaciones públicas"
-- ON public.evaluaciones FOR SELECT
-- USING (oculto = false);
