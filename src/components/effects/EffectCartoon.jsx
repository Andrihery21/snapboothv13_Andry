import React from 'react';
import EffectGallery from '../filters/EffectGallery';

/**
 * Composant pour afficher et sélectionner des effets de type cartoon
 * Utilise le composant générique EffectGallery et le hook useEffects
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Function} props.onSelect - Fonction appelée lors de la sélection d'un effet
 * @returns {JSX.Element} - Composant React
 */
const EffectCartoon = ({ onSelect }) => {
  return <EffectGallery type="cartoon" onSelect={onSelect} />;
};

export default EffectCartoon;
