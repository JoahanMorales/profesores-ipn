import { createContext, useContext, useState, useEffect } from 'react';
import { getAnonymousUserInfo, getDeviceId, generateAnonymousUsername } from '../lib/browserFingerprint';
import { crearOObtenerUsuario } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monedas, setMonedas] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    // Obtener información del dispositivo (sin permisos)
    const deviceData = getAnonymousUserInfo();
    setDeviceInfo(deviceData);

    // Verificar si hay una sesión guardada en localStorage (persiste entre sesiones)
    const savedUser = localStorage.getItem('ipn_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setMonedas(userData.monedas || 0);

        // Fetch fresh balance from DB on every page load
        if (userData.username) {
          supabase
            .from('usuarios')
            .select('monedas, total_evaluaciones')
            .eq('username', userData.username)
            .maybeSingle()
            .then(({ data }) => {
              if (data) {
                const freshMonedas = data.monedas ?? 0;
                const freshEvals = data.total_evaluaciones ?? 0;
                setMonedas(freshMonedas);
                setUser(prev => prev ? { ...prev, monedas: freshMonedas, totalEvaluaciones: freshEvals } : prev);
                // Persist to localStorage so session-sync picks it up
                try {
                  const current = JSON.parse(localStorage.getItem('ipn_user') || '{}');
                  current.monedas = freshMonedas;
                  current.totalEvaluaciones = freshEvals;
                  localStorage.setItem('ipn_user', JSON.stringify(current));
                } catch (_) {}
              }
            })
            .catch(() => {});
        }
      } catch (e) {
        localStorage.removeItem('ipn_user');
      }
    }
    setLoading(false);
  }, []);

  // Listen for storage changes (e.g. extension reverse-syncs monedas after payment)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key !== 'ipn_user') return;
      try {
        if (e.newValue) {
          const updated = JSON.parse(e.newValue);
          setUser(prev => prev ? { ...prev, monedas: updated.monedas } : prev);
          setMonedas(updated.monedas || 0);
        }
      } catch (_) {}
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (username, favoriteSong) => {
    try {
      const deviceData = deviceInfo || getAnonymousUserInfo();
      
      // Intentar crear o obtener usuario desde la base de datos
      const resultado = await crearOObtenerUsuario(
        username, 
        favoriteSong, 
        {
          deviceId: deviceData.deviceId,
          fingerprint: deviceData.fingerprint,
          sessionId: deviceData.sessionId,
          browser: deviceData.browser
        }
      );

      if (!resultado.success) {
        console.error('❌ Error al verificar usuario:', resultado.error);
        return false;
      }

      const dbUser = resultado.data;

      // Verificar si el usuario ya existe y la canción coincide
      // Normalizar ambas canciones para comparación (trim, lowercase)
      const cancionDB = dbUser.cancion_favorita?.trim().toLowerCase();
      const cancionIngresada = favoriteSong?.trim().toLowerCase();
      
      if (cancionDB && cancionDB !== cancionIngresada) {
        return false;
      }

      // Usuario válido o nuevo - crear sesión
      const userData = {
        id: dbUser.id,
        username: dbUser.username,
        favoriteSong,
        monedas: dbUser.monedas || 0,
        totalEvaluaciones: dbUser.total_evaluaciones || 0,
        deviceId: deviceData.deviceId,
        fingerprint: deviceData.fingerprint,
        sessionId: deviceData.sessionId,
        browserInfo: deviceData.browser,
        loginTime: new Date().toISOString()
      };
      
      localStorage.setItem('ipn_user', JSON.stringify(userData));
      setUser(userData);
      setMonedas(userData.monedas);

      return true;
    } catch (error) {
      console.error('❌ Error en login:', error);
      return false;
    }
  };

  const updateMonedas = (nuevasMonedas) => {
    const updatedUser = { ...user, monedas: nuevasMonedas };
    localStorage.setItem('ipn_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setMonedas(nuevasMonedas);
  };

  const logout = () => {
    localStorage.removeItem('ipn_user');
    setUser(null);
    setMonedas(0);
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const getDeviceFingerprint = () => {
    return deviceInfo?.deviceId || getDeviceId();
  };

  const value = {
    user,
    monedas,
    loading,
    deviceInfo,
    login,
    logout,
    updateMonedas,
    isAuthenticated,
    getDeviceFingerprint
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
