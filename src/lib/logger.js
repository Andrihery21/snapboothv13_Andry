/**
 * Module de journalisation simplifié pour l'application
 */
export class Logger {
  constructor(context) {
    this.context = context;
  }

  /**
   * Journalise un message de débogage
   * @param {string} message - Message à journaliser
   * @param {Object} data - Données supplémentaires à journaliser
   */
  debug(message, data = {}) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${this.context}] ${message}`, data);
    }
  }

  /**
   * Journalise un message d'information
   * @param {string} message - Message à journaliser
   * @param {Object} data - Données supplémentaires à journaliser
   */
  info(message, data = {}) {
    console.info(`[${this.context}] ${message}`, data);
  }

  /**
   * Journalise un message d'avertissement
   * @param {string} message - Message à journaliser
   * @param {Object} data - Données supplémentaires à journaliser
   */
  warn(message, data = {}) {
    console.warn(`[${this.context}] ${message}`, data);
  }

  /**
   * Journalise un message d'erreur
   * @param {string} message - Message à journaliser
   * @param {Object} data - Données supplémentaires à journaliser
   */
  error(message, data = {}) {
    console.error(`[${this.context}] ${message}`, data);
  }
}
