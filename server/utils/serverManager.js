import { createServer } from 'net';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import WebSocket from 'ws';

const CONFIG_FILE = join(process.cwd(), 'config.json');
const ENV_FILE = join(process.cwd(), '.env');

class ServerManager {
  constructor() {
    this.config = null;
    this.ws = null;
    this.wsServer = null;
    this.reconnectTimeout = null;
    this.pingInterval = null;
    this.clients = new Map();
  }

  // Vérifier la disponibilité d'un port
  async checkPort(port) {
    return new Promise((resolve, reject) => {
      const server = createServer();
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is in use`));
        } else {
          reject(err);
        }
      });

      server.listen(port, () => {
        server.close(() => resolve(port));
      });
    });
  }

  // Trouver des ports disponibles
  async findAvailablePorts(startPort = 5173, count = 2) {
    const ports = [];
    let currentPort = startPort;

    while (ports.length < count) {
      try {
        const port = await this.checkPort(currentPort);
        ports.push(port);
        currentPort = port + 1;
      } catch (error) {
        currentPort++;
      }
    }

    return ports;
  }

  // Mettre à jour le fichier de configuration
  updateConfig(mainPort, sharePort) {
    const config = {
      mainPort,
      sharePort,
      mainUrl: `http://localhost:${mainPort}`,
      shareUrl: `http://localhost:${sharePort}`
    };

    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    this.config = config;
    return config;
  }

  // Mettre à jour le fichier .env
  updateEnvFile(config) {
    try {
      let envContent = readFileSync(ENV_FILE, 'utf-8');
      
      // Mettre à jour les URLs
      envContent = envContent
        .replace(/VITE_MAIN_URL=http:\/\/localhost:\d+/, `VITE_MAIN_URL=http://localhost:${config.mainPort}`)
        .replace(/VITE_SHARE_URL=http:\/\/localhost:\d+/, `VITE_SHARE_URL=http://localhost:${config.sharePort}`);
      
      writeFileSync(ENV_FILE, envContent, 'utf-8');
      console.log('Fichier .env mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du fichier .env:', error);
    }
  }

  // Lire la configuration
  getConfig() {
    try {
      if (!this.config) {
        this.config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
      }
      return this.config;
    } catch (error) {
      console.error('Erreur lors de la lecture de la configuration:', error);
      return null;
    }
  }

  // Initialiser le serveur WebSocket
  initWebSocketServer(server) {
    this.wsServer = new WebSocket.Server({ server });

    this.wsServer.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      this.clients.set(ws, {
        id: clientId,
        lastPing: Date.now()
      });

      ws.on('message', (message) => this.handleMessage(ws, message));
      ws.on('close', () => this.handleClose(ws));
      
      // Envoyer un message de bienvenue
      this.sendToClient(ws, {
        type: 'welcome',
        data: { id: clientId }
      });
    });

    this.startPingInterval();
  }

  // Gérer les messages WebSocket
  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      const client = this.clients.get(ws);

      if (!client) return;

      switch (data.type) {
        case 'ping':
          client.lastPing = Date.now();
          this.sendToClient(ws, { type: 'pong' });
          break;

        case 'config_request':
          this.sendToClient(ws, {
            type: 'config_update',
            data: this.getConfig()
          });
          break;
      }
    } catch (error) {
      console.error('Erreur lors du traitement du message:', error);
    }
  }

  // Gérer la fermeture de connexion
  handleClose(ws) {
    this.clients.delete(ws);
  }

  // Envoyer un message à un client
  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Diffuser un message à tous les clients
  broadcast(message) {
    this.wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Générer un ID client unique
  generateClientId() {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Démarrer l'intervalle de ping
  startPingInterval() {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      this.wsServer.clients.forEach(ws => {
        const client = this.clients.get(ws);
        if (client && now - client.lastPing > 35000) {
          ws.terminate();
          this.clients.delete(ws);
        }
      });
    }, 30000);
  }

  // Arrêter le serveur
  stop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    if (this.wsServer) {
      this.wsServer.close();
    }
  }
}

export const serverManager = new ServerManager();
export default serverManager;
