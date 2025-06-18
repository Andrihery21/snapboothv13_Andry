import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialisation du thème en fonction des préférences de l'utilisateur
  useEffect(() => {
    // Vérifier si le thème est déjà stocké dans localStorage
    const savedTheme = localStorage.getItem('theme');
    
    // Vérifier les préférences système si aucun thème n'est sauvegardé
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Appliquer le thème sauvegardé ou les préférences système
    const initialDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsDarkMode(initialDarkMode);
    
    // Appliquer le thème initial
    applyTheme(initialDarkMode);
    
    // Écouter les changements de préférences système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
        applyTheme(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Appliquer le thème à l'élément HTML
  const applyTheme = (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Changer le thème
  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    applyTheme(newDarkMode);
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-12 h-6 bg-gray-300 dark:bg-gray-700 rounded-full p-1 flex items-center transition-colors duration-300"
      whileTap={{ scale: 0.95 }}
      aria-label={isDarkMode ? 'Passer au mode clair' : 'Passer au mode sombre'}
    >
      <motion.div
        className="absolute w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
        initial={false}
        animate={{ 
          x: isDarkMode ? 26 : 1,
          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff'
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {isDarkMode ? (
          <Moon size={12} className="text-yellow-300" />
        ) : (
          <Sun size={12} className="text-amber-500" />
        )}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;
