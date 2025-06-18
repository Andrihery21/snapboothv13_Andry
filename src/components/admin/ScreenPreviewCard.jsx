import React from 'react';
import { motion } from 'framer-motion';

const getScreenDimensions = (screenType) => {
  switch (screenType) {
    case 'horizontal':
      return { width: 16, height: 9, className: 'w-full aspect-video' };
    case 'vertical_1':
    case 'vertical_2':
    case 'vertical_3':
      return { width: 9, height: 16, className: 'w-3/4 mx-auto aspect-[9/16]' };
    default:
      return { width: 16, height: 9, className: 'w-full aspect-video' };
  }
};

const getFilterStyle = (filterName) => {
  switch (filterName) {
    case 'univers':
      return { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', icon: '🌌', name: 'Univers' };
    case 'dessin':
      return { background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', icon: '🎨', name: 'Dessin' };
    case 'caricature':
      return { background: 'linear-gradient(135deg, #10b981, #34d399)', icon: '👤', name: 'Caricature' };
    case 'cartoon':
      return { background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', icon: '🦸‍♂️', name: 'Cartoon' };
    // Pour la compatibilité avec les anciens noms
    case 'EffectUnivers':
      return { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', icon: '🌌', name: 'Univers' };
    case 'EffectDessin':
      return { background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', icon: '🎨', name: 'Dessin' };
    case 'EffectCaricature':
      return { background: 'linear-gradient(135deg, #10b981, #34d399)', icon: '👤', name: 'Caricature' };
    case 'EffectCartoon':
      return { background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', icon: '🦸‍♂️', name: 'Cartoon' };
    default:
      return { background: 'linear-gradient(135deg, #6b7280, #9ca3af)', icon: '📷', name: 'Standard' };
  }
};

export default function ScreenPreviewCard({ 
  screenType = 'horizontal',
  filterName = '',
  overlayUrl = '',
  brandingColor = '#6366f1',
  displayLogoUrl = '',
  captureCountdown = 3,
  active = true,
  onClick,
  className = ''
}) {
  const { className: dimensionClass } = getScreenDimensions(screenType);
  const filterStyle = getFilterStyle(filterName);
  
  return (
    <div 
      className={`relative rounded-xl overflow-hidden shadow-lg ${className} ${active ? '' : 'opacity-60'}`}
      onClick={onClick}
    >
      <div 
        className={`${dimensionClass} relative`}
        style={{ background: filterStyle.background }}
      >
        {/* Overlay */}
        {overlayUrl && (
          <img 
            src={overlayUrl} 
            alt="Overlay" 
            className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
          />
        )}
        
        {/* Contenu de l'écran */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-20">
          {/* Logo */}
          {displayLogoUrl && (
            <div className="absolute top-4 left-4">
              <img 
                src={displayLogoUrl} 
                alt="Logo" 
                className="h-8 object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAxaDAtMjN2MjJoMjN2LTIyem0tMSAyMWgtMjF2LTIwaDIxdjIwem0tMy0zaC0xNXYtMWgxNXYxem0wLTJoLTE1di0xaDE1djF6bTAtMmgtMTV2LTFoMTV2MXptLTktNmgtNnYtNmg2djZ6bS0xLTVoLTR2NGg0di00em0xIDExaC02di0xaDZ2MXoiLz48L3N2Zz4=';
                }}
              />
            </div>
          )}
          
          {/* Indicateur de filtre */}
          <div className="mb-4 bg-black bg-opacity-30 px-3 py-1 rounded-full flex items-center">
            <span className="text-lg mr-1">{filterStyle.icon}</span>
            <span className="text-white text-sm font-medium">{filterStyle.name}</span>
          </div>
          
          {/* Cercle de capture avec animation */}
          <motion.div 
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: brandingColor || '#6366f1' }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="text-white text-2xl font-bold">{captureCountdown}</div>
          </motion.div>
        </div>
      </div>
      
      {/* Barre d'état */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white px-3 py-1 text-xs flex justify-between items-center">
        <div className="flex items-center">
          <span className={`mr-1 h-2 w-2 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>{active ? 'Actif' : 'Inactif'}</span>
        </div>
        <div>
          {screenType === 'horizontal' ? '1920×1080' : '1080×1920'}
        </div>
      </div>
      
      {/* Bouton d'édition */}
      <button 
        className="absolute top-2 right-2 bg-white bg-opacity-80 text-gray-700 hover:text-gray-900 p-2 rounded-full shadow-md z-30"
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick();
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
    </div>
  );
}
