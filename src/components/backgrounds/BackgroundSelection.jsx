import React, { useState } from 'react';

// Composant de sélection de background pour bg_removal
const BackgroundSelection = ({ onSelectBackground, onCancel, image }) => {
  const [activeSparkleId, setActiveSparkleId] = useState(null);
  const backgrounds = [
    {
      id: 'bg1',
      name: 'Plage',
      url: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/background_image/pexels-abdghat-1631677.jpg'
    },
    {
      id: 'bg2', 
      name: 'Forêt',
      url: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/background_image/pexels-bruthethe-1910225.jpg'
    },
    {
      id: 'bg3',
      name: 'Ville',
      url: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/background_image/pexels-jaime-reimer-1376930-2662116.jpg'
    },
    {
      id: 'bg4',
      name: 'Espace',
      url: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/background_image/pexels-pixabay-268533.jpg'
    }
  ];

  const handleSelect = (bg) => {
    setActiveSparkleId(bg.id);
    setTimeout(() => {
      onSelectBackground(bg);
    }, 450);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/20 backdrop-blur-sm">
      <style>{`
        @keyframes sparkleBurst {
          0% { transform: scale(0.2); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes sparkleFloat {
          0% { transform: translateY(0) scale(0.7); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateY(-12px) scale(1.1); opacity: 0; }
        }
      `}</style>
      <div className="bg-gray-900 p-6 rounded-2xl max-w-4xl w-full mx-4 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Choisissez un background</h2>
          <button
            onClick={onCancel}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-full"
          >
            Annuler
          </button>
        </div>

        {/* Grille de sélection de backgrounds */}
        <div className="grid grid-cols-2 gap-4">
          {backgrounds.map((bg) => (
            <button
              key={bg.id}
              onClick={() => handleSelect(bg)}
              className="relative group overflow-hidden rounded-xl border border-white/10 hover:border-yellow-300/80 transition-all focus:outline-none"
            >
              <img
                src={bg.url}
                alt={bg.name}
                className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-2 left-3 text-left">
                <p className="text-white text-sm font-semibold tracking-wide">{bg.name}</p>
              </div>
              {activeSparkleId === bg.id && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border border-yellow-200/60 rounded-xl" style={{ animation: 'sparkleBurst 0.45s ease-out' }} />
                  {[...Array(6)].map((_, i) => (
                    <span
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-yellow-200 shadow-[0_0_12px_rgba(255,236,153,0.9)]"
                      style={{
                        top: `${20 + i * 8}%`,
                        left: `${15 + i * 12}%`,
                        animation: `sparkleFloat 0.45s ease-out ${i * 0.03}s`
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BackgroundSelection;
