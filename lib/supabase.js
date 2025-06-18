import { createClient } from '@supabase/supabase-js';
import { notify } from './notifications';
import { Logger } from './logger';

const logger = new Logger('Supabase');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

// Création d'une instance unique de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: window.localStorage,
    storageKey: 'snap-booth-auth',
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    config: {
      timeout: 30000, // 30 secondes
      heartbeat: {
        interval: 15000 // 15 secondes
      }
    }
  }
});

// Vérification de la connexion
supabase.auth.onAuthStateChange((event, session) => {
  logger.info('Changement d\'état d\'authentification', { event });
  
  if (event === 'SIGNED_IN') {
    logger.info('Utilisateur connecté', { userId: session?.user?.id });
    notify.success('Connecté avec succès');
  } else if (event === 'SIGNED_OUT') {
    logger.info('Utilisateur déconnecté');
    notify.success('Déconnecté avec succès');
  } else if (event === 'TOKEN_REFRESHED') {
    logger.info('Token rafraîchi');
  }
});

// Vérification initiale de la connexion
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    logger.error('Erreur lors de la vérification de la session', error);
    notify.error('Erreur de connexion à Supabase');
  } else if (session) {
    logger.info('Session existante trouvée', { userId: session.user.id });
  } else {
    logger.info('Aucune session active');
  }
});

// Fonction utilitaire pour créer des souscriptions en temps réel
export const createRealtimeSubscription = (channel, table, filter = {}, callbacks = {}) => {
  const subscription = supabase
    .channel(channel)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        ...filter
      },
      (payload) => {
        logger.debug('Changement en temps réel reçu', { channel, table, payload });
        
        if (payload.eventType === 'INSERT' && callbacks.onInsert) {
          callbacks.onInsert(payload.new);
        } else if (payload.eventType === 'UPDATE' && callbacks.onUpdate) {
          callbacks.onUpdate(payload.new, payload.old);
        } else if (payload.eventType === 'DELETE' && callbacks.onDelete) {
          callbacks.onDelete(payload.old);
        }
      }
    )
    .subscribe((status) => {
      logger.info('Statut de la souscription', { channel, status });
      if (status === 'SUBSCRIBED' && callbacks.onSubscribe) {
        callbacks.onSubscribe();
      } else if (status === 'CLOSED' && callbacks.onClose) {
        callbacks.onClose();
      } else if (status === 'CHANNEL_ERROR' && callbacks.onError) {
        callbacks.onError();
      }
    });

  return subscription;
};

export { supabase };