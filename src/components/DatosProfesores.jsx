import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Página pública que muestra todos los profesores con su calificación en formato JSON.
 * Útil para que extensiones web u otros servicios puedan consumir los datos.
 * Ruta: /datos/profesores
 */
export default function DatosProfesores() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarProfesores = async () => {
      try {
        const { data: profesores, error: dbError } = await supabase
          .from('ranking_profesores')
          .select('nombre_completo, slug, calificacion_promedio, total_evaluaciones')
          .order('total_evaluaciones', { ascending: false })
          .order('calificacion_promedio', { ascending: false });

        if (dbError) throw dbError;

        const resultado = {
          ok: true,
          total: profesores?.length || 0,
          timestamp: new Date().toISOString(),
          profesores: (profesores || []).map((p) => ({
            nombre: p.nombre_completo,
            slug: p.slug,
            calificacion: p.calificacion_promedio
              ? Number(p.calificacion_promedio).toFixed(1)
              : 'Sin evaluar',
            total_evaluaciones: p.total_evaluaciones || 0,
          })),
        };

        setData(resultado);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarProfesores();
  }, []);

  // Mientras carga
  if (loading) {
    return (
      <pre id="profesores-data" style={{ margin: 0, padding: '16px', fontFamily: 'monospace', fontSize: '14px' }}>
        {JSON.stringify({ ok: false, loading: true }, null, 2)}
      </pre>
    );
  }

  // Si hay error
  if (error) {
    return (
      <pre id="profesores-data" style={{ margin: 0, padding: '16px', fontFamily: 'monospace', fontSize: '14px' }}>
        {JSON.stringify({ ok: false, error }, null, 2)}
      </pre>
    );
  }

  // Datos listos
  return (
    <pre id="profesores-data" style={{ margin: 0, padding: '16px', fontFamily: 'monospace', fontSize: '14px', background: '#1e1e1e', color: '#d4d4d4', minHeight: '100vh' }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
