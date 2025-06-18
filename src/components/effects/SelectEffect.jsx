import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

/**
 * Composant simplifié de sélection d'effet pour les écrans de capture
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.title - Titre de la sélection
 * @param {string} props.subtitle - Sous-titre explicatif (optionnel)
 * @param {Array} props.list - Liste des effets disponibles avec leurs propriétés
 * @param {Function} props.onSelect - Fonction appelée lors de la sélection d'un effet
 * @param {Function} props.onCancel - Fonction appelée pour annuler la sélection
 * @param {string} props.type - Type d'effet ('magical' ou 'normal')
 * @param {boolean} props.showSkip - Afficher le bouton pour sauter cette étape
 */
export default function SelectEffect({ 
  title, 
  subtitle, 
  list, 
  onSelect, 
  onCancel, 
  type = 'magical',
  showSkip = false
}) {
  // Définir les couleurs en fonction du type d'effet
  const bgColor = type === 'magical' ? 'bg-purple-600' : 'bg-blue-600';
  const btnColor = type === 'magical' ? 'bg-purple-700' : 'bg-blue-700';
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 flex flex-col ${bgColor} z-30`}
    >
      {/* En-tête avec titre et bouton retour */}
      <div className="flex items-center justify-between px-4 py-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCancel}
          className={`${btnColor} text-white p-2 rounded-full`}
        >
          <ArrowLeft size={24} />
        </motion.button>
        <h2 className="text-3xl font-bold text-white text-center">{title}</h2>
        <div className="w-10"></div> {/* Espace pour équilibrer l'en-tête */}
      </div>
      
      {/* Sous-titre explicatif si présent */}
      {subtitle && (
        <p className="text-white text-center px-6 pb-4">{subtitle}</p>
      )}
      
      {/* Grille des effets */}
      <div className="flex-grow overflow-y-auto px-4 py-2">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {list.map(e => (
            <motion.button
              key={e.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(e.id)}
              className="bg-white rounded-xl overflow-hidden shadow-lg flex flex-col"
            >
              <div className="relative">
                <img 
                  src={e.preview || `/assets/effects/${e.id}.jpg`} 
                  alt={e.name} 
                  className="w-full h-40 object-cover"
                />
              </div>
              <div className="p-3 text-center">
                <span className="block font-medium text-lg">{e.name}</span>
                {e.description && (
                  <span className="text-sm text-gray-600">{e.description}</span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Bouton pour sauter cette étape si nécessaire */}
      {showSkip && (
        <div className="p-4 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect('')}
            className="px-6 py-2 bg-white/20 text-white rounded-full"
          >
            Aucun effet
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
