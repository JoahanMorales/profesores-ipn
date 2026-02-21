import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { obtenerEvaluacionesUsuario } from '../services/supabaseService';
import { useSEO } from '../hooks/useSEO';
import Navbar from './Navbar';

const ProfilePage = () => {
  const { user, monedas } = useAuth();
  const navigate = useNavigate();
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('evaluaciones');

  useSEO(
    'Mi Perfil | ip',
    'Tu perfil de usuario en IPNProfes. Revisa tus evaluaciones, estadísticas y diamantes.',
    'perfil usuario, mis evaluaciones, estadísticas'
  );

  useEffect(() => {
    if (!user) {
      navigate('/login?returnTo=/perfil');
      return;
    }
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const resultado = await obtenerEvaluacionesUsuario(user.id);
      const evals = resultado.success ? resultado.data : [];
      setEvaluaciones(evals);

      if (evals.length > 0) {
        const totalEvals = evals.length;
        const promedioCalif = evals.reduce((a, b) => a + b.calificacion, 0) / totalEvals;
        const recomendados = evals.filter(e => e.recomendado).length;
        const escuelasUnicas = [...new Set(evals.map(e => e.escuela?.abreviatura).filter(Boolean))];
        const profesoresUnicos = [...new Set(evals.map(e => e.profesor?.id).filter(Boolean))];
        const materias = [...new Set(evals.map(e => e.materia).filter(Boolean))];

        // Distribución de calificaciones (1-10)
        const distribucion = Array(10).fill(0);
        evals.forEach(e => {
          if (e.calificacion >= 1 && e.calificacion <= 10) {
            distribucion[e.calificacion - 1]++;
          }
        });

        setStats({
          totalEvals,
          promedioCalif: promedioCalif.toFixed(1),
          recomendados,
          porcentajeRecomendado: ((recomendados / totalEvals) * 100).toFixed(0),
          escuelasUnicas,
          profesoresUnicos: profesoresUnicos.length,
          materias: materias.length,
          distribucion
        });
      }
    } catch (err) {
      console.error('Error cargando perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCalifColor = (calif) => {
    if (calif >= 8) return 'text-green-600 dark:text-green-400';
    if (calif >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getCalifBg = (calif) => {
    if (calif >= 8) return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
    if (calif >= 6) return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header del perfil */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-ipn-guinda-900 to-ipn-guinda-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user.username?.charAt(0).toUpperCase() || '?'}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.username}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Miembro desde {user.loginTime ? formatFecha(user.loginTime) : 'hace poco'}
              </p>
            </div>

            {/* Monedas y evaluaciones */}
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 bg-gradient-to-r from-slate-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-purple-900/30 dark:to-pink-900/30 rounded-xl border border-purple-200 dark:border-purple-700">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  💎 {monedas || 0}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">Diamantes</div>
              </div>
              <div className="text-center px-4 py-2 bg-ipn-guinda-50 dark:bg-ipn-guinda-900/20 rounded-xl border border-ipn-guinda-200 dark:border-ipn-guinda-800">
                <div className="text-2xl font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400">
                  {evaluaciones.length}
                </div>
                <div className="text-xs text-ipn-guinda-700 dark:text-ipn-guinda-300">Evaluaciones</div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
              <div className={`text-2xl font-bold ${getCalifColor(parseFloat(stats.promedioCalif))}`}>
                {stats.promedioCalif}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Promedio dado</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.porcentajeRecomendado}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Recomienda</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.profesoresUnicos}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Profesores</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.materias}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Materias</div>
            </div>
          </div>
        )}

        {/* Distribución de calificaciones */}
        {stats && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Distribución de tus calificaciones
            </h3>
            <div className="flex items-end gap-1 h-24">
              {stats.distribucion.map((count, i) => {
                const maxCount = Math.max(...stats.distribucion, 1);
                const height = (count / maxCount) * 100;
                const calif = i + 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {count > 0 ? count : ''}
                    </span>
                    <div
                      className={`w-full rounded-t transition-all ${
                        calif >= 8 ? 'bg-green-400 dark:bg-green-500' :
                        calif >= 6 ? 'bg-yellow-400 dark:bg-yellow-500' :
                        'bg-red-400 dark:bg-red-500'
                      }`}
                      style={{ height: `${Math.max(height, count > 0 ? 8 : 2)}%` }}
                    />
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{calif}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('evaluaciones')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'evaluaciones'
                ? 'bg-ipn-guinda-900 dark:bg-ipn-guinda-700 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Mis evaluaciones ({evaluaciones.length})
          </button>
          {stats?.escuelasUnicas?.length > 0 && (
            <button
              onClick={() => setTab('escuelas')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'escuelas'
                  ? 'bg-ipn-guinda-900 dark:bg-ipn-guinda-700 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Escuelas ({stats.escuelasUnicas.length})
            </button>
          )}
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ipn-guinda-900 dark:border-ipn-guinda-400"></div>
          </div>
        ) : tab === 'evaluaciones' ? (
          <div className="space-y-3">
            {evaluaciones.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Aún no tienes evaluaciones
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Evalúa a tus profesores y gana 5 diamantes por cada evaluación
                </p>
                <Link
                  to="/evaluar"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-ipn-guinda-900 dark:bg-ipn-guinda-700 text-white rounded-xl hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-all font-medium"
                >
                  ✏️ Evaluar un profesor
                </Link>
              </div>
            ) : (
              evaluaciones.map(ev => (
                <div
                  key={ev.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/profesor/${ev.profesor?.slug}`}
                        className="font-semibold text-ipn-guinda-900 dark:text-ipn-guinda-400 hover:underline"
                      >
                        {ev.profesor?.nombre_completo || 'Profesor'}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>{ev.materia}</span>
                        <span>•</span>
                        <span>{ev.escuela?.abreviatura}</span>
                        <span>•</span>
                        <span>{formatFecha(ev.created_at)}</span>
                      </div>
                      {ev.opinion && (
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          "{ev.opinion}"
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {ev.recomendado ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            👍 Recomendado
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            👎 No recomendado
                          </span>
                        )}
                        {ev.calificacion_obtenida && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            📊 Obtuve: {ev.calificacion_obtenida}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center text-lg font-bold ${getCalifBg(ev.calificacion)} ${getCalifColor(ev.calificacion)}`}>
                      {ev.calificacion}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Tab: Escuelas */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats?.escuelasUnicas?.map(escuela => {
              const evalsEscuela = evaluaciones.filter(e => e.escuela?.abreviatura === escuela);
              const promedio = evalsEscuela.reduce((a, b) => a + b.calificacion, 0) / evalsEscuela.length;
              return (
                <div
                  key={escuela}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center"
                >
                  <div className="text-lg font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400">{escuela}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {evalsEscuela.length} evaluación{evalsEscuela.length !== 1 ? 'es' : ''}
                  </div>
                  <div className={`text-lg font-bold mt-1 ${getCalifColor(promedio)}`}>
                    {promedio.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;
