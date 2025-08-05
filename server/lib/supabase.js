import { createClient } from '@supabase/supabase-js';

// Récupération des variables d'environnement
// Assurez-vous d'avoir bien configuré 'dotenv' dans votre fichier server.js
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://azafzikvwdartavmpwsc.supabase.co';
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YWZ6aWt2d2RhcnRhdm1wd3NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTQ2MzU0MywiZXhwIjoyMDU1MDM5NTQzfQ.dhp5ClnWf4PDgtd-TsPSObqcjJqF_zXL94N3KlydAS4';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

// Création d'une instance unique de Supabase pour le serveur
// La configuration est simplifiée, sans la logique d'authentification client-side
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

console.log('Client Supabase initialisé pour le serveur.');

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
        console.log('Changement en temps réel reçu', { channel, table, payload });
        
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
      console.log('Statut de la souscription', { channel, status });
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