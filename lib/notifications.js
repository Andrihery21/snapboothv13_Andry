import { toast } from 'react-hot-toast';

// Configuration par défaut des notifications
const defaultConfig = {
  duration: 4000,
  position: 'bottom-right',
};

// Types de notifications avec leurs styles personnalisés
const notificationTypes = {
  success: {
    icon: '✅',
    style: {
      background: '#10B981',
      color: 'white',
    },
    duration: 4000,
  },
  error: {
    icon: '❌',
    style: {
      background: '#EF4444',
      color: 'white',
    },
    duration: 6000,
  },
  info: {
    icon: 'ℹ️',
    style: {
      background: '#3B82F6',
      color: 'white',
    },
    duration: 4000,
  },
  warning: {
    icon: '⚠️',
    style: {
      background: '#F59E0B',
      color: 'white',
    },
    duration: 5000,
  },
  loading: {
    icon: '⏳',
    style: {
      background: '#6B7280',
      color: 'white',
    },
  },
};

// Système de notifications amélioré
export const notify = {
  success: (message, options = {}) => {
    console.log(`${notificationTypes.success.icon} ${message}`);
    return toast.success(message, {
      ...defaultConfig,
      ...notificationTypes.success,
      ...options,
    });
  },
  
  error: (error, options = {}) => {
    const errorMessage = typeof error === 'string' ? error : 'Une erreur est survenue';
    console.error(`${notificationTypes.error.icon} ${errorMessage}`);
    return toast.error(errorMessage, {
      ...defaultConfig,
      ...notificationTypes.error,
      ...options,
    });
  },
  
  info: (message, options = {}) => {
    console.log(`${notificationTypes.info.icon} ${message}`);
    return toast(message, {
      ...defaultConfig,
      ...notificationTypes.info,
      ...options,
    });
  },
  
  warning: (message, options = {}) => {
    console.log(`${notificationTypes.warning.icon} ${message}`);
    return toast(message, {
      ...defaultConfig,
      ...notificationTypes.warning,
      ...options,
    });
  },
  
  loading: (message, options = {}) => {
    console.log(`${notificationTypes.loading.icon} ${message}`);
    return toast.loading(message, {
      ...defaultConfig,
      ...notificationTypes.loading,
      ...options,
    });
  },

  promise: async (promise, messages, options = {}) => {
    console.log(`🔄 ${messages.loading}`);
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        ...defaultConfig,
        ...options,
      }
    );
  },
  
  // Méthode pour mettre à jour une notification existante
  update: (toastId, message, type = 'info') => {
    if (!toastId) return;
    
    const config = notificationTypes[type] || notificationTypes.info;
    console.log(`${config.icon} ${message} (mise à jour)`);
    
    toast.update(toastId, {
      render: message,
      ...defaultConfig,
      ...config,
    });
  },
  
  // Méthode pour supprimer une notification
  dismiss: (toastId) => {
    if (toastId) {
      toast.dismiss(toastId);
    }
  },
  
  // Méthode pour supprimer toutes les notifications
  dismissAll: () => {
    toast.dismiss();
  }
};