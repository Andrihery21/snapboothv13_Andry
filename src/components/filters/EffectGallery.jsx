import React from 'react';
import { Loader } from 'lucide-react';
import { useEffects } from '../../hooks/useEffects';

/**
 * Composant générique pour afficher une galerie d'effets
 * Utilise le hook useEffects pour récupérer les données depuis Supabase
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.type - Type d'effet à afficher (cartoon, caricature, dessin, univers)
 * @param {Function} props.onSelect - Fonction appelée lors de la sélection d'un effet
 * @param {boolean} props.activeOnly - Si true, n'affiche que les effets actifs
 * @returns {JSX.Element} - Composant React
 */
const EffectGallery = ({ type, onSelect, activeOnly = true }) => {
  // Utiliser le hook personnalisé pour récupérer les effets
  const { effects, loading, error, refreshEffects } = useEffects(type, activeOnly);

  // Afficher un état de chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="w-8 h-8 text-purple-500 animate-spin" />
        <span className="ml-2 text-purple-500">Chargement des effets {type}...</span>
      </div>
    );
  }

  // Afficher une erreur si nécessaire
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Erreur: {error}</p>
        <p>Impossible de charger les effets {type}.</p>
        <button 
          onClick={refreshEffects}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Si aucun effet n'est trouvé
  if (effects.length === 0) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p>Aucun effet disponible pour la catégorie {type}.</p>
      </div>
    );
  }

  // Rendu normal avec les effets chargés
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 my-4">
      {effects.map((effect) => (
        <button
          key={effect.value}
          onClick={() => onSelect(effect.value, effect.params)}
          className="bg-purple-800 hover:bg-purple-700 text-white rounded-lg overflow-hidden shadow-md transition-transform transform hover:scale-105"
        >
          <img 
            src={effect.image} 
            alt={effect.label} 
            className="w-full h-32 object-cover" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://via.placeholder.com/150?text=${encodeURIComponent(effect.label)}`;
            }}
          />
          <div className="p-2 text-center font-medium text-sm">{effect.label}</div>
        </button>
      ))}
    </div>
  );
};

export default EffectGallery;
