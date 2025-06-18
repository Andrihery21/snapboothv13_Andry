import React from 'react';

// Composant pour les éléments d'onglet
export const TabItem = ({ icon, label, active, onClick }) => (
  <button
    className={`flex items-center px-4 py-2 rounded-t-lg border-b-2 ${
      active 
        ? 'text-purple-700 border-purple-700 bg-white' 
        : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
    }`}
    onClick={onClick}
  >
    {icon}
    <span className="ml-2">{label}</span>
  </button>
);

/**
 * Composant pour les interrupteurs (toggle switches)
 * @param {Object} props - Propriétés du composant
 * @param {string} props.label - Libellé de l'interrupteur
 * @param {boolean} props.checked - État de l'interrupteur (activé/désactivé)
 * @param {Function} props.onChange - Fonction appelée lors du changement d'état
 * @param {string} [props.description] - Description optionnelle
 * @param {string} [props.id] - ID unique pour l'accessibilité
 * @param {string} [props.className] - Classes CSS additionnelles
 * @param {string} [props.ariaDescribedby] - ID de l'élément qui décrit ce contrôle
 * @returns {JSX.Element} Composant SwitchToggle
 */
export const SwitchToggle = ({ 
  label, 
  checked, 
  onChange, 
  description, 
  id, 
  className = "", 
  ariaDescribedby,
  // Support des anciennes propriétés pour la rétrocompatibilité
  enabled, 
  setEnabled
}) => {
  // Utiliser les nouvelles propriétés ou les anciennes si les nouvelles ne sont pas définies
  const isChecked = checked !== undefined ? checked : enabled;
  const handleChange = onChange || setEnabled;
  const toggleId = id || `switch-${Math.random().toString(36).substring(2, 11)}`;
  
  return (
    <div className={`flex items-center ${className}`}>
      <label 
        htmlFor={toggleId} 
        className="relative inline-flex items-center cursor-pointer"
      >
        <input
          id={toggleId}
          type="checkbox"
          className="sr-only peer"
          checked={isChecked}
          onChange={handleChange}
          aria-describedby={ariaDescribedby}
          aria-label={label}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-light rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
      </label>
      {label && <span className="ml-2 text-sm font-medium text-gray-900">{label}</span>}
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
};

// Fonction utilitaire pour obtenir le type d'écran à partir de l'ID
export const getScreenType = (id) => {
  const typeMap = {
    'vertical1': 'vertical_1',
    'vertical2': 'vertical_2',
    'vertical3': 'vertical_3',
    'horizontal1': 'horizontal_1'
  };
  
  return typeMap[id] || id;
};
