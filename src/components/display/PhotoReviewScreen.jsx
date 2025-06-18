import React from 'react';
import { motion } from 'framer-motion';
import useTextContent from '../../hooks/useTextContent';

/**
 * Écran de revue de photo qui utilise les textes personnalisés
 */
const PhotoReviewScreen = ({ photoUrl, onValidate, onRefuse }) => {
  // Utiliser notre hook personnalisé pour récupérer les textes
  const { getText } = useTextContent();
  
  // Récupérer les textes personnalisés avec des valeurs par défaut
  const reviewText = getText('review_text', 'Voulez-vous garder cette photo ?');
  const buttonValidate = getText('button_validate', 'Oui');
  const buttonRefuse = getText('button_refuse', 'Non');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <motion.div 
        className="w-full max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="p-6 text-center">
          <motion.h2 
            className="text-2xl md:text-3xl font-bold text-white mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {reviewText}
          </motion.h2>
        </div>
        
        <motion.div
          className="relative w-full aspect-[3/4] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {photoUrl && (
            <img 
              src={photoUrl} 
              alt="Votre photo" 
              className="w-full h-full object-contain"
            />
          )}
        </motion.div>
        
        <motion.div 
          className="flex justify-center gap-8 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            className="px-8 py-3 rounded-full bg-green-600 text-white font-medium text-lg"
            onClick={onValidate}
            whileHover={{ scale: 1.05, backgroundColor: "#16a34a" }}
            whileTap={{ scale: 0.95 }}
          >
            {buttonValidate}
          </motion.button>
          
          <motion.button
            className="px-8 py-3 rounded-full bg-red-600 text-white font-medium text-lg"
            onClick={onRefuse}
            whileHover={{ scale: 1.05, backgroundColor: "#dc2626" }}
            whileTap={{ scale: 0.95 }}
          >
            {buttonRefuse}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PhotoReviewScreen;
