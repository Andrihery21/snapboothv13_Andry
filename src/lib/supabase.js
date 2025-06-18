import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://azafzikvwdartavmpwsc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YWZ6aWt2d2RhcnRhdm1wd3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjM1NDMsImV4cCI6MjA1NTAzOTU0M30.MNV4la2gg_gwetjzx5ALYvZzEOU2_JW01kfdVk-ub40';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variables d\'environnement Supabase manquantes');
}

// Création d'une instance unique de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: typeof window !== 'undefined' ? window.localStorage : null,
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

// Vérification initiale de la connexion
if (typeof window !== 'undefined') {
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.error('Erreur lors de la vérification de la session', error);
    } else if (session) {
      console.info('Session existante trouvée', { userId: session.user.id });
    } else {
      console.info('Aucune session active');
    }
  });
}

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
        console.debug('Changement en temps réel reçu', { channel, table, payload });
        
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
      console.info('Statut de la souscription', { channel, status });
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
