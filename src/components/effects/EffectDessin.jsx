import React from 'react';
import EffectGallery from '../filters/EffectGallery';

/**
 * Composant pour afficher et sélectionner des effets de type dessin
 * Utilise le composant générique EffectGallery et le hook useEffects
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Function} props.onSelect - Fonction appelée lors de la sélection d'un effet
 * @returns {JSX.Element} - Composant React
 */
const EffectDessin = ({ onSelect }) => {
  return <EffectGallery type="dessin" onSelect={onSelect} />;
};

export default EffectDessin;
