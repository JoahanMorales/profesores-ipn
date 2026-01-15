import { createContext, useContext, useState, useEffect } from 'react';
import { getAnonymousUserInfo, getDeviceId, generateAnonymousUsername } from '../lib/browserFingerprint';
import { crearOObtenerUsuario } from '../services/supabaseService';

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

    // Verificar si hay una sesión guardada en SessionStorage
    const savedUser = sessionStorage.getItem('ipn_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setMonedas(userData.monedas || 0);
      
      console.log('✅ Sesión restaurada', {
        username: userData.username,
        deviceId: deviceData.deviceId.substring(0, 15) + '...',
        browser: deviceData.browser.name,
        os: deviceData.browser.os
      });
    }
    setLoading(false);
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
        console.log('🚫 Canción incorrecta para usuario existente');
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
      
      sessionStorage.setItem('ipn_user', JSON.stringify(userData));
      setUser(userData);
      setMonedas(userData.monedas);
      
      console.log('🔐 Login exitoso:', {
        username,
        userId: dbUser.id,
        monedas: userData.monedas,
        evaluaciones: userData.totalEvaluaciones,
        deviceId: userData.deviceId.substring(0, 15) + '...',
        browser: `${userData.browserInfo.name} ${userData.browserInfo.version}`
      });

      return true;
    } catch (error) {
      console.error('❌ Error en login:', error);
      return false;
    }
  };

  const updateMonedas = (nuevasMonedas) => {
    const updatedUser = { ...user, monedas: nuevasMonedas };
    sessionStorage.setItem('ipn_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setMonedas(nuevasMonedas);
  };

  const logout = () => {
    console.log('🚪 Sesión cerrada:', {
      username: user?.username,
      deviceId: user?.deviceId?.substring(0, 15) + '...',
      duration: user?.loginTime ? Math.floor((Date.now() - new Date(user.loginTime).getTime()) / 1000 / 60) + ' minutos' : 'unknown'
    });
    
    sessionStorage.removeItem('ipn_user');
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
