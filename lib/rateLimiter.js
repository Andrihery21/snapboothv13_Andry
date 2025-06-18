/**
 * Utilitaire pour limiter le débit des requêtes vers Supabase
 * et gérer les erreurs 429 (Too Many Requests)
 */

// Configuration du rate limiter
const config = {
  maxRequestsPerInterval: 5, // Nombre maximum de requêtes par intervalle
  interval: 1000, // Intervalle en ms (1 seconde)
  maxRetries: 3, // Nombre maximum de tentatives en cas d'erreur 429
  backoffFactor: 2, // Facteur de multiplication pour le temps d'attente entre les tentatives
  initialBackoff: 1000, // Temps d'attente initial en ms
  maxBackoff: 10000 // Temps d'attente maximum en ms
};

// File d'attente des requêtes
const queue = [];
let processing = false;
let requestsThisInterval = 0;
let intervalResetTimeout = null;

/**
 * Réinitialise le compteur de requêtes pour l'intervalle
 */
function resetInterval() {
  requestsThisInterval = 0;
  intervalResetTimeout = setTimeout(resetInterval, config.interval);
}

/**
 * Traite la file d'attente des requêtes
 */
async function processQueue() {
  if (processing || queue.length === 0) return;
  
  processing = true;
  
  // Réinitialiser l'intervalle si nécessaire
  if (!intervalResetTimeout) {
    resetInterval();
  }
  
  // Si nous avons atteint la limite de requêtes pour cet intervalle, attendre
  if (requestsThisInterval >= config.maxRequestsPerInterval) {
    processing = false;
    setTimeout(processQueue, config.interval);
    return;
  }
  
  // Traiter la prochaine requête
  const { operation, resolve, reject } = queue.shift();
  
  try {
    requestsThisInterval++;
    const result = await operation();
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    processing = false;
    // Traiter la requête suivante
    setTimeout(processQueue, 10);
  }
}

/**
 * Exécute une opération Supabase avec gestion des erreurs 429
 * @param {Function} operation - Fonction qui exécute l'opération Supabase
 * @returns {Promise} - Résultat de l'opération
 */
export async function executeWithRateLimit(operation) {
  return new Promise((resolve, reject) => {
    // Ajouter l'opération à la file d'attente
    queue.push({ operation, resolve, reject });
    
    // Démarrer le traitement de la file d'attente si nécessaire
    if (!processing) {
      processQueue();
    }
  });
}

/**
 * Exécute une opération Supabase avec gestion des erreurs 429 et tentatives automatiques
 * @param {Function} operation - Fonction qui exécute l'opération Supabase
 * @returns {Promise} - Résultat de l'opération
 */
export async function executeWithRetry(operation) {
  let attempts = 0;
  let lastError = null;
  
  while (attempts < config.maxRetries) {
    try {
      attempts++;
      
      // Exécuter l'opération avec limitation de débit
      const result = await executeWithRateLimit(operation);
      
      // Si l'opération a réussi, retourner le résultat
      return result;
    } catch (error) {
      lastError = error;
      
      // Si c'est une erreur 429, attendre avant de réessayer
      if (error && error.message && error.message.includes('429')) {
        console.warn(`Erreur 429 (Too Many Requests). Tentative ${attempts}/${config.maxRetries}`);
        
        // Calculer le temps d'attente avec backoff exponentiel
        const backoff = Math.min(
          config.initialBackoff * Math.pow(config.backoffFactor, attempts - 1),
          config.maxBackoff
        );
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, backoff));
      } else {
        // Si c'est une autre erreur, ne pas réessayer
        break;
      }
    }
  }
  
  // Si toutes les tentatives ont échoué, rejeter la promesse avec la dernière erreur
  throw lastError;
}
