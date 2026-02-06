import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoadingSpinner from './components/LoadingSpinner';
import ThemeToggle from './components/ThemeToggle';

// Lazy load components for better performance
const LandingPage = lazy(() => import('./components/LandingPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const SearchPage = lazy(() => import('./components/SearchPage'));
const ProfesorProfile = lazy(() => import('./components/ProfesorProfile'));
const EvaluationForm = lazy(() => import('./components/EvaluationForm'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const ReportPage = lazy(() => import('./components/ReportPage'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const NotFound = lazy(() => import('./components/NotFound'));
const DatosProfesores = lazy(() => import('./components/DatosProfesores'));
const DatosProfesor = lazy(() => import('./components/DatosProfesor'));

// Componente para proteger rutas
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ThemeToggle />
          <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/terminos" element={<TermsOfService />} />
            <Route path="/privacidad" element={<PrivacyPolicy />} />
            <Route path="/reportar" element={<ReportPage />} />
            <Route path="/buscar" element={<SearchPage />} />
            <Route path="/profesor/:slug" element={<ProfesorProfile />} />
            <Route path="/datos/profesores" element={<DatosProfesores />} />
            <Route path="/datos/profesor/:slug" element={<DatosProfesor />} />
            
            {/* Rutas protegidas (solo evaluar y admin) */}
            <Route 
              path="/evaluar" 
              element={
                <ProtectedRoute>
                  <EvaluationForm />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />

            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
