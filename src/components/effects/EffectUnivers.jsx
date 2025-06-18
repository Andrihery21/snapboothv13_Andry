import React from 'react';
import EffectGallery from '../filters/EffectGallery';

/**
 * Composant pour afficher et sélectionner des effets de type univers
 * Utilise le composant générique EffectGallery et le hook useEffects
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Function} props.onSelect - Fonction appelée lors de la sélection d'un effet
 * @returns {JSX.Element} - Composant React
 */
const EffectUnivers = ({ onSelect }) => {
  return <EffectGallery type="univers" onSelect={onSelect} />;
};

export default EffectUnivers;
