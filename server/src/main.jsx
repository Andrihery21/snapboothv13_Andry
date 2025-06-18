import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
import { Logger } from '../lib/logger';

const logger = new Logger('Main');

logger.info('Démarrage de l\'application');

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <App />
    <Toaster 
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        success: {
          duration: 3000,
          style: {
            background: '#10B981',
            color: 'white',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: 'white',
          },
        },
      }}
    />
  </StrictMode>
);