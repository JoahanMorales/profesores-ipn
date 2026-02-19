import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import DisclaimerBanner from './DisclaimerBanner';
import { useAuth } from '../context/AuthContext';
import { obtenerEstadisticasGlobales } from '../services/supabaseService';
import { useSEO } from '../hooks/useSEO';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [stats, setStats] = useState({
    totalProfesores: 0,
    totalEscuelas: 0,
    totalCarreras: 0,
    totalEvaluaciones: 0
  });
  const [loading, setLoading] = useState(true);

  // SEO para landing page
  useSEO(
    'ip - Evalúa Profesores Anónimamente | Plataforma Estudiantil IPN',
    'Plataforma 100% anónima para evaluar profesores del IPN. Descubre las mejores opciones de profesores según estudiantes reales. Gana monedas premium por tus evaluaciones.',
    'IPN, profesores IPN, evaluar profesores, ESCOM, UPIICSA, ESIME, calificaciones profesores, opiniones estudiantes, politécnico'
  );

  useEffect(() => {
    const cargarEstadisticas = async () => {
      const result = await obtenerEstadisticasGlobales();
      if (result.success) {
        setStats(result.data);
      }
      setLoading(false);
    };

    cargarEstadisticas();
  }, []);

  const features = [
    {
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      titulo: 'Busca profesores al instante',
      desc: 'Filtra por nombre, escuela, carrera o materia. Encuentra calificaciones y opiniones de estudiantes reales antes de inscribirte.',
    },
    {
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      titulo: 'Evalúa de forma anónima',
      desc: 'Comparte tu experiencia honesta sin preocuparte. Cada evaluación ayuda a miles de estudiantes a tomar mejores decisiones.',
    },
    {
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      titulo: 'Gana diamantes',
      desc: 'Cada evaluación te da diamantes que puedes usar en funciones premium como el generador de horarios inteligente de la extensión.',
    },
    {
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      titulo: 'Extensión para el SAES',
      desc: 'Genera horarios sin traslapes, ve calificaciones de profesores directo en el SAES y más — todo desde tu navegador.',
    },
    {
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      titulo: 'Eventos de la comunidad',
      desc: 'Entérate de hackatones, congresos, ferias y actividades de la comunidad politécnica. Cualquiera puede compartir un evento.',
    },
    {
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      titulo: 'Blog estudiantil',
      desc: 'Artículos sobre la vida en el IPN, guías de inscripción, datos del SAES y más. Puedes publicar tus propios artículos.',
    },
  ];

  const pasos = [
    { n: '1', titulo: 'Crea tu cuenta', desc: 'Regístrate con un nombre de usuario y una pregunta secreta. Sin correo, sin datos personales.' },
    { n: '2', titulo: 'Evalúa a tus profesores', desc: 'Califica, deja tu opinión y gana diamantes por cada evaluación que compartas.' },
    { n: '3', titulo: 'Consulta antes de inscribirte', desc: 'Busca profesores, lee opiniones y arma tu horario con la mejor información disponible.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1">
        {/* ═══════ HERO ═══════ */}
        <section className="relative overflow-hidden bg-white dark:bg-gray-900">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-20 sm:pb-20 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img
                src="/logo_ipnp.svg"
                alt="IPNProfes"
                className="h-20 w-20 sm:h-24 sm:w-24 animate-butterfly drop-shadow-lg"
              />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-5 tracking-tight leading-[1.1]">
              Elige mejor a tus{' '}
              <span className="text-ipn-guinda-900 dark:text-ipn-guinda-400">profesores del IPN</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              Consulta evaluaciones reales de estudiantes, comparte tu experiencia de forma anónima y usa herramientas que facilitan tu vida académica en el IPN.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
              <button
                onClick={() => navigate('/buscar')}
                className="px-8 py-3.5 text-base font-semibold text-white bg-ipn-guinda-900 dark:bg-ipn-guinda-700 rounded-xl hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-all shadow-lg shadow-ipn-guinda-900/20 hover:shadow-xl hover:-translate-y-0.5"
              >
                Buscar Profesor
              </button>
              <button
                onClick={() => navigate(isAuthenticated() ? '/evaluar' : '/login?returnTo=%2Fevaluar')}
                className="px-8 py-3.5 text-base font-semibold text-ipn-guinda-900 dark:text-ipn-guinda-400 bg-white dark:bg-gray-800 border-2 border-ipn-guinda-200 dark:border-ipn-guinda-700 rounded-xl hover:bg-ipn-guinda-50 dark:hover:bg-gray-700 transition-all"
              >
                Evaluar Profesor
              </button>
            </div>

            {/* Stats inline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { valor: loading ? '...' : stats.totalEscuelas, label: 'Escuelas' },
                { valor: loading ? '...' : stats.totalCarreras, label: 'Carreras' },
                { valor: loading ? '...' : stats.totalProfesores, label: 'Profesores' },
                { valor: loading ? '...' : stats.totalEvaluaciones, label: 'Evaluaciones' },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                  <div className="text-2xl sm:text-3xl font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400">{s.valor}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ CÓMO FUNCIONA ═══════ */}
        <section className="bg-gray-50 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-ipn-guinda-900 dark:text-ipn-guinda-400 uppercase tracking-widest mb-2">Cómo funciona</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Empieza en menos de 2 minutos</h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-8">
              {pasos.map((paso) => (
                <div key={paso.n} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-ipn-guinda-900 dark:bg-ipn-guinda-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md shadow-ipn-guinda-900/20">
                    {paso.n}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{paso.titulo}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{paso.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ FEATURES ═══════ */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-ipn-guinda-900 dark:text-ipn-guinda-400 uppercase tracking-widest mb-2">Plataforma completa</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Todo lo que necesitas como estudiante del IPN</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-ipn-guinda-50 dark:bg-ipn-guinda-900/20 text-ipn-guinda-900 dark:text-ipn-guinda-400 flex items-center justify-center mb-4">
                  {f.icono}
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{f.titulo}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ CTA FINAL ═══════ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-ipn-guinda-900 to-ipn-guinda-800 dark:from-gray-800 dark:to-gray-900">
          <div className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Hecho por estudiantes, para estudiantes
            </h2>
            <p className="text-base text-white/70 max-w-xl mx-auto mb-8">
              IPNProfes es un proyecto independiente creado por la comunidad politécnica. Tu participación hace que la plataforma sea útil para todos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate(isAuthenticated() ? '/evaluar' : '/login?returnTo=%2Fevaluar')}
                className="px-8 py-3.5 text-base font-semibold text-ipn-guinda-900 bg-white rounded-xl hover:bg-gray-100 transition-all shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5"
              >
                Evaluar un profesor
              </button>
              <button
                onClick={() => navigate('/extension')}
                className="px-8 py-3.5 text-base font-semibold text-white border-2 border-white/25 rounded-xl hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                Ver la extensión
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
