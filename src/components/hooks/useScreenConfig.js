/**
 * Hook personnalisé pour gérer la configuration de l'écran
 * Récupère et fournit la configuration appropriée en fonction du type d'écran
 */

import { useState, useEffect } from 'react';
import { getCurrentStandId, getStandConfig } from '../../utils/standConfig';

export function useScreenConfig() {
  // État initial avec une configuration par défaut
  const [screenConfig, setScreenConfig] = useState({
    width: 1080,
    height: 1920,
    name: 'Écran par défaut',
    defaultFilter: 'univers',
    captureButtonText: 'Prendre une photo',
    resultText: 'Votre photo'
  });

  useEffect(() => {
    // Récupère l'ID du stand actuel
    const standId = getCurrentStandId();
    
    // Récupère la configuration du stand
    const config = getStandConfig(standId);
    
    // Met à jour l'état avec la configuration récupérée
    setScreenConfig(config);
  }, []);

  return screenConfig;
}
