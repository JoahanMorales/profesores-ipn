import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { obtenerEvaluacionesUsuario } from '../services/supabaseService';
import { useSEO } from '../hooks/useSEO';
import Navbar from './Navbar';

/* ── SVG Icon Components ─────────────────────────────── */
const DiamondIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 2L1 9l11 13L23 9l-5-7H6zm1.5 1.5h9L20 8.5l-8 9.5-8-9.5L7.5 3.5z" />
    <path d="M7.5 3.5L4 8.5h4.5L7.5 3.5zm9 0L12 8.5h4.5l3.5-5h-1.5zM12 8.5L8.5 3.5h7L12 8.5z" opacity="0.3" />
  </svg>
);

const StarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BookIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const ThumbUpIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
  </svg>
);

const ThumbDownIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
  </svg>
);

const PencilIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const ClipboardIcon = ({ className = "w-12 h-12" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const ChartIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

/* ── Animated Horizontal Bar Chart ───────────────────── */
const DistributionChart = ({ distribucion, total }) => {
  const [animated, setAnimated] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true); },
      { threshold: 0.3 }
    );
    if (chartRef.current) observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  const maxCount = Math.max(...distribucion, 1);

  const getBarGradient = (calif) => {
    if (calif >= 8) return 'from-emerald-400 to-green-500 dark:from-emerald-500 dark:to-green-600';
    if (calif >= 6) return 'from-amber-300 to-yellow-500 dark:from-amber-400 dark:to-yellow-600';
    if (calif >= 4) return 'from-orange-300 to-orange-500 dark:from-orange-400 dark:to-orange-600';
    return 'from-red-400 to-rose-500 dark:from-red-500 dark:to-rose-600';
  };

  const getLabel = (calif) => {
    if (calif === 10) return 'Excelente';
    if (calif >= 8) return 'Muy bien';
    if (calif >= 6) return 'Regular';
    if (calif >= 4) return 'Bajo';
    return 'Muy bajo';
  };

  return (
    <div ref={chartRef} className="space-y-2">
      {distribucion.map((count, i) => {
        const calif = i + 1;
        const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
        const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;

        return (
          <div key={calif} className="group flex items-center gap-2 sm:gap-3">
            {/* Rating number */}
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 transition-transform group-hover:scale-110 ${
              count > 0
                ? calif >= 8 ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                : calif >= 6 ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                : calif >= 4 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'
                : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            }`}>
              {calif}
            </div>

            {/* Bar container */}
            <div className="flex-1 h-6 sm:h-7 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getBarGradient(calif)} transition-all duration-1000 ease-out relative overflow-hidden`}
                style={{ width: animated ? `${Math.max(widthPct, count > 0 ? 8 : 0)}%` : '0%' }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
              </div>
              {/* Hover label */}
              {count > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                  {getLabel(calif)}
                </span>
              )}
            </div>

            {/* Count + percentage */}
            <div className="flex items-center gap-1 w-12 sm:w-16 flex-shrink-0 justify-end">
              <span className={`text-xs sm:text-sm font-bold ${count > 0 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}>
                {count}
              </span>
              {count > 0 && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:inline">
                  ({pct}%)
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── Main ProfilePage Component ──────────────────────── */
const ProfilePage = () => {
  const { user, monedas } = useAuth();
  const navigate = useNavigate();
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('evaluaciones');

  useSEO(
    'Mi Perfil | IPNProfes',
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

      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header del perfil */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-ipn-guinda-900 to-ipn-guinda-700 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg">
              {user.username?.charAt(0).toUpperCase() || '?'}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {user.username}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">
                Miembro desde {user.loginTime ? formatFecha(user.loginTime) : 'hace poco'}
              </p>
            </div>

            {/* Monedas y evaluaciones */}
            <div className="flex gap-2 sm:gap-3">
              <div className="text-center px-3 sm:px-4 py-2 bg-gradient-to-r from-slate-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-purple-900/30 dark:to-pink-900/30 rounded-xl border border-purple-200 dark:border-purple-700">
                <div className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300">
                  💎 {monedas || 0}
                </div>
                <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400">Diamantes</div>
              </div>
              <div className="text-center px-3 sm:px-4 py-2 bg-ipn-guinda-50 dark:bg-ipn-guinda-900/20 rounded-xl border border-ipn-guinda-200 dark:border-ipn-guinda-800">
                <div className="text-xl sm:text-2xl font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400">
                  {evaluaciones.length}
                </div>
                <div className="text-[10px] sm:text-xs text-ipn-guinda-700 dark:text-ipn-guinda-300">Evaluaciones</div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <StarIcon className={`w-4 h-4 ${getCalifColor(parseFloat(stats.promedioCalif))}`} />
              </div>
              <div className={`text-xl sm:text-2xl font-bold ${getCalifColor(parseFloat(stats.promedioCalif))}`}>
                {stats.promedioCalif}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">Promedio dado</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <CheckCircleIcon className="w-4 h-4 text-green-500 dark:text-green-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.porcentajeRecomendado}%
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">Recomienda</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <UsersIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.profesoresUnicos}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">Profesores</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <BookIcon className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.materias}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">Materias</div>
            </div>
          </div>
        )}

        {/* Distribución de calificaciones — Horizontal Animated Bars */}
        {stats && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ChartIcon className="w-5 h-5 text-ipn-guinda-700 dark:text-ipn-guinda-400" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Distribución de tus calificaciones
              </h3>
            </div>
            <DistributionChart distribucion={stats.distribucion} total={stats.totalEvals} />
            {/* Summary pill */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 inline-block" /> 8-10 Excelente</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 inline-block" /> 6-7 Regular</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-orange-300 to-orange-500 inline-block" /> 4-5 Bajo</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-red-400 to-rose-500 inline-block" /> 1-3 Muy bajo</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <button
            onClick={() => setTab('evaluaciones')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
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
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
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
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 text-center border border-gray-200 dark:border-gray-700">
                <ClipboardIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Aún no tienes evaluaciones
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Evalúa a tus profesores y gana 5 diamantes por cada evaluación
                </p>
                <Link
                  to="/evaluar"
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-ipn-guinda-900 dark:bg-ipn-guinda-700 text-white rounded-xl hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-all font-medium text-sm sm:text-base"
                >
                  <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Evaluar un profesor
                </Link>
              </div>
            ) : (
              evaluaciones.map(ev => (
                <div
                  key={ev.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/profesor/${ev.profesor?.slug}`}
                        className="font-semibold text-sm sm:text-base text-ipn-guinda-900 dark:text-ipn-guinda-400 hover:underline"
                      >
                        {ev.profesor?.nombre_completo || 'Profesor'}
                      </Link>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <span className="truncate max-w-[120px] sm:max-w-none">{ev.materia}</span>
                        <span>·</span>
                        <span>{ev.escuela?.abreviatura}</span>
                        <span className="hidden xs:inline">·</span>
                        <span className="hidden xs:inline">{formatFecha(ev.created_at)}</span>
                      </div>
                      {ev.opinion && (
                        <p className="mt-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          &ldquo;{ev.opinion}&rdquo;
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                        {ev.recomendado ? (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <ThumbUpIcon className="w-3 h-3" /> Recomendado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            <ThumbDownIcon className="w-3 h-3" /> No recomendado
                          </span>
                        )}
                        {ev.calificacion_obtenida && (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            <ChartIcon className="w-3 h-3" /> Obtuve: {ev.calificacion_obtenida}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center text-base sm:text-lg font-bold ${getCalifBg(ev.calificacion)} ${getCalifColor(ev.calificacion)}`}>
                      {ev.calificacion}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Tab: Escuelas */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {stats?.escuelasUnicas?.map(escuela => {
              const evalsEscuela = evaluaciones.filter(e => e.escuela?.abreviatura === escuela);
              const promedio = evalsEscuela.reduce((a, b) => a + b.calificacion, 0) / evalsEscuela.length;
              return (
                <div
                  key={escuela}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 text-center"
                >
                  <div className="text-base sm:text-lg font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400">{escuela}</div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {evalsEscuela.length} evaluación{evalsEscuela.length !== 1 ? 'es' : ''}
                  </div>
                  <div className={`text-base sm:text-lg font-bold mt-1 ${getCalifColor(promedio)}`}>
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
