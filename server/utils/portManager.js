import { createServer } from 'net';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export function findAvailablePort(startPort = 5173) {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try the next one
        findAvailablePort(startPort + 1)
          .then(resolve)
          .catch(reject);
      } else {
        reject(err);
      }
    });

    server.listen(startPort, () => {
      server.close(() => {
        resolve(startPort);
      });
    });
  });
}

export async function updateEnvFile(port) {
  try {
    const envPath = join(process.cwd(), '.env');
    let envContent = readFileSync(envPath, 'utf-8');
    
    // Update VITE_SHARE_URL with new port
    const newEnvContent = envContent.replace(
      /VITE_SHARE_URL=http:\/\/localhost:\d+/,
      `VITE_SHARE_URL=http://localhost:${port}`
    );
    
    writeFileSync(envPath, newEnvContent, 'utf-8');
    console.log(`Updated .env file with port ${port}`);
  } catch (error) {
    console.error('Error updating .env file:', error);
  }
}
