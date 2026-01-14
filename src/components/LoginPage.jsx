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
  const [showPassword, setShowPassword] = useState(false);

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

  const handleSubmit = async (e) => {
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

    // Realizar login con validación de usuario y contraseña
    const success = await login(sanitizedUsername, sanitizedSong);
    
    if (success) {
      navigate('/buscar');
    } else {
      setErrors({ 
        favoriteSong: 'Usuario existente pero la canción no coincide. Verifica tu canción o usa otro nombre de usuario.' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold mb-2">
          <span className="text-ipn-guinda-900 dark:text-ipn-guinda-400">i</span>
          <span className="text-gray-900 dark:text-white">p</span>
        </h1>
        <h2 className="text-center text-xl text-gray-600 dark:text-gray-300">
          Iniciar Sesión Anónima
        </h2>
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-lg">🔒</span>
            <div className="text-xs text-gray-700 dark:text-gray-300">
              <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">100% Anónimo y Seguro</p>
              <p className="text-gray-600 dark:text-gray-400">Tu identidad está protegida. No guardamos información personal identificable. Respetamos completamente la privacidad e integridad de tus datos.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label 
                  htmlFor="username" 
                  className="block text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  Nombre de Usuario
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
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
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ipn-guinda-600 focus:border-transparent transition-colors dark:bg-gray-700 dark:text-white ${
                  errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Tu nombre de usuario"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.username}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Solo letras, números, guiones y guión bajo. Mínimo {LIMITS.USERNAME.MIN} caracteres.
              </p>
            </div>

            {/* Favorite Song Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label 
                  htmlFor="favoriteSong" 
                  className="block text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  Tu canción favorita (sin espacios)
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {charCounts.favoriteSong}/{LIMITS.FAVORITE_SONG.MAX}
                </span>
              </div>
              <div className="relative">
                <input
                  id="favoriteSong"
                  name="favoriteSong"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.favoriteSong}
                  onChange={handleChange}
                  maxLength={LIMITS.FAVORITE_SONG.MAX}
                  className={`w-full px-3 py-2 pr-10 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-colors dark:bg-gray-700 dark:text-white ${
                    errors.favoriteSong ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Ejemplo: BohemianRhapsody"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.favoriteSong && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.favoriteSong}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Escribe el nombre de tu canción favorita sin espacios (mínimo {LIMITS.FAVORITE_SONG.MIN} caracteres)
              </p>
              <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-base">⚠️</span>
                  <div className="text-xs text-gray-700 dark:text-gray-300">
                    <p className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">La canción funciona como contraseña</p>
                    <p className="text-gray-600 dark:text-gray-400">Si el nombre de usuario ya existe, necesitas la canción correcta para acceder. <strong>Las cuentas NO son recuperables</strong> si olvidas tu canción.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ipn-guinda-900 dark:bg-ipn-guinda-700 hover:bg-ipn-guinda-800 dark:hover:bg-ipn-guinda-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ipn-guinda-700 transition-colors"
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
              className="w-full flex justify-center py-2.5 px-4 border-2 border-gray-900 dark:border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-gray-300 transition-colors"
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
