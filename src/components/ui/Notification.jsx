import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showNotification = (type, message, duration = 5000) => {
    const id = Date.now();
    
    const notification = {
      id,
      type,
      message,
      component: (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: -50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className={`flex items-center p-4 mb-4 rounded-lg shadow-lg ${
            type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
            type === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
            'bg-blue-50 border-l-4 border-blue-500'
          }`}
        >
          <div className={`flex-shrink-0 w-5 h-5 mr-3 ${
            type === 'success' ? 'text-green-500' :
            type === 'error' ? 'text-red-500' :
            'text-blue-500'
          }`}>
            {type === 'success' ? <CheckCircle size={20} /> : 
             type === 'error' ? <AlertCircle size={20} /> : 
             <Info size={20} />}
          </div>
          <div className="ml-3 text-sm font-medium text-gray-800">
            {message}
          </div>
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={() => removeNotification(id)}
          >
            <X size={16} />
          </button>
        </motion.div>
      )
    };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };

  return (
    <NotificationContext.Provider value={{ showNotification, removeNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-50 w-72">
        <AnimatePresence>
          {notifications.map(notification => (
            <React.Fragment key={notification.id}>
              {notification.component}
            </React.Fragment>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// Fonction utilitaire pour faciliter l'utilisation des notifications
export const notify = {
  success: (message, duration) => {
    const { showNotification } = useNotification();
    return showNotification('success', message, duration);
  },
  error: (message, duration) => {
    const { showNotification } = useNotification();
    return showNotification('error', message, duration);
  },
  info: (message, duration) => {
    const { showNotification } = useNotification();
    return showNotification('info', message, duration);
  }
};
