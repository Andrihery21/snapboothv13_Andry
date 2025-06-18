import { supabase, supabaseAdmin } from '../config/supabase';
import { SERVER_CONFIG } from '../config/serverConfig';

const BASE_URL = SERVER_CONFIG.BASE_URL;

// Convertir un Blob en Base64
export const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = (error) => {
            console.error('Erreur lors de la lecture du Blob:', error);
            reject(error);
        };
        reader.readAsDataURL(blob);
    });
};

// Convertir Base64 en Blob
export const base64ToBlob = async (base64String) => {
    try {
        console.log('Début de la conversion en Blob...');
        
        // Vérifier si la chaîne est déjà une URL
        if (base64String.startsWith('http')) {
            console.log('URL détectée, téléchargement...');
            const response = await fetch(base64String);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return await response.blob();
        }

        // Vérifier si la chaîne est valide
        if (!base64String || typeof base64String !== 'string') {
            throw new Error('Données d\'image invalides');
        }

        // Supprimer le préfixe data:image/jpeg;base64,
        const base64WithoutPrefix = base64String.includes('base64,') 
            ? base64String.split('base64,')[1]
            : base64String;
        
        // Convertir la chaîne Base64 en tableau d'octets
        const byteCharacters = atob(base64WithoutPrefix);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        
        console.log('Conversion en Blob réussie, taille:', blob.size);
        return blob;
    } catch (error) {
        console.error('Erreur détaillée lors de la conversion en Blob:', error);
        throw new Error(`Erreur de conversion: ${error.message}`);
    }
};

