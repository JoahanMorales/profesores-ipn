import { useEffect, useState } from 'react';

const CoinAnimation = ({ amount, onComplete }) => {
  const [coins, setCoins] = useState([]);

  useEffect(() => {
    // Generar monedas con posiciones aleatorias
    const newCoins = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 - 40, // -40 a 40
      y: Math.random() * -100 - 50, // -50 a -150
      rotation: Math.random() * 360,
      delay: i * 0.1
    }));
    setCoins(newCoins);

    // Completar animación después de 2.5s
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Fondo oscuro semi-transparente */}
      <div className="absolute inset-0 bg-black/30 animate-fade-in" />
      
      {/* Contenedor de animación */}
      <div className="relative">
        {/* Monedas animadas */}
        {coins.map((coin) => (
          <div
            key={coin.id}
            className="absolute animate-coin-float"
            style={{
              left: '50%',
              top: '50%',
              animationDelay: `${coin.delay}s`,
              '--coin-x': `${coin.x}px`,
              '--coin-y': `${coin.y}px`,
              '--coin-rotation': `${coin.rotation}deg`
            }}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 via-purple-300 to-pink-300 shadow-xl flex items-center justify-center text-2xl animate-coin-spin relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer opacity-60" 
                   style={{ animation: 'shimmer 1.5s infinite' }} />
              💎
            </div>
          </div>
        ))}

        {/* Texto central */}
        <div className="relative z-10 text-center animate-scale-bounce">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 border-4 border-gradient-to-r from-slate-300 via-purple-300 to-pink-300" 
               style={{ borderImage: 'linear-gradient(135deg, #cbd5e1, #d8b4fe, #f9a8d4) 1' }}>
            <div className="text-6xl font-bold bg-gradient-to-r from-slate-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 animate-pulse">
              +{amount}
            </div>
            <div className="text-xl font-semibold text-gray-700 flex items-center justify-center gap-2">
              <span className="text-3xl">💎</span>
              Monedas Premium
            </div>
            <p className="text-xs text-gray-500 mt-2">Úsalas para funciones exclusivas próximamente</p>
          </div>
        </div>

        {/* Partículas brillantes con efecto arcoíris */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-2 h-2 rounded-full animate-sparkle"
            style={{
              left: '50%',
              top: '50%',
              animationDelay: `${i * 0.1}s`,
              '--sparkle-x': `${Math.cos(i * 30 * Math.PI / 180) * 100}px`,
              '--sparkle-y': `${Math.sin(i * 30 * Math.PI / 180) * 100}px`,
              background: `hsl(${i * 30}, 70%, 60%)`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default CoinAnimation;
