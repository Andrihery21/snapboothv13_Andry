import imageCompression from 'browser-image-compression';

/**
 * Compresse une image et la convertit en JPEG
 * @param {string|Blob} imageData - Image à compresser (base64 ou Blob)
 * @returns {Promise<Blob>} Image compressée au format JPEG
 */
export const compressImage = async (imageData) => {
    try {
        // Si l'image est en base64, la convertir en Blob
        let imageFile;
        if (typeof imageData === 'string') {
            // Convertir base64 en Blob
            const response = await fetch(imageData);
            imageFile = await response.blob();
        } else {
            imageFile = imageData;
        }

        // Options de compression
        const options = {
            maxSizeMB: 1,             // Taille maximale en MB
            maxWidthOrHeight: 1920,    // Dimension maximale
            useWebWorker: true,        // Utiliser un Web Worker pour la compression
            fileType: 'image/jpeg',    // Forcer le format JPEG
            initialQuality: 0.9        // Qualité JPEG (0.9 = 90%)
        };

        // Compresser l'image
        const compressedBlob = await imageCompression(imageFile, options);
        
        // Vérifier que c'est bien un JPEG
        if (compressedBlob.type !== 'image/jpeg') {
            // Convertir en JPEG si ce n'est pas déjà le cas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = await createImageBitmap(compressedBlob);
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const jpegBlob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.9);
            });
            
            return jpegBlob;
        }
        
        console.log('Image compressée en JPEG avec succès');
        return compressedBlob;
    } catch (error) {
        console.error('Erreur lors de la compression de l\'image:', error);
        throw error;
    }
};

/**
 * Convertit un Blob en base64
 * @param {Blob} blob - Blob à convertir
 * @returns {Promise<string>} Image en base64
 */
export const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Convertit une chaîne base64 en Blob
 * @param {string} base64String - Chaîne base64 à convertir
 * @returns {Promise<Blob>} Image en Blob
 */
export const base64ToBlob = async (base64String) => {
    // Supprimer le préfixe data:image/jpeg;base64,
    const base64WithoutPrefix = base64String.split(',')[1];
    
    // Convertir la chaîne Base64 en tableau d'octets
    const byteCharacters = atob(base64WithoutPrefix);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'image/jpeg' });
};
