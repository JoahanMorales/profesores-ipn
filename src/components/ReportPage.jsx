import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ReportPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipo: '',
    descripcion: '',
    email: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí podrías integrar con un servicio de email o backend
    console.log('Reporte enviado:', formData);
    setSubmitted(true);
    
    // Reset después de 3 segundos
    setTimeout(() => {
      setFormData({ tipo: '', descripcion: '', email: '' });
      setSubmitted(false);
    }, 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-[100svh] bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <nav className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Volver</span>
          </button>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportar Contenido</h1>
            <p className="text-gray-600">
              Si encontraste contenido inapropiado, ofensivo o que viola nuestros términos de servicio, 
              por favor repórtalo usando este formulario.
            </p>
          </div>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <svg 
                className="w-12 h-12 text-green-600 mx-auto mb-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <h3 className="text-lg font-semibold text-green-900 mb-1">¡Reporte enviado!</h3>
              <p className="text-green-700 text-sm">
                Gracias por ayudarnos a mantener la plataforma segura. Revisaremos tu reporte pronto.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de reporte */}
              <div>
                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de reporte *
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  required
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ipn-guinda-900 focus:border-transparent transition-all"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="contenido-ofensivo">Contenido ofensivo o inapropiado</option>
                  <option value="informacion-falsa">Información falsa o engañosa</option>
                  <option value="spam">Spam o contenido irrelevante</option>
                  <option value="acoso">Acoso o intimidación</option>
                  <option value="privacidad">Violación de privacidad</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del problema *
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  required
                  rows={6}
                  value={formData.descripcion}
                  onChange={handleChange}
                  maxLength={1000}
                  placeholder="Describe el contenido que deseas reportar, incluyendo el nombre del profesor o cualquier detalle relevante..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ipn-guinda-900 focus:border-transparent transition-all resize-y"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.descripcion.length}/1000 caracteres
                </p>
              </div>

              {/* Email (opcional) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email de contacto (opcional)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ipn-guinda-900 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si deseas que te contactemos sobre el seguimiento de tu reporte
                </p>
              </div>

              {/* Botón de envío */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full px-6 py-3 text-white bg-ipn-guinda-900 rounded-md hover:bg-ipn-guinda-800 focus:outline-none focus:ring-2 focus:ring-ipn-guinda-900 focus:ring-offset-2 transition-colors font-medium"
                >
                  Enviar Reporte
                </button>
              </div>

              {/* Nota de privacidad */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Los reportes son revisados manualmente. 
                  Tu información será tratada de forma confidencial según nuestra{' '}
                  <a href="/privacidad" className="underline hover:text-blue-900">
                    política de privacidad
                  </a>.
                </p>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportPage;
