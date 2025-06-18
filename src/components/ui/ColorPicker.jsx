import React, { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { motion, AnimatePresence } from 'framer-motion';

const ColorPicker = ({ color, onChange, presetColors = [] }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  // Couleurs prédéfinies si aucune n'est fournie
  const defaultPresetColors = presetColors.length > 0 ? presetColors : [
    '#6d28d9', // purple-700
    '#1d4ed8', // blue-700
    '#0891b2', // cyan-600
    '#059669', // emerald-600
    '#d97706', // amber-600
    '#dc2626', // red-600
    '#be185d', // pink-700
    '#111827', // gray-900
  ];

  // Ferme le color picker quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="w-10 h-10 rounded-full border border-gray-300 cursor-pointer transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          style={{ backgroundColor: color }}
          aria-label="Open color picker"
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full max-w-xs border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          placeholder="#000000"
        />
      </div>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 mt-2"
          >
            <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
              <HexColorPicker color={color} onChange={onChange} />
              
              <div className="mt-3 grid grid-cols-4 gap-2">
                {defaultPresetColors.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    className={`w-6 h-6 rounded-full cursor-pointer transition-all hover:scale-110 ${
                      color.toLowerCase() === presetColor.toLowerCase() 
                        ? 'ring-2 ring-offset-2 ring-gray-400' 
                        : ''
                    }`}
                    style={{ backgroundColor: presetColor }}
                    onClick={() => onChange(presetColor)}
                    aria-label={`Select color ${presetColor}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ColorPicker;
