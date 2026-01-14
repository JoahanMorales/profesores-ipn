import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load components for better performance
const LandingPage = lazy(() => import('./components/LandingPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const SearchPage = lazy(() => import('./components/SearchPage'));
const ProfesorProfile = lazy(() => import('./components/ProfesorProfile'));
const EvaluationForm = lazy(() => import('./components/EvaluationForm'));
const NotFound = lazy(() => import('./components/NotFound'));

// Componente para proteger rutas
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Rutas protegidas */}
            <Route 
              path="/buscar" 
              element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profesor/:slug" 
              element={
                <ProtectedRoute>
                  <ProfesorProfile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/evaluar" 
              element={
                <ProtectedRoute>
                  <EvaluationForm />
                </ProtectedRoute>
              } 
            />

            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
