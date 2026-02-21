-- ============================================================
-- MIGRACIÓN: Sistema de Likes/Dislikes en Evaluaciones
-- 
-- EJECUTAR EN: Supabase Dashboard → SQL Editor → New Query
-- Pega TODO este archivo y haz clic en "Run"
--
-- Fecha: 2026-02-20
-- ============================================================

-- ════════════════════════════════════════════
-- TABLA: evaluacion_likes
-- Almacena likes/dislikes por evaluación
-- Un visitor_id (device fingerprint) solo puede
-- dar 1 like O 1 dislike por evaluación
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.evaluacion_likes (
  id BIGSERIAL PRIMARY KEY,
  evaluacion_id BIGINT NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Un visitor solo puede dar un like/dislike por evaluación
  UNIQUE(evaluacion_id, visitor_id)
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_eval_likes_evaluacion 
  ON evaluacion_likes(evaluacion_id);
CREATE INDEX IF NOT EXISTS idx_eval_likes_visitor 
  ON evaluacion_likes(visitor_id);

-- ════════════════════════════════════════════
-- RLS: Políticas de seguridad
-- ════════════════════════════════════════════
ALTER TABLE evaluacion_likes ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer likes (son públicos)
CREATE POLICY "likes_select_public" ON evaluacion_likes
  FOR SELECT USING (true);

-- Cualquiera puede insertar (con visitor_id)
CREATE POLICY "likes_insert_public" ON evaluacion_likes
  FOR INSERT WITH CHECK (true);

-- Cualquiera puede actualizar (cambiar like↔dislike)
CREATE POLICY "likes_update_public" ON evaluacion_likes
  FOR UPDATE USING (true);

-- Cualquiera puede borrar (quitar su like/dislike)
CREATE POLICY "likes_delete_public" ON evaluacion_likes
  FOR DELETE USING (true);

-- ════════════════════════════════════════════
-- GRANTS para rol anon (Supabase)
-- ════════════════════════════════════════════
GRANT SELECT, INSERT, UPDATE, DELETE ON evaluacion_likes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON evaluacion_likes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE evaluacion_likes_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE evaluacion_likes_id_seq TO authenticated;

-- ════════════════════════════════════════════
-- VERIFICACIÓN
-- ════════════════════════════════════════════
-- Después de ejecutar, verifica con:
--
-- SELECT EXISTS (
--   SELECT 1 FROM information_schema.tables 
--   WHERE table_name = 'evaluacion_likes'
-- ) AS tabla_existe;
-- → Debe devolver: true
--
-- SELECT COUNT(*) FROM evaluacion_likes;
-- → Debe devolver: 0
