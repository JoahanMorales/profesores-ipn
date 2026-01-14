import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Validator, LIMITS } from '../lib/validators';
import { getAnonymousUserInfo } from '../lib/browserFingerprint';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    favoriteSong: ''
  });
  const [errors, setErrors] = useState({});
  const [charCounts, setCharCounts] = useState({
    username: 0,
    favoriteSong: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Aplicar límites máximos
    let limitedValue = value;
    if (name === 'username' && value.length > LIMITS.USERNAME.MAX) {
      limitedValue = value.slice(0, LIMITS.USERNAME.MAX);
    }
    if (name === 'favoriteSong' && value.length > LIMITS.FAVORITE_SONG.MAX) {
      limitedValue = value.slice(0, LIMITS.FAVORITE_SONG.MAX);
    }

    setFormData(prev => ({
      ...prev,
      [name]: limitedValue
    }));

    // Actualizar contador de caracteres
    setCharCounts(prev => ({
      ...prev,
      [name]: limitedValue.length
    }));
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    return Validator.loginForm(formData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log('📝 Intento de login:', {
      username: formData.username,
      favoriteSong: '***HIDDEN***',
      timestamp: new Date().toISOString()
    });

    // Sanitizar antes de enviar
    const sanitizedUsername = Validator.sanitize(formData.username);
    const sanitizedSong = Validator.sanitize(formData.favoriteSong);

    login(sanitizedUsername, sanitizedSong);
    navigate('/buscar');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold mb-2">
          <span className="text-ipn-guinda-900">i</span>
          <span className="text-gray-900">p</span>
        </h1>
        <h2 className="text-center text-xl text-gray-600">
          Iniciar Sesión Anónima
        </h2>
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-lg">🔒</span>
            <div className="text-xs text-gray-700">
              <p className="font-semibold text-blue-900 mb-1">100% Anónimo y Seguro</p>
              <p className="text-gray-600">Tu identidad está protegida. No guardamos información personal identificable. Respetamos completamente la privacidad e integridad de tus datos.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label 
                  htmlFor="username" 
                  className="block text-sm font-medium text-gray-900"
                >
                  Nombre de Usuario
                </label>
                <span className="text-xs text-gray-500">
                  {charCounts.username}/{LIMITS.USERNAME.MAX}
                </span>
              </div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                maxLength={LIMITS.USERNAME.MAX}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ipn-guinda-600 focus:border-transparent transition-colors ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Tu nombre de usuario"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-600">{errors.username}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Solo letras, números, guiones y guión bajo. Mínimo {LIMITS.USERNAME.MIN} caracteres.
              </p>
            </div>

            {/* Favorite Song Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label 
                  htmlFor="favoriteSong" 
                  className="block text-sm font-medium text-gray-900"
                >
                  Tu canción favorita (sin espacios)
                </label>
                <span className="text-xs text-gray-500">
                  {charCounts.favoriteSong}/{LIMITS.FAVORITE_SONG.MAX}
                </span>
              </div>
              <input
                id="favoriteSong"
                name="favoriteSong"
                type="password"
                autoComplete="current-password"
                value={formData.favoriteSong}
                onChange={handleChange}
                maxLength={LIMITS.FAVORITE_SONG.MAX}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors ${
                  errors.favoriteSong ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ejemplo: BohemianRhapsody"
              />
              {errors.favoriteSong && (
                <p className="mt-1 text-xs text-red-600">{errors.favoriteSong}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Escribe el nombre de tu canción favorita sin espacios (mínimo {LIMITS.FAVORITE_SONG.MIN} caracteres)
              </p>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ipn-guinda-900 hover:bg-ipn-guinda-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ipn-guinda-700 transition-colors"
              >
                Ingresar
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full flex justify-center py-2.5 px-4 border-2 border-gray-900 rounded-md shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
