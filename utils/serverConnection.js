// Configuration fixe du serveur
import { SERVER_CONFIG } from '../config/serverConfig';

const SERVER_PORT = SERVER_CONFIG.PORT;
const SERVER_URL = SERVER_CONFIG.WS_URL;

class ServerConnection {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxAttempts = 3;
    this.checkInterval = null;
    this.ws = null;
    this.wsReconnectTimeout = null;
    this.lastPingTime = null;
    this.onStatusChange = null;
    this.currentPort = null;
  }

  // Définir le callback de changement de statut
  setStatusChangeCallback(callback) {
    this.onStatusChange = callback;
  }

  // Mettre à jour le statut
  updateStatus(status) {
    this.isConnected = status.connected;
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  // Vérifier la connexion au serveur
  async checkConnection() {
    try {
      const response = await fetch(`http://localhost:${SERVER_PORT}/health`);
      if (!response.ok) {
        throw new Error('Le serveur ne répond pas');
      }
      const data = await response.json();
      this.currentPort = data.port;
      return true;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    }
  }

  // Initialiser la connexion WebSocket
  initWebSocket() {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(`${SERVER_URL}?type=client`);

    this.ws.onopen = () => {
      console.log('WebSocket connecté');
      this.updateStatus({
        connected: true,
        port: SERVER_PORT,
        type: 'connected'
      });
      this.connectionAttempts = 0;
      this.startPingInterval();
    };

    this.ws.onclose = () => {
      console.log('WebSocket déconnecté');
      this.updateStatus({
        connected: false,
        port: SERVER_PORT,
        type: 'disconnected'
      });
      this.stopPingInterval();
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
      this.updateStatus({
        connected: false,
        port: SERVER_PORT,
        type: 'error',
        error: error
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Erreur lors du traitement du message:', error);
      }
    };
  }

  // Gérer les messages reçus
  handleMessage(message) {
    switch (message.type) {
      case 'pong':
        this.lastPingTime = Date.now();
        break;
      case 'config_update':
        this.handleConfigUpdate(message.data);
        break;
      default:
        console.log('Message reçu:', message);
    }
  }

  // Gérer la mise à jour de la configuration
  handleConfigUpdate(config) {
    console.log('Nouvelle configuration reçue:', config);
    // La configuration est maintenant fixe, donc nous ignorons les mises à jour
  }

  // Envoyer un message
  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // Démarrer l'intervalle de ping
  startPingInterval(interval = 30000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.sendMessage({ type: 'ping' });
    }, interval);
  }

  // Arrêter l'intervalle de ping
  stopPingInterval() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Planifier une reconnexion
  scheduleReconnect(delay = 5000) {
    if (this.wsReconnectTimeout) {
      clearTimeout(this.wsReconnectTimeout);
    }

    if (this.connectionAttempts < this.maxAttempts) {
      this.connectionAttempts++;
      this.wsReconnectTimeout = setTimeout(() => {
        console.log(`Tentative de reconnexion ${this.connectionAttempts}/${this.maxAttempts}...`);
        this.connect();
      }, delay);
    } else {
      console.error('Nombre maximum de tentatives de reconnexion atteint');
    }
  }

  // Se connecter au serveur
  async connect() {
    try {
      this.initWebSocket();
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      this.scheduleReconnect();
    }
  }

  // Se déconnecter du serveur
  disconnect() {
    if (this.wsReconnectTimeout) {
      clearTimeout(this.wsReconnectTimeout);
    }
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const serverConnection = new ServerConnection();
export default serverConnection;
