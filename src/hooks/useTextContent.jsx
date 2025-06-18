import { useContext, useCallback } from 'react';
import { ScreenConfigContext } from '../components/admin/screens/ScreenConfigProvider';

/**
 * Hook personnalisé pour accéder aux textes d'interface personnalisés
 * 
 * @param {string} key - Clé du texte à récupérer
 * @param {string} defaultValue - Valeur par défaut si le texte n'est pas trouvé
 * @return {object} - Objet contenant le texte et une fonction pour le mettre à jour
 */
export function useTextContent() {
  // Accéder au contexte de configuration d'écran
  const { config } = useContext(ScreenConfigContext);
  
  /**
   * Récupère le texte personnalisé pour la clé spécifiée
   * 
   * @param {string} key - Clé du texte à récupérer
   * @param {string} defaultValue - Valeur par défaut si le texte n'est pas trouvé
   * @return {string} - Le texte personnalisé ou la valeur par défaut
   */
  const getText = useCallback((key, defaultValue = '') => {
    if (!config || !config.textConfig) {
      return defaultValue;
    }
    
    return config.textConfig[key] !== undefined 
      ? config.textConfig[key] 
      : defaultValue;
  }, [config]);
  
  /**
   * Vérifie si un texte personnalisé existe pour la clé spécifiée
   * 
   * @param {string} key - Clé du texte à vérifier
   * @return {boolean} - True si le texte existe, false sinon
   */
  const hasText = useCallback((key) => {
    if (!config || !config.textConfig) {
      return false;
    }
    
    return config.textConfig[key] !== undefined;
  }, [config]);
  
  /**
   * Récupère tous les textes personnalisés
   * 
   * @return {object} - Objet contenant tous les textes personnalisés
   */
  const getAllTexts = useCallback(() => {
    if (!config || !config.textConfig) {
      return {};
    }
    
    return config.textConfig;
  }, [config]);
  
  return {
    getText,
    hasText,
    getAllTexts
  };
}

export default useTextContent;
