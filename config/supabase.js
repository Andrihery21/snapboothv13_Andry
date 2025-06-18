import { createClient } from '@supabase/supabase-js'

// Support pour Vite et Node.js
const supabaseUrl = typeof import.meta !== 'undefined' 
    ? import.meta.env.VITE_SUPABASE_URL 
    : process.env.VITE_SUPABASE_URL;

const supabaseAnonKey = typeof import.meta !== 'undefined'
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : process.env.VITE_SUPABASE_ANON_KEY;

const supabaseServiceKey = typeof import.meta !== 'undefined'
    ? import.meta.env.VITE_SUPABASE_SERVICE_KEY
    : process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variables d\'environnement Supabase manquantes')
}

// Client standard pour les opérations utilisateur
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client admin pour les opérations d'administration
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Test de connexion à Supabase
export const testSupabaseConnection = async () => {
    try {
        console.log('Test de connexion à Supabase...');
        
        // Test simple de listage des buckets
        const { data: buckets, error: bucketsError } = await supabaseAdmin
            .storage
            .listBuckets();

        if (bucketsError) {
            console.error('Erreur de connexion:', bucketsError.message);
            return { success: false, error: bucketsError.message };
        }

        console.log('Buckets disponibles:', buckets.map(b => b.name));
        return { success: true, message: 'Connexion établie avec succès' };
    } catch (error) {
        console.error('Erreur:', error);
        return { success: false, error: error.message };
    }
}

// Vérifier et créer le bucket et les dossiers nécessaires
export const checkBucketExists = async () => {
    try {
        console.log('Vérification du bucket et des dossiers...');
        
        // 1. Vérifier les buckets existants
        const { data: buckets, error: bucketsError } = await supabaseAdmin
            .storage
            .listBuckets();

        if (bucketsError) {
            console.error('Erreur lors de la vérification des buckets:', bucketsError);
            throw bucketsError;
        }

        // 2. Vérifier si le bucket 'photos' existe
        let photoBucket = buckets.find(b => b.name === 'photos');
        
        if (!photoBucket) {
            console.log('Création du bucket "photos"...');
            const { data, error: createError } = await supabaseAdmin
                .storage
                .createBucket('photos', {
                    public: true,
                    allowedMimeTypes: ['image/jpeg', 'image/png'],
                    fileSizeLimit: 10485760 // 10MB
                });

            if (createError) {
                console.error('Erreur lors de la création du bucket:', createError);
                throw createError;
            }

            console.log('Bucket "photos" créé avec succès');
            photoBucket = data;
        } else {
            console.log('Bucket "photos" trouvé');
        }

        // 3. Vérifier les dossiers
        const folders = ['captures', 'processed'];
        for (const folder of folders) {
            console.log(`\nVérification du dossier "${folder}"...`);
            
            try {
                const { data: files, error: listError } = await supabaseAdmin
                    .storage
                    .from('photos')
                    .list(folder);

                if (listError) {
                    throw listError;
                }

                console.log(`Dossier "${folder}" existe déjà avec ${files.length} fichiers`);
            } catch (error) {
                // Si le dossier n'existe pas, créer un fichier .keep
                console.log(`Création du dossier "${folder}"...`);
                const { error: uploadError } = await supabaseAdmin
                    .storage
                    .from('photos')
                    .upload(`${folder}/.keep`, new Uint8Array(0));

                if (uploadError && !uploadError.message.includes('The resource already exists')) {
                    console.error(`Erreur lors de la création du dossier ${folder}:`, uploadError);
                    throw uploadError;
                }

                console.log(`Dossier "${folder}" créé avec succès`);
            }
        }

        return { success: true, message: 'Structure vérifiée et créée avec succès' };
    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        return { success: false, error: error.message };
    }
}

// Upload d'une image
export const uploadImage = async (file, folder = 'captures') => {
    try {
        const fileName = `${folder}_${Date.now()}.jpg`;
        const filePath = `${folder}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('photos')
            .upload(filePath, file, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(filePath);

        return {
            success: true,
            url: publicUrl,
            path: filePath
        };
    } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Récupérer une image
export const getImage = async (fileName) => {
    try {
        const { data, error } = await supabase.storage
            .from('photos')
            .download(fileName);

        if (error) throw error;

        return {
            success: true,
            data
        };
    } catch (error) {
        console.error('Erreur lors de la récupération:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
