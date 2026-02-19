import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useSEO } from '../hooks/useSEO';
import { obtenerArticulos, obtenerArticuloPorSlug } from '../services/supabaseService';

const categoriaColor = {
  'Historia': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'Guías': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Datos': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'General': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'Tecnología': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Noticias': 'bg-ipn-guinda-100 text-ipn-guinda-800 dark:bg-ipn-guinda-900/30 dark:text-ipn-guinda-300',
};

/* ---------- BLOG LIST ---------- */
const BlogList = () => {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('Todos');

  useSEO(
    'Blog | ip - Artículos sobre el IPN',
    'Lee artículos sobre la historia del SAES, datos importantes del IPN, guías para estudiantes y más.',
    'blog IPN, historia SAES, datos IPN, guía estudiantes politécnico'
  );

  useEffect(() => {
    const cargar = async () => {
      const res = await obtenerArticulos();
      if (res.success) setArticulos(res.data);
      setLoading(false);
    };
    cargar();
  }, []);

  const categorias = ['Todos', ...new Set(articulos.map(a => a.categoria))];
  const articulosFiltrados = filtro === 'Todos'
    ? articulos
    : articulos.filter(a => a.categoria === filtro);

  // First article as featured
  const articuloDestacado = articulosFiltrados[0];
  const restoArticulos = articulosFiltrados.slice(1);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-ipn-guinda-900 dark:border-ipn-guinda-400"></div>
      </div>
    );
  }

  return (
    <>
      {/* Submit article CTA — compact */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3.5 mb-10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-semibold text-gray-900 dark:text-white">¿Quieres escribir un artículo?</span> Publica con tu nombre en el blog de IPNProfes.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="mailto:ipnprofes@gmail.com?subject=Quiero publicar un artículo en IPNProfes&body=Hola, me gustaría enviar un artículo para el blog de IPNProfes.%0A%0ANombre:%0AEscuela:%0AInstagram (opcional):%0ATema del artículo:%0A"
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
          Blog
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Artículos, guías y datos interesantes sobre la vida politécnica, el SAES y la comunidad del IPN.
        </p>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltro(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtro === cat
                ? 'bg-ipn-guinda-900 dark:bg-ipn-guinda-700 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {articulosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No hay artículos</h3>
          <p className="text-gray-500 dark:text-gray-400">Pronto habrá contenido nuevo.</p>
        </div>
      ) : (
        <>
          {/* Featured article */}
          {articuloDestacado && (
            <Link
              to={`/blog/${articuloDestacado.slug}`}
              className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all group mb-10"
            >
              <div className="p-8 sm:p-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoriaColor[articuloDestacado.categoria] || categoriaColor['General']}`}>
                    {articuloDestacado.categoria}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {articuloDestacado.tiempo_lectura}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-ipn-guinda-900 dark:group-hover:text-ipn-guinda-400 transition-colors">
                  {articuloDestacado.titulo}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-base mb-6 max-w-3xl leading-relaxed">
                  {articuloDestacado.resumen}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-ipn-guinda-100 dark:bg-ipn-guinda-900/30 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400">
                        {articuloDestacado.autor?.charAt(0) || 'I'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{articuloDestacado.autor}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(articuloDestacado.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-ipn-guinda-900 dark:text-ipn-guinda-400 group-hover:underline">
                    Leer artículo →
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Grid of remaining articles */}
          {restoArticulos.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restoArticulos.map((art) => (
                <Link
                  key={art.id}
                  to={`/blog/${art.slug}`}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-ipn-guinda-300 dark:hover:border-ipn-guinda-600 hover:shadow-lg transition-all group flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${categoriaColor[art.categoria] || categoriaColor['General']}`}>
                      {art.categoria}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {art.tiempo_lectura}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-ipn-guinda-900 dark:group-hover:text-ipn-guinda-400 transition-colors line-clamp-2">
                    {art.titulo}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-5 line-clamp-3 flex-1">
                    {art.resumen}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-ipn-guinda-100 dark:bg-ipn-guinda-900/30 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400">
                          {art.autor?.charAt(0) || 'I'}
                        </span>
                      </div>
                      <span>{art.autor}</span>
                    </div>
                    <span>{new Date(art.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
};

/* ---------- BLOG ARTICLE ---------- */
const BlogArticle = ({ slug }) => {
  const [articulo, setArticulo] = useState(null);
  const [loading, setLoading] = useState(true);

  useSEO(
    articulo ? `${articulo.titulo} | Blog ip` : 'Artículo | Blog ip',
    articulo?.resumen || '',
    'blog IPN, artículo IPN'
  );

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      const res = await obtenerArticuloPorSlug(slug);
      if (res.success) setArticulo(res.data);
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

  if (!articulo) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Artículo no encontrado</h2>
        <Link to="/blog" className="text-ipn-guinda-900 dark:text-ipn-guinda-400 hover:underline">
          ← Volver al blog
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      {/* Back */}
      <Link
        to="/blog"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-ipn-guinda-900 dark:hover:text-ipn-guinda-400 mb-8 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver al blog
      </Link>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${categoriaColor[articulo.categoria] || categoriaColor['General']}`}>
          {articulo.categoria}
        </span>
        <span className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {articulo.tiempo_lectura}
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
        {articulo.titulo}
      </h1>

      {/* Author + date */}
      <div className="flex items-center gap-3 mb-10 pb-8 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-ipn-guinda-100 dark:bg-ipn-guinda-900/30 rounded-full flex items-center justify-center">
          <span className="text-sm font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400">
            {(articulo.nombre_contribuidor || articulo.autor)?.charAt(0) || 'I'}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {articulo.nombre_contribuidor || articulo.autor}
            </p>
            {articulo.nombre_contribuidor && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-ipn-guinda-100 text-ipn-guinda-800 dark:bg-ipn-guinda-900/30 dark:text-ipn-guinda-300">
                Comunidad
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <span>{new Date(articulo.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            {articulo.escuela_contribuidor && (
              <span>• {articulo.escuela_contribuidor}</span>
            )}
            {articulo.instagram_contribuidor && (
              <a href={`https://instagram.com/${articulo.instagram_contribuidor.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-ipn-guinda-600 dark:hover:text-ipn-guinda-400 transition-colors">
                • {articulo.instagram_contribuidor}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Content — rendered as simple markdown-like prose */}
      <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:text-ipn-guinda-900 dark:prose-headings:text-ipn-guinda-400 prose-a:text-ipn-guinda-700 dark:prose-a:text-ipn-guinda-400">
        {articulo.contenido.split('\n').map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <br key={i} />;
          if (trimmed.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-ipn-guinda-900 dark:text-ipn-guinda-400 mt-8 mb-3">{trimmed.replace('## ', '')}</h2>;
          if (trimmed.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-2">{trimmed.replace('### ', '')}</h3>;
          if (trimmed.startsWith('- **')) {
            const text = trimmed.replace('- **', '').replace('**', ' —');
            return <li key={i} className="ml-5 text-gray-600 dark:text-gray-300 mb-1 list-disc">{text}</li>;
          }
          if (trimmed.startsWith('- ')) return <li key={i} className="ml-5 text-gray-600 dark:text-gray-300 mb-1 list-disc">{trimmed.replace('- ', '')}</li>;
          if (trimmed.startsWith('---')) return <hr key={i} className="my-8 border-gray-200 dark:border-gray-700" />;
          if (trimmed.startsWith('*') && trimmed.endsWith('*')) return <p key={i} className="text-gray-500 dark:text-gray-400 italic text-sm mt-4">{trimmed.replace(/\*/g, '')}</p>;
          if (trimmed.startsWith('|')) return null;
          const parts = trimmed.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className="text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
              {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-gray-900 dark:text-white">{part}</strong> : part)}
            </p>
          );
        })}
      </div>

      {/* Share / Back CTA */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <Link
          to="/blog"
          className="text-sm text-ipn-guinda-900 dark:text-ipn-guinda-400 hover:underline font-medium"
        >
          ← Más artículos
        </Link>
        <button
          onClick={() => navigator.clipboard?.writeText(window.location.href)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Copiar enlace
        </button>
      </div>
    </article>
  );
};

/* ---------- MAIN BLOG PAGE ---------- */
const BlogPage = () => {
  const { slug } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {slug ? <BlogArticle slug={slug} /> : <BlogList />}
      </main>
      <Footer />
    </div>
  );
};

export default BlogPage;
