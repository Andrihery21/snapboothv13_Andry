import React from 'react';
import EffectGallery from '../filters/EffectGallery';

/**
 * Composant pour afficher et sélectionner des effets de type caricature
 * Utilise le composant générique EffectGallery et le hook useEffects
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Function} props.onSelect - Fonction appelée lors de la sélection d'un effet
 * @returns {JSX.Element} - Composant React
 */
const EffectCaricature = ({ onSelect }) => {
  return <EffectGallery type="caricature" onSelect={onSelect} />;
};

export default EffectCaricature;
