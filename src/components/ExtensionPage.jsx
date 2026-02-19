import { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useSEO } from '../hooks/useSEO';

const ExtensionPage = () => {
  useSEO(
    'Extensión IPNProfes para Chrome | ip',
    'Descarga y aprende a usar la extensión de Chrome de IPNProfes. Genera horarios, consulta calificaciones de profesores en el SAES y más.',
    'extensión IPNProfes, chrome extension IPN, SAES extensión, horarios IPN, calificaciones SAES'
  );

  const [faqAbierto, setFaqAbierto] = useState(null);

  const features = [
    {
      titulo: 'Generador de Horarios',
      descripcion: 'Genera automáticamente combinaciones de horarios sin traslapes. Selecciona tus materias y obtén todas las opciones posibles al instante.',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      diamante: true,
    },
    {
      titulo: 'Calificaciones en el SAES',
      descripcion: 'Ve las evaluaciones de los profesores directamente en las tablas del SAES. Sin salir de la página, sabes qué tan bien evaluado está cada profesor.',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      titulo: 'Búsqueda Avanzada',
      descripcion: 'Filtra horarios por grupo, edificio, salón, día de la semana y más con una barra de búsqueda inteligente integrada en las páginas del SAES.',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      titulo: 'Evaluación Docente Rápida',
      descripcion: 'Completa la evaluación docente del SAES de forma rápida y sencilla. Ahorra tiempo en un trámite que normalmente es tedioso.',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      titulo: 'Perfil con 1 Clic',
      descripcion: 'Haz clic en el nombre de cualquier profesor en el SAES y accede directo a su perfil completo en IPNProfes con sus evaluaciones y opiniones.',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      titulo: 'Sincronización Automática',
      descripcion: 'Tu sesión se sincroniza entre la web y la extensión. Inicia sesión una vez y todo funciona automáticamente en ambos lados.',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
  ];

  const faqs = [
    {
      pregunta: '¿La extensión es gratuita?',
      respuesta: 'Sí, la extensión de IPNProfes es completamente gratuita y lo será siempre.',
    },
    {
      pregunta: '¿Es segura? ¿Accede a mis datos del SAES?',
      respuesta: 'La extensión solo lee la información visible en las páginas del SAES para mostrar calificaciones y generar horarios. No accede a tu contraseña ni a datos sensibles.',
    },
    {
      pregunta: '¿Funciona en todas las escuelas del IPN?',
      respuesta: 'Sí, funciona en cualquier escuela del IPN que use el SAES. Las páginas compatibles son las de horarios, ocupabilidad de grupos y evaluación docente.',
    },
    {
      pregunta: '¿Necesito tener cuenta en IPNProfes?',
      respuesta: 'No necesitas cuenta para ver las calificaciones de los profesores. Sin embargo, si inicias sesión puedes sincronizar tus diamantes, evaluar profesores y usar la función premium del generador de horarios que prioriza a los profesores mejor evaluados.',
    },
  ];

  const navegadores = [
    { nombre: 'Google Chrome', version: 'v110+', principal: true },
    { nombre: 'Microsoft Edge', version: 'Chromium', principal: false },
    { nombre: 'Brave Browser', version: '', principal: false },
    { nombre: 'Opera', version: 'Chromium', principal: false },
  ];

  const paginasSAES = [
    'Horarios (horarios.aspx)',
    'Ocupabilidad de Grupos',
    'Evaluación Docente',
    'Datos de cualquier profesor',
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1">
        {/* ═══════ HERO ═══════ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-ipn-guinda-900 via-ipn-guinda-800 to-ipn-guinda-900 dark:from-gray-900 dark:via-ipn-guinda-900 dark:to-gray-900">
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          {/* Glow blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ipn-guinda-500/20 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Extensión en validación
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 tracking-tight leading-[1.1]">
              Extensión IPNProfes
            </h1>

            <p className="text-lg sm:text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
              Genera horarios sin traslapes, consulta calificaciones de profesores, llena evaluación docente y más — todo integrado directamente en tu navegador.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold text-white/60 bg-white/10 rounded-xl border border-white/20 cursor-default">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0112 6.545h10.691A12 12 0 0012 0zM1.931 5.47A11.943 11.943 0 000 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 01-6.865-2.29zm13.342 2.166a5.446 5.446 0 011.45 7.09l.002.001h-.002l-3.953 6.848c.542.048 1.09.08 1.645.08 6.627 0 12-5.373 12-12 0-1.006-.129-1.981-.361-2.919H15.273zM12 16.364a4.364 4.364 0 110-8.728 4.364 4.364 0 010 8.728z" />
                </svg>
                Próximamente en Chrome Web Store
              </div>
              <a
                href="#funciones"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white border-2 border-white/25 rounded-xl hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                Ver funciones
              </a>
            </div>
          </div>
        </section>

        {/* ═══════ FEATURES ═══════ */}
        <section id="funciones" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-ipn-guinda-900 dark:text-ipn-guinda-400 uppercase tracking-widest mb-3">Funciones</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Todo lo que necesitas en el SAES
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="group relative">
                {/* Card */}
                <div className={`relative bg-white dark:bg-gray-800 rounded-2xl border p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  f.diamante
                    ? 'border-purple-200 dark:border-purple-700/50 shadow-md shadow-purple-100 dark:shadow-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-ipn-guinda-200 dark:hover:border-ipn-guinda-700'
                }`}>
                  {/* Diamond shimmer accent */}
                  {f.diamante && (
                    <div className="absolute -top-px -left-px -right-px h-[2px] rounded-t-2xl overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-shimmer" />
                    </div>
                  )}

                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    f.diamante
                      ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-600 dark:text-purple-400'
                      : 'bg-ipn-guinda-50 dark:bg-ipn-guinda-900/20 text-ipn-guinda-900 dark:text-ipn-guinda-400'
                  }`}>
                    {f.icono}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{f.titulo}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.descripcion}</p>

                  {/* Diamond premium callout */}
                  {f.diamante && (
                    <div className="mt-5 pt-4 border-t border-purple-100 dark:border-purple-800/30">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-sm">
                          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Modo Premium con Diamantes
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            Usa tus diamantes para generar el horario óptimo priorizando a los profesores mejor evaluados.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ HOW IT WORKS ═══════ */}
        <section id="como-usar" className="bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-ipn-guinda-900 dark:text-ipn-guinda-400 uppercase tracking-widest mb-3">Instalación</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Listo en 2 minutos</h2>
            </div>

            <div className="relative">
              {/* Vertical line connector */}
              <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-ipn-guinda-300 via-ipn-guinda-200 to-transparent dark:from-ipn-guinda-600 dark:via-ipn-guinda-800 hidden sm:block" />

              <div className="space-y-8">
                {[
                  { n: 1, titulo: 'Instala la extensión', desc: 'Descárgala desde la Chrome Web Store haciendo clic en "Agregar a Chrome". Es gratis y pesa menos de 1 MB.' },
                  { n: 2, titulo: 'Fija el ícono', desc: 'Haz clic en el rompecabezas de extensiones en Chrome y fija IPNProfes para tener acceso rápido desde la barra del navegador.' },
                  { n: 3, titulo: 'Entra al SAES', desc: 'Ingresa al SAES como siempre. La extensión se activa automáticamente en las páginas compatibles — no necesitas hacer nada más.' },
                  { n: 4, titulo: 'Usa todas las funciones', desc: 'Verás la barra de búsqueda, el generador de horarios y las calificaciones de profesores integradas directamente en las páginas.' },
                ].map((paso) => (
                  <div key={paso.n} className="flex gap-5 items-start">
                    <div className="relative z-10 shrink-0 w-12 h-12 bg-ipn-guinda-900 dark:bg-ipn-guinda-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md shadow-ipn-guinda-900/20">
                      {paso.n}
                    </div>
                    <div className="pt-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{paso.titulo}</h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{paso.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ COMPATIBILITY ═══════ */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-ipn-guinda-900 dark:text-ipn-guinda-400 uppercase tracking-widest mb-3">Compatibilidad</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Funciona donde lo necesitas</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Browsers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                  </svg>
                </div>
                Navegadores
              </h3>
              <div className="space-y-3">
                {navegadores.map((nav) => (
                  <div key={nav.nombre} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{nav.nombre}</span>
                    </div>
                    {nav.version && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{nav.version}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SAES pages */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-ipn-guinda-50 dark:bg-ipn-guinda-900/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-ipn-guinda-900 dark:text-ipn-guinda-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Páginas del SAES
              </h3>
              <div className="space-y-3">
                {paginasSAES.map((pagina) => (
                  <div key={pagina} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{pagina}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ FAQ ═══════ */}
        <section className="bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-ipn-guinda-900 dark:text-ipn-guinda-400 uppercase tracking-widest mb-3">FAQ</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Preguntas Frecuentes</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setFaqAbierto(faqAbierto === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="font-medium text-gray-900 dark:text-white pr-4">{faq.pregunta}</span>
                    <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${faqAbierto === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {faqAbierto === i && (
                    <div className="px-6 pb-5">
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{faq.respuesta}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ FINAL CTA ═══════ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-ipn-guinda-900 to-ipn-guinda-800 dark:from-gray-800 dark:to-gray-900">
          <div className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Pronto disponible en Chrome Web Store
            </h2>
            <p className="text-base text-white/70 max-w-xl mx-auto mb-6">
              La extensión está en proceso de validación. Mientras tanto, explora todas las funciones que tendrá.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white/60 bg-white/10 rounded-xl border border-white/20 cursor-default">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              En validación
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ExtensionPage;
