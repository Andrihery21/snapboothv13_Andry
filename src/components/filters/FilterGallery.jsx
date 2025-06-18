import React from 'react';
import { Loader } from 'lucide-react';
import { useEffects } from '../../hooks/useEffects';

/**
 * Composant générique pour afficher une galerie de filtres
 * Utilise le hook useEffects pour récupérer les données depuis Supabase
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.type - Type de filtre à afficher (cartoon, caricature, dessin, univers)
 * @param {Function} props.onSelect - Fonction appelée lors de la sélection d'un filtre
 * @param {boolean} props.activeOnly - Si true, n'affiche que les filtres actifs
 * @returns {JSX.Element} - Composant React
 */
const FilterGallery = ({ type, onSelect, activeOnly = true }) => {
  // Utiliser le hook personnalisé pour récupérer les filtres
  const { effects: filters, loading, error, refreshEffects } = useEffects(type, activeOnly);

  // Afficher un état de chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="w-8 h-8 text-purple-500 animate-spin" />
        <span className="ml-2 text-purple-500">Chargement des filtres {type}...</span>
      </div>
    );
  }
  
  // Afficher une erreur si nécessaire
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Erreur: {error}</p>
        <p>Impossible de charger les filtres {type}.</p>
        <button 
          onClick={refreshEffects}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }
  
  // Si aucun filtre n'est trouvé
  if (filters.length === 0) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p>Aucun filtre disponible pour la catégorie {type}.</p>
      </div>
    );
  }

  // Rendu normal avec les filtres chargés
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 my-4">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onSelect(filter.value, filter.params)}
          className="bg-purple-800 hover:bg-purple-700 text-white rounded-lg overflow-hidden shadow-md transition-transform transform hover:scale-105"
        >
          <img 
            src={filter.image} 
            alt={filter.label} 
            className="w-full h-32 object-cover" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://via.placeholder.com/150?text=${encodeURIComponent(filter.label)}`;
            }}
          />
          <div className="p-2 text-center font-medium text-sm">{filter.label}</div>
        </button>
      ))}
    </div>
  );
};

export default FilterGallery;
