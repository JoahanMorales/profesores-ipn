import { createContext, useContext, useState, useEffect } from 'react';
import { getAnonymousUserInfo, getDeviceId, generateAnonymousUsername } from '../lib/browserFingerprint';

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

  const login = (username, favoriteSong) => {
    const deviceData = deviceInfo || getAnonymousUserInfo();
    
    const userData = {
      username,
      favoriteSong,
      monedas: 0,
      deviceId: deviceData.deviceId,
      fingerprint: deviceData.fingerprint,
      sessionId: deviceData.sessionId,
      browserInfo: deviceData.browser,
      loginTime: new Date().toISOString()
    };
    
    sessionStorage.setItem('ipn_user', JSON.stringify(userData));
    setUser(userData);
    setMonedas(0);
    
    console.log('🔐 Login exitoso (trackeable):', {
      username,
      deviceId: userData.deviceId.substring(0, 15) + '...',
      fingerprint: userData.fingerprint.substring(0, 12) + '...',
      browser: `${userData.browserInfo.name} ${userData.browserInfo.version}`,
      os: userData.browserInfo.os,
      isMobile: userData.browserInfo.isMobile,
      timestamp: userData.loginTime
    });
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
