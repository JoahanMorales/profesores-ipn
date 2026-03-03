import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useSEO } from '../hooks/useSEO';
import { obtenerEventos, obtenerEventoPorSlug } from '../services/supabaseService';

const categoriasColor = {
  'Académico': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Exposición': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Deportivo': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'Tecnología': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Institucional': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'Emprendimiento': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'General': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
};

const formatFecha = (fechaStr) => {
  if (!fechaStr) return '';
  return new Date(fechaStr + 'T00:00:00').toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatFechaRango = (inicio, fin) => {
  if (!inicio) return '';
  const fi = formatFecha(inicio);
  if (!fin || fin === inicio) return fi;
  const ff = formatFecha(fin);
  return `${fi} — ${ff}`;
};

/* ========== EVENTO DETALLE ========== */
const EventoDetalle = ({ slug }) => {
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);

  useSEO(
    evento ? `${evento.titulo} | Eventos ip` : 'Evento | ip',
    evento?.descripcion || 'Evento de la comunidad politécnica del IPN.',
    'eventos IPN, comunidad politécnica, actividades IPN',
    evento ? {
      ogImage: `https://ipnprofes.com/api/og-image/evento?titulo=${encodeURIComponent(evento.titulo)}&fecha=${encodeURIComponent(evento.fecha_inicio || '')}&lugar=${encodeURIComponent(evento.lugar || '')}&hora=${encodeURIComponent(evento.hora || '')}&categoria=${encodeURIComponent(evento.categoria || 'General')}&destacado=${evento.destacado ? 'true' : 'false'}`,
      ogUrl: `https://ipnprofes.com/eventos/${slug}`,
      ogType: 'event',
    } : {}
  );

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      const res = await obtenerEventoPorSlug(slug);
      if (res.success) setEvento(res.data);
      setLoading(false);
    };
    cargar();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-ipn-guinda-900 dark:border-ipn-guinda-400"></div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Evento no encontrado</h2>
        <Link to="/eventos" className="text-ipn-guinda-900 dark:text-ipn-guinda-400 hover:underline">
          ← Volver a eventos
        </Link>
      </div>
    );
  }

  const renderContenido = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;
      if (trimmed.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400 mt-8 mb-3">{trimmed.slice(3)}</h2>;
      if (trimmed.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-2">{trimmed.slice(4)}</h3>;
      if (trimmed.startsWith('- ')) return <li key={i} className="ml-5 text-gray-600 dark:text-gray-300 mb-1 list-disc">{trimmed.slice(2)}</li>;
      const parts = trimmed.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-gray-900 dark:text-white">{part}</strong> : part)}
        </p>
      );
    });
  };

  return (
    <article className="max-w-3xl mx-auto">
      <Link
        to="/eventos"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-ipn-guinda-900 dark:hover:text-ipn-guinda-400 mb-8 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a eventos
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoriasColor[evento.categoria] || categoriasColor['General']}`}>
          {evento.categoria}
        </span>
        {evento.destacado && (
          <span className="text-xs text-ipn-guinda-600 dark:text-ipn-guinda-400 font-semibold bg-ipn-guinda-50 dark:bg-ipn-guinda-900/20 px-2 py-1 rounded">
            DESTACADO
          </span>
        )}
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">{evento.titulo}</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-ipn-guinda-900 dark:text-ipn-guinda-400 mb-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wide">Fecha</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{formatFechaRango(evento.fecha_inicio, evento.fecha_fin)}</p>
        </div>

        {evento.hora && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-ipn-guinda-900 dark:text-ipn-guinda-400 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wide">Horario</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{evento.hora}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-ipn-guinda-900 dark:text-ipn-guinda-400 mb-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wide">Lugar</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{evento.lugar}</p>
        </div>
      </div>

      {evento.link_externo && (
        <div className="mb-8">
          <a
            href={evento.link_externo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-ipn-guinda-900 dark:bg-ipn-guinda-700 rounded-lg hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-colors shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Registro / Más información
          </a>
        </div>
      )}

      {/* Contributor info */}
      {evento.nombre_contribuidor && (
        <div className="flex items-center gap-3 mb-6 p-3 bg-ipn-guinda-50 dark:bg-ipn-guinda-900/20 border border-ipn-guinda-200 dark:border-ipn-guinda-800 rounded-lg">
          <div className="w-8 h-8 bg-ipn-guinda-100 dark:bg-ipn-guinda-900/40 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400">
              {evento.nombre_contribuidor.charAt(0)}
            </span>
          </div>
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">{evento.nombre_contribuidor}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-ipn-guinda-100 text-ipn-guinda-800 dark:bg-ipn-guinda-900/30 dark:text-ipn-guinda-300">
                Comunidad
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {evento.escuela_contribuidor && <span>{evento.escuela_contribuidor}</span>}
              {evento.instagram_contribuidor && (
                <a href={`https://instagram.com/${evento.instagram_contribuidor.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-ipn-guinda-600 dark:hover:text-ipn-guinda-400 transition-colors">
                  {evento.escuela_contribuidor ? '• ' : ''}{evento.instagram_contribuidor}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">{evento.descripcion}</p>
      </div>

      {evento.contenido && (
        <div className="prose prose-gray dark:prose-invert max-w-none">
          {renderContenido(evento.contenido)}
        </div>
      )}
    </article>
  );
};

