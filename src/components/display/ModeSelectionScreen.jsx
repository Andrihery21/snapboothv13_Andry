import React from 'react';
import { motion } from 'framer-motion';
import useTextContent from '../../hooks/useTextContent';

/**
 * Écran de sélection de mode (Normal ou Magique) qui utilise les textes personnalisés
 */
const ModeSelectionScreen = ({ onSelectMode }) => {
  // Utiliser notre hook personnalisé pour récupérer les textes
  const { getText, hasText } = useTextContent();
  
  // Récupérer les textes personnalisés avec des valeurs par défaut
  const modeText = getText('mode_text', 'Choisissez votre mode');
  const modeChoiceText = getText('mode_choice_text', 
    'Souhaitez-vous utiliser un effet magique ou garder la photo telle quelle ?');
  const normalModeLabel = getText('mode_normal_label', 'Mode Normal');
  const magicModeLabel = getText('mode_magic_label', 'Mode Magique');
  
  // Animation pour les boutons
  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)" },
    tap: { scale: 0.98 }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-indigo-50 to-white text-gray-800 p-4">
      <motion.div 
        className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <header className="text-center mb-10">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-purple-800 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {modeText}
          </motion.h1>
          
          <motion.p 
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {modeChoiceText}
          </motion.p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Mode Normal */}
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.button
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl p-8 flex flex-col items-center transition-colors"
              onClick={() => onSelectMode('normal')}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <span className="text-6xl mb-4">📸</span>
              <h2 className="text-xl font-semibold mb-2">{normalModeLabel}</h2>
              <p className="text-sm text-center text-blue-600">
                Photo sans effet spécial
              </p>
            </motion.button>
          </motion.div>
          
          {/* Mode Magique */}
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              className="w-full bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl p-8 flex flex-col items-center transition-colors"
              onClick={() => onSelectMode('magic')}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <span className="text-6xl mb-4">✨</span>
              <h2 className="text-xl font-semibold mb-2">{magicModeLabel}</h2>
              <p className="text-sm text-center text-purple-600">
                Transformez votre photo avec un effet spécial
              </p>
            </motion.button>
          </motion.div>
        </div>
        
        {/* Afficher un message d'aide si disponible */}
        {hasText('mode_help_text') && (
          <motion.div 
            className="text-sm text-gray-500 text-center mt-8 bg-gray-50 p-4 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {getText('mode_help_text')}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ModeSelectionScreen;
