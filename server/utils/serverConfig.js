import { createServer } from 'net';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_FILE = join(__dirname, '..', 'config.json');

export async function findAvailablePorts(startPort = 5173, count = 2) {
  const ports = [];
  let currentPort = startPort;

  while (ports.length < count) {
    try {
      const port = await checkPort(currentPort);
      ports.push(port);
      currentPort = port + 1;
    } catch (error) {
      currentPort++;
    }
  }

  return ports;
}

function checkPort(port) {
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

export function updateConfig(mainPort, sharePort) {
  const config = {
    mainPort,
    sharePort,
    mainUrl: `http://localhost:${mainPort}`,
    shareUrl: `http://localhost:${sharePort}`
  };

  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  return config;
}

export function updateEnvFile(config) {
  try {
    const envContent = `VITE_MAIN_URL=${config.mainUrl}
VITE_SHARE_URL=${config.shareUrl}
VITE_MAIN_PORT=${config.mainPort}
VITE_SHARE_PORT=${config.sharePort}`;

    writeFileSync(join(__dirname, '..', '.env'), envContent);
    console.log('Fichier .env mis à jour');
  } catch (error) {
    console.error('Erreur lors de la mise à jour du fichier .env:', error);
  }
}

export function getConfig() {
  try {
    const config = JSON.parse(readFileSync(CONFIG_FILE));
    return config;
  } catch (error) {
    console.error('Erreur lors de la lecture de la configuration:', error);
    return null;
  }
}
