import { supabase } from './supabase';

export async function listProfiles() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des profils:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erreur lors de la liste des profils:', error);
    return [];
  }
}