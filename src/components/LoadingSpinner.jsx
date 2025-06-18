import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSpinner = ({ message, size = 'medium' }) => {
  // Définir les tailles en fonction du paramètre size
  const sizes = {
    small: {
      spinner: 'w-8 h-8',
      text: 'text-lg'
    },
    medium: {
      spinner: 'w-12 h-12',
      text: 'text-xl'
    },
    large: {
      spinner: 'w-16 h-16',
      text: 'text-2xl'
    }
  };

  const sizeClass = sizes[size] || sizes.medium;

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        className={`${sizeClass.spinner} border-4 border-t-4 border-purple-600 border-t-transparent rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
      {message && (
        <p className={`mt-4 ${sizeClass.text} text-center text-white font-medium`}>
          {message}
        </p>
      )}
    </div>
  );
};
