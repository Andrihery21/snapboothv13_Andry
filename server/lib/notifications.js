import { toast } from 'react-hot-toast';

export const notify = {
  success: (message) => {
    console.log('✅', message);
    return toast.success(message, {
      duration: 4000,
      position: 'bottom-right',
    });
  },
  
  error: (error) => {
    console.error('❌', error);
    return toast.error(typeof error === 'string' ? error : 'Une erreur est survenue', {
      duration: 6000,
      position: 'bottom-right',
    });
  },
  
  loading: (message) => {
    console.log('⏳', message);
    return toast.loading(message, {
      position: 'bottom-right',
    });
  },

  promise: async (promise, messages) => {
    console.log('🔄', messages.loading);
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        position: 'bottom-right',
        duration: 4000,
      }
    );
  }
};