/* ========== LISTA DE EVENTOS ========== */
const EventosList = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');

  useSEO(
    'Eventos de la Comunidad IPN | ip',
    'Próximos eventos, conferencias, hackatones y actividades de la comunidad politécnica del IPN.',
    'eventos IPN, comunidad politécnica, hackatón IPN, actividades estudiantiles IPN'
  );

  useEffect(() => {
    const cargar = async () => {
      const res = await obtenerEventos();
      if (res.success) setEventos(res.data);
      setLoading(false);
    };
    cargar();
  }, []);

  const categorias = ['Todos', ...new Set(eventos.map(e => e.categoria))];
  const eventosFiltrados = filtroCategoria === 'Todos'
    ? eventos
    : eventos.filter(e => e.categoria === filtroCategoria);

  const eventosDestacados = eventosFiltrados.filter(e => e.destacado);
  const eventosNormales = eventosFiltrados.filter(e => !e.destacado);

  return (
    <>
      {/* Contact CTA — compact inline */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3.5 mb-10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-semibold text-gray-900 dark:text-white">¿Tienes un evento?</span> Compártelo con la comunidad.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="mailto:ipnprofes@gmail.com?subject=Sugerencia de evento IPN"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-ipn-guinda-900 dark:bg-ipn-guinda-700 text-white rounded-md hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            ipnprofes@gmail.com
          </a>
          <a
            href="https://instagram.com/joahan_morap"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            @joahan_morap
          </a>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Eventos de la Comunidad
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Mantente al día con los próximos eventos, conferencias, torneos y actividades de la comunidad politécnica.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltroCategoria(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtroCategoria === cat
                ? 'bg-ipn-guinda-900 dark:bg-ipn-guinda-700 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-ipn-guinda-900 dark:border-ipn-guinda-400"></div>
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No hay eventos próximos</h3>
          <p className="text-gray-500 dark:text-gray-400">Vuelve pronto para ver nuevos eventos.</p>
        </div>
      ) : (
        <>
          {eventosDestacados.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Destacados
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {eventosDestacados.map((evento) => (
                  <Link
                    key={evento.id}
                    to={`/eventos/${evento.slug}`}
                    className="bg-white dark:bg-gray-800 rounded-xl border-2 border-ipn-guinda-200 dark:border-ipn-guinda-700 p-6 shadow-lg hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoriasColor[evento.categoria] || categoriasColor['General']}`}>
                        {evento.categoria}
                      </span>
                      <span className="text-xs text-ipn-guinda-600 dark:text-ipn-guinda-400 font-semibold bg-ipn-guinda-50 dark:bg-ipn-guinda-900/20 px-2 py-1 rounded">
                        Destacado
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-ipn-guinda-900 dark:group-hover:text-ipn-guinda-400 transition-colors">
                      {evento.titulo}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatFechaRango(evento.fecha_inicio, evento.fecha_fin)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {evento.lugar}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">{evento.descripcion}</p>
                    {evento.link_externo && (
                      <div className="mt-4 flex items-center gap-1 text-xs text-ipn-guinda-700 dark:text-ipn-guinda-400 font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Registro disponible
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {eventosNormales.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Próximos Eventos
              </h2>
              <div className="space-y-4">
                {eventosNormales.map((evento) => (
                  <Link
                    key={evento.id}
                    to={`/eventos/${evento.slug}`}
                    className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-ipn-guinda-300 dark:hover:border-ipn-guinda-600 transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="shrink-0 w-16 h-16 bg-ipn-guinda-50 dark:bg-ipn-guinda-900/20 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs text-ipn-guinda-600 dark:text-ipn-guinda-400 font-medium uppercase">
                          {new Date(evento.fecha_inicio + 'T00:00:00').toLocaleDateString('es-MX', { month: 'short' })}
                        </span>
                        <span className="text-xl font-bold text-ipn-guinda-900 dark:text-ipn-guinda-300">
                          {new Date(evento.fecha_inicio + 'T00:00:00').getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-ipn-guinda-900 dark:group-hover:text-ipn-guinda-400 transition-colors">
                            {evento.titulo}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoriasColor[evento.categoria] || categoriasColor['General']}`}>
                            {evento.categoria}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatFechaRango(evento.fecha_inicio, evento.fecha_fin)}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {evento.lugar}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">{evento.descripcion}</p>
                      </div>
                      <div className="hidden sm:flex shrink-0 items-center">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-ipn-guinda-900 dark:group-hover:text-ipn-guinda-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
};

/* ========== MAIN COMPONENT ========== */
const EventosPage = () => {
  const { slug } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {slug ? <EventoDetalle slug={slug} /> : <EventosList />}
      </main>
      <Footer />
    </div>
  );
};

export default EventosPage;
