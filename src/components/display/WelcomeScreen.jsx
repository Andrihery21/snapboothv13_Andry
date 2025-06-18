import React from 'react';
import { motion } from 'framer-motion';
import useTextContent from '../../hooks/useTextContent';

/**
 * Écran d'accueil du photobooth qui utilise les textes personnalisés
 */
const WelcomeScreen = ({ onStart }) => {
  // Utiliser notre hook personnalisé pour récupérer les textes
  const { getText } = useTextContent();
  
  // Récupérer les textes personnalisés avec des valeurs par défaut si non définis
  const welcomeText = getText('welcome_text', 'Touchez l\'écran pour lancer le Photobooth');
  const footerText = getText('footer_text', 'Date de l\'evenement');

  return (
    <div 
      className="flex flex-col items-center justify-between h-full bg-gradient-to-b from-purple-700 to-indigo-900 text-white"
      onClick={onStart}
    >
      <header className="w-full pt-8 pb-4 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Vous pouvez ajouter ici un logo ou autre élément d'en-tête */}
        </div>
      </header>
      
      <motion.div 
        className="flex-1 flex flex-col items-center justify-center text-center p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-4xl md:text-6xl font-bold mb-6"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {welcomeText}
        </motion.h1>
        
        <motion.div
          className="mt-8 border-2 border-white rounded-full px-8 py-4 text-xl font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Touchez pour commencer
        </motion.div>
      </motion.div>
      
      <footer className="w-full py-4 px-6 text-center">
        <p className="text-lg opacity-80">{footerText}</p>
      </footer>
    </div>
  );
};

export default WelcomeScreen;
