// Système de notifications simple pour l'interface utilisateur
// Peut être remplacé par une bibliothèque comme react-toastify si nécessaire

const defaultDuration = 3000; // 3 secondes

// Créer un conteneur pour les notifications s'il n'existe pas déjà
const ensureContainer = () => {
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    document.body.appendChild(container);
  }
  return container;
};

// Créer et afficher une notification
const createNotification = (message, type, duration = defaultDuration) => {
  const container = ensureContainer();
  
  const notification = document.createElement('div');
  notification.style.padding = '12px 16px';
  notification.style.borderRadius = '6px';
  notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  notification.style.minWidth = '250px';
  notification.style.maxWidth = '400px';
  notification.style.animation = 'fadeIn 0.3s ease-out';
  notification.style.display = 'flex';
  notification.style.alignItems = 'center';
  notification.style.justifyContent = 'space-between';
  notification.style.fontFamily = 'sans-serif';
  
  // Définir les styles en fonction du type
  switch (type) {
    case 'success':
      notification.style.backgroundColor = '#10B981';
      notification.style.color = 'white';
      break;
    case 'error':
      notification.style.backgroundColor = '#EF4444';
      notification.style.color = 'white';
      break;
    case 'warning':
      notification.style.backgroundColor = '#F59E0B';
      notification.style.color = 'white';
      break;
    case 'info':
    default:
      notification.style.backgroundColor = '#3B82F6';
      notification.style.color = 'white';
      break;
  }
  
  // Contenu de la notification
  notification.innerHTML = `
    <div>${message}</div>
    <button style="background: none; border: none; color: white; cursor: pointer; margin-left: 10px; font-size: 18px; opacity: 0.8;">&times;</button>
  `;
  
  // Ajouter la notification au conteneur
  container.appendChild(notification);
  
  // Ajouter un gestionnaire d'événements pour fermer la notification
  const closeButton = notification.querySelector('button');
  closeButton.addEventListener('click', () => {
    notification.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
      container.removeChild(notification);
    }, 300);
  });
  
  // Supprimer automatiquement la notification après la durée spécifiée
  setTimeout(() => {
    if (container.contains(notification)) {
      notification.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        if (container.contains(notification)) {
          container.removeChild(notification);
        }
      }, 300);
    }
  }, duration);
  
  return notification;
};

// Ajouter les styles d'animation au document
const addAnimationStyles = () => {
  if (!document.getElementById('notification-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'notification-styles';
    styleSheet.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
      }
    `;
    document.head.appendChild(styleSheet);
  }
};

// Initialiser les styles d'animation
if (typeof window !== 'undefined') {
  // Vérifier que nous sommes dans un environnement navigateur
  addAnimationStyles();
}

// API publique
export const notify = {
  success: (message, duration) => createNotification(message, 'success', duration),
  error: (message, duration) => createNotification(message, 'error', duration),
  warning: (message, duration) => createNotification(message, 'warning', duration),
  info: (message, duration) => createNotification(message, 'info', duration),
};
