import { createClient } from '@supabase/supabase-js';

// Obtener las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Faltan las credenciales de Supabase en el archivo .env');
  console.log('Asegúrate de tener:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_ANON_KEY');
}

// Crear el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Función helper para manejar errores
export const handleSupabaseError = (error, context = '') => {
  console.error(`❌ Error en Supabase ${context}:`, error);
  return {
    success: false,
    error: error.message || 'Error desconocido',
    details: error
  };
};

// Función helper para respuestas exitosas
export const handleSupabaseSuccess = (data, message = 'Operación exitosa') => {
  console.log(`✅ ${message}`, data);
  return {
    success: true,
    data,
    message
  };
};
