import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS headers en todas las respuestas
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  // Verificar variables de entorno
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({
      ok: false,
      error: 'Configuración de Supabase no encontrada en el servidor',
    });
  }

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ ok: false, error: 'Slug es requerido' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: profesor, error: dbError } = await supabase
      .from('ranking_profesores')
      .select('nombre_completo, slug, calificacion_promedio, total_evaluaciones')
      .eq('slug', slug)
      .single();

    if (dbError || !profesor) {
      return res.status(404).json({ ok: false, error: 'Profesor no encontrado' });
    }

    return res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      profesor: {
        nombre: profesor.nombre_completo,
        slug: profesor.slug,
        calificacion: profesor.calificacion_promedio
          ? Number(profesor.calificacion_promedio).toFixed(1)
          : 'Sin evaluar',
        total_evaluaciones: profesor.total_evaluaciones || 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
}
