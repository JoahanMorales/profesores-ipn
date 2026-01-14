const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-ipn-guinda-900 mb-4"></div>
      <p className="text-gray-600">Cargando...</p>
    </div>
  </div>
);

export default LoadingSpinner;