// Sauvegarder une photo capturée
export const saveCapture = async (imageData) => {
    try {
        console.log('Début de la sauvegarde...', { 
            type: typeof imageData,
            isBlob: imageData instanceof Blob,
            size: imageData instanceof Blob ? imageData.size : 'N/A'
        });
        
        // Si imageData est une chaîne Base64, la convertir en Blob
        const imageBlob = imageData instanceof Blob ? imageData : await base64ToBlob(imageData);
        console.log('Image convertie en Blob, taille:', imageBlob.size);
        
        const fileName = `capture_${Date.now()}.jpeg`;
        
        // 1. Sauvegarder dans Supabase
        console.log('Sauvegarde dans Supabase...', {
            bucket: 'photos',
            path: `captures/${fileName}`,
            size: imageBlob.size
        });

        const { data: supabaseData, error: supabaseError } = await supabaseAdmin.storage
            .from('photos')
            .upload(`captures/${fileName}`, imageBlob, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (supabaseError) {
            console.error('Erreur détaillée Supabase:', {
                message: supabaseError.message,
                details: supabaseError.details,
                hint: supabaseError.hint,
                code: supabaseError.code
            });
            throw new Error(`Erreur Supabase: ${supabaseError.message}`);
        }

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('photos')
            .getPublicUrl(`captures/${fileName}`);

        console.log('Image sauvegardée dans Supabase:', publicUrl);

       // 2. Enregistrer l'URL dans la table 'photos'
//         const { data: insertData, error: insertError } = await supabaseAdmin
//             .from('photos')  // Nom de votre table
//             .insert([
//                 { url: publicUrl, file_name: fileName, event_id: eventId  } // Assurez-vous que les colonnes 'url' et 'file_name' existent dans votre table
//         ]);

// if (insertError) {
//     console.error('Erreur lors de l\'insertion dans la table photos:', insertError.message);
//     throw new Error(`Erreur d'insertion: ${insertError.message}`);
// }

// console.log('URL enregistrée dans la table photos:', insertData);


        
        // 2. Sauvegarder localement
        console.log('Sauvegarde locale...', {
            endpoint: `${BASE_URL}/save-capture`,
            fileName,
            blobSize: imageBlob.size
        });

        const formData = new FormData();
        formData.append('image', imageBlob, fileName);
        console.log("Voici l'imageblob", imageBlob);
        
        const saveLocalResponse = await fetch(`${BASE_URL}/save-capture`, {
            method: 'POST',
            body: formData
        });

        if (!saveLocalResponse.ok) {
            const error = await saveLocalResponse.json();
            console.error('Erreur détaillée sauvegarde locale:', {
                status: saveLocalResponse.status,
                statusText: saveLocalResponse.statusText,
                error
            });
            throw new Error(`Erreur HTTP ${saveLocalResponse.status}: ${error.message}`);
        }

        const localResult = await saveLocalResponse.json();
        console.log('Image sauvegardée localement:', localResult);

        return {
            success: true,
            path: localResult.path,
            url: publicUrl,
            fileName
        };

    } catch (error) {
        console.error('Erreur détaillée lors de la sauvegarde:', {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        return {
            success: false,
            error: error.message || 'Erreur lors de la sauvegarde de l\'image'
        };
    }
};



// Sauvegarder une photo traitée
export const saveProcessed = async (imageUrl, eventId, filename = null) => {
    try {
        console.log('📤 Tentative de sauvegarde de l\'image traitée:', imageUrl);

        // Vérifier si c'est un Direct Download URL en faisant une requête HEAD
        const headResponse = await fetch(imageUrl, { method: 'HEAD' });
        const contentDisposition = headResponse.headers.get('content-disposition');
        const contentType = headResponse.headers.get('content-type');

        let extension = 'jpg'; // Par défaut
        if (contentType) {
            const extMap = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
            extension = extMap[contentType] || 'jpg';
        }

        if (!filename) {
            filename = `processed_${Date.now()}.${extension}`;
        }

        if (contentDisposition && contentDisposition.includes('attachment')) {
            console.log('🟢 Détection d’un Direct Download URL');
            const matches = contentDisposition.match(/filename="(.+?)"/);
            if (matches && matches[1]) {
                filename = matches[1]; // Utiliser le vrai nom du fichier si possible
            }
        } else {
            console.log('🟢 Détection d’un Direct View URL');
        }

        // Télécharger l'image depuis l'URL
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Erreur lors du téléchargement: ${response.statusText}`);

        // Obtenir le type MIME depuis l’en-tête de la réponse
        //const contentTypeMIME = response.headers.get('content-type') || 'image/jpeg';
        const imageBlob = await response.blob();
        //const fixedBlob = new Blob([imageBlob], { type: contentTypeMIME });
        const convertedBlob = new Blob([imageBlob], { type: 'image/jpeg' });
        console.log("Ceci est l'image BLob", imageBlob );
        console.log("Ceci est l'image BLob convertie", convertedBlob );

        // Sauvegarder localement
        const saveLocalResponse = await fetch(`${BASE_URL}/save-processed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl, filename })
        });

        if (!saveLocalResponse.ok) {
            const error = await saveLocalResponse.json();
            console.error('❌ Erreur sauvegarde locale:', error);
            throw new Error(`Erreur HTTP ${saveLocalResponse.status}: ${error.message}`);
        }

        // Sauvegarder dans Supabase
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('photos')
            .upload(`processed/${filename}`, convertedBlob, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (uploadError) {
            console.error('❌ Erreur upload Supabase:', uploadError);
            throw uploadError;
        }

      
        // Obtenir l'URL publique
        const { data: { publicUrl }, error: urlError } = supabaseAdmin.storage
            .from('photos')
            .getPublicUrl(`processed/${filename}`);

        if (urlError) {
            console.error('❌ Erreur récupération URL Supabase:', urlError);
            throw urlError;
        }

        const { data: insertData, error: insertError } = await supabaseAdmin
            .from('photos') // Nom de votre table
            .insert([
                {
                    url: publicUrl, // URL publique de l'image
                    file_name: filename, // Nom du fichier
                    event_id: eventId, // ID de l'événement associé
                },
            ]);

        if (insertError) {
            console.error('❌ Erreur lors de l\'insertion dans la table photos:', insertError.message);
            throw new Error(`Erreur d'insertion: ${insertError.message}`);
        }

        console.log('✅ URL enregistrée dans la table photos:', insertData);

        const localResult = await saveLocalResponse.json();
        return {
            success: true,
            path: localResult.path,
            filename: localResult.filename,
            supabasePath: uploadData?.path || null,  // ✅ Ajout du chemin dans Supabase
            url: publicUrl
        };
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        return { success: false, error: error.message };
    }
    


};
// Récupérer la dernière image
export const getLatestImage = async () => {
    try {
        const response = await fetch(`${BASE_URL}/latest-image`);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('Erreur détaillée lors de la récupération de l\'image:', {
                status: response.status,
                statusText: response.statusText,
                error
            });
            throw new Error(`Erreur HTTP ${response.status}: ${error.message}`);
        }
        
        const blob = await response.blob();
        return {
            success: true,
            blob: blob,
            url: URL.createObjectURL(blob)
        };
    } catch (error) {
        console.error('Erreur détaillée lors de la récupération de la dernière image:', {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        throw error;
    }
};
