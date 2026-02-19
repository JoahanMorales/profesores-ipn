import { useNavigate } from 'react-router-dom';

const Contact = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <nav className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="text-sm font-medium">Volver</span>
          </button>
        </nav>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Contacto</h1>
          <p className="text-gray-700 mb-6">Si deseas contactarme, aquí están mis datos:</p>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800">Correo</h3>
              <p className="text-gray-600">ipnprofes@gmail.com</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-800">Instagram</h3>
              <p className="text-gray-600">@joahan_morap</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-800">Nota</h3>
              <p className="text-gray-600">No incluyo elementos decorativos. Solo contacto directo.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
