import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, monedas, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/buscar', label: 'Buscar Profes' },
    { to: '/evaluar', label: 'Evaluar' },
    { to: '/extension', label: 'Extensión' },
    { to: '/eventos', label: 'Eventos' },
    { to: '/blog', label: 'Blog' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <img src="/logo_ipnp.svg" alt="IPNProfes" className="h-7 w-7" />
            <span className="text-2xl font-bold">
              <span className="text-ipn-guinda-900 dark:text-ipn-guinda-400">i</span>
              <span className="text-gray-900 dark:text-white">p</span>
            </span>
          </Link>

          {/* Desktop Nav Links — centered */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-ipn-guinda-50 dark:bg-ipn-guinda-900/30 text-ipn-guinda-900 dark:text-ipn-guinda-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated() ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-slate-200 via-purple-300 to-pink-300 dark:from-slate-700 dark:via-purple-600 dark:to-pink-600 rounded-full shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white dark:via-gray-300 to-transparent animate-shimmer opacity-40" />
                  <span className="text-lg relative z-10">💎</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white relative z-10">{monedas}</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Hola, <span className="font-medium">{user.username}</span>
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-white bg-ipn-guinda-900 dark:bg-ipn-guinda-700 rounded-md hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate(`/login?returnTo=${encodeURIComponent(location.pathname)}`)}
                className="px-4 py-2 text-sm font-medium text-white bg-ipn-guinda-900 dark:bg-ipn-guinda-700 rounded-md hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-colors"
              >
                Iniciar Sesión
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 dark:border-gray-700 mt-2 pt-3">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-ipn-guinda-50 dark:bg-ipn-guinda-900/30 text-ipn-guinda-900 dark:text-ipn-guinda-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile Auth */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              {isAuthenticated() ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-slate-200 via-purple-300 to-pink-300 dark:from-slate-700 dark:via-purple-600 dark:to-pink-600 rounded-full shadow-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white dark:via-gray-300 to-transparent animate-shimmer opacity-40" />
                      <span className="text-lg relative z-10">💎</span>
                      <span className="font-bold text-sm text-gray-900 dark:text-white relative z-10">{monedas}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Hola, <span className="font-medium">{user.username}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="mx-3 px-4 py-2 text-sm font-medium text-white bg-ipn-guinda-900 dark:bg-ipn-guinda-700 rounded-md hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { navigate(`/login?returnTo=${encodeURIComponent(location.pathname)}`); setMobileMenuOpen(false); }}
                  className="mx-3 px-4 py-2 text-sm font-medium text-white bg-ipn-guinda-900 dark:bg-ipn-guinda-700 rounded-md hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 transition-colors w-[calc(100%-1.5rem)]"
                >
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
