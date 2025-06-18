import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/notifications';
import { Logger } from '../lib/logger';

const logger = new Logger('Auth');

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      
      setUser: (user) => set({ user, isLoading: false }),

      login: async (email, password) => {
        try {
          logger.info('Tentative de connexion', { email });
          set({ isLoading: true, error: null });

          const { data: { user: authUser }, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) throw authError;
          if (!authUser) throw new Error('Aucune donnée utilisateur retournée');

          logger.info('Utilisateur authentifié, récupération du profil', { userId: authUser.id });

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authUser.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }

          const isAdmin = email === 'manuel@gmail.com' || profile?.role === 'admin';
          // Mise à jour des métadonnées utilisateur avec le rôle correct
        if (isAdmin) {
        logger.info('Mise à jour des métadonnées utilisateur avec rôle admin', { userId: authUser.id });
        const { error: updateError } = await supabase.auth.updateUser({
        data: { role: 'admin' }
        });
      
      if (updateError) {
        logger.error('Erreur lors de la mise à jour des métadonnées', updateError);
      }
    }

          const userData = { 
            id: authUser.id, 
            email: authUser.email,
            role: isAdmin ? 'admin' : 'user'
          };

          logger.info('Connexion réussie', userData);
          set({ user: userData, isLoading: false, error: null });
          return { error: null };
        } catch (error) {
          logger.error('Erreur de connexion', error);
          
          let errorMessage = 'Une erreur est survenue lors de la connexion';
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Email ou mot de passe incorrect';
          }
          
          set({ user: null, isLoading: false, error: errorMessage });
          return { error };
        }
      },

      signup: async (email, password) => {
        try {
          logger.info('Tentative d\'inscription', { email });
          set({ isLoading: true, error: null });

          if (email === 'nouvelleereprod@gmail.com') {
            throw new Error('Cet email ne peut pas être utilisé pour l\'inscription');
          }

          const { data: { user: authUser }, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                role: 'user'
              }
            }
          });

          if (authError) throw authError;
          if (!authUser) throw new Error('Aucune donnée utilisateur retournée');

          const userData = { 
            id: authUser.id, 
            email: authUser.email,
            role: 'user'
          };

          logger.info('Inscription réussie', userData);
          set({ user: userData, isLoading: false, error: null });
          return { error: null };
        } catch (error) {
          logger.error('Erreur d\'inscription', error);
          
          let errorMessage = 'Une erreur est survenue lors de l\'inscription';
          if (error.message.includes('already registered')) {
            errorMessage = 'Un compte existe déjà avec cet email';
          }
          
          set({ user: null, isLoading: false, error: errorMessage });
          return { error };
        }
      },

      logout: async () => {
        try {
          logger.info('Tentative de déconnexion');
          set({ isLoading: true });
          
          const { error } = await supabase.auth.signOut();
          if (error) throw error;

          logger.info('Déconnexion réussie');
          set({ user: null, isLoading: false, error: null });
        } catch (error) {
          logger.error('Erreur lors de la déconnexion', error);
          set({ isLoading: false, error: error.message });
        }
      },

      checkSession: async () => {
        try {
          logger.info('Vérification de la session');
          set({ isLoading: true });
          
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (session?.user) {
            logger.info('Session trouvée', { userId: session.user.id });
            
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();

            const isAdmin = session.user.email === 'nouvelleereprod@gmail.com' || profile?.role === 'admin';
            const userData = {
              id: session.user.id,
              email: session.user.email,
              role: isAdmin ? 'admin' : 'user'
            };

            logger.info('Session restaurée', userData);
            set({ user: userData, isLoading: false, error: null });
          } else {
            logger.info('Aucune session active');
            set({ user: null, isLoading: false, error: null });
          }
        } catch (error) {
          logger.error('Erreur lors de la vérification de la session', error);
          set({ user: null, isLoading: false, error: error.message });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, role: state.user?.role }),
      version: 1,
    }
  )
);