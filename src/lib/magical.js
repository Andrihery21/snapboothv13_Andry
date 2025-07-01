/**
 * Module d'effets magiques pour le PhotoBooth
 * Contient les fonctions d'application des effets magiques (IA)
 */

import axios from 'axios';

/**
 * Applique l'effet Cartoon à une image
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
export async function applyCartoon(inputCanvas, optionValue = "comic",magicalId = null) {
  console.log("Application de l'effet Cartoon");
  return await applyAILabEffect(inputCanvas, optionValue,magicalId);
}

/**
 * Applique l'effet Univers à une image
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
export async function applyUnivers(inputCanvas,optionValue = "animation3D",magicalId = null) {
  console.log("Application de l'effet Univers");
  return await applyAILabEffect(inputCanvas,  optionValue,magicalId);
}

/**
 * Applique l'effet Dessin à une image
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
export async function applyDessin(inputCanvas, optionValue = "sketch",magicalId  = null) {
  console.log("Application de l'effet Dessin");
  return await applyAILabEffect(inputCanvas , optionValue,magicalId = null );
}

/**
 * Applique l'effet Caricature à une image
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
export async function applyCaricature(inputCanvas, optionValue = "comic",magicalId) {
  console.log("Application de l'effet Caricature");
  // Pour la caricature, on pourrait utiliser une API différente comme LightX
  // Mais pour cet exemple, on va utiliser AILab avec un type spécifique
  return await applyAILabEffect(inputCanvas, optionValue,magicalId);
}

/**
 * Fonction utilitaire pour appliquer un effet via l'API AILab
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @param {string} effectType - Type d'effet à appliquer
 * * @param {string} magicalId - Type d'effet à appliquer
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
async function applyAILabEffect(inputCanvas, effectType,magicalId) {
  try {
    // Convertir le canvas ou l'URL en blob
    console.log('Ity les brada ny Cannevas an ', inputCanvas);
    let imageBlob;
    if (typeof inputCanvas === 'string') {
      // Si c'est une URL, récupérer l'image
      const response = await fetch(inputCanvas);
      imageBlob = await response.blob();
    } else {
      // Si c'est un canvas, le convertir en blob
      return new Promise(resolve => {
        inputCanvas.toBlob(async blob => {
          try {
            const result = await processImageWithAILab(blob, effectType,magicalId);
            resolve(result);
          } catch (error) {
            console.error(`Erreur lors de l'application de l'effet ${effectType}:`, error);
            resolve(inputCanvas); // En cas d'erreur, retourner l'image source
          }
        }, 'image/jpeg');
      });
    }

    // Traiter l'image avec l'API
    return await processImageWithAILab(imageBlob, effectType,magicalId);
  } catch (error) {
    console.error(`Erreur lors de l'application de l'effet ${effectType}:`, error);
    return inputCanvas; // En cas d'erreur, retourner l'image source
  }
}

/**
 * Fonction qui appelle l'API AILab pour appliquer un effet
 * @param {Blob} imageBlob - Image à traiter au format Blob
 * @param {string} effectType - Type d'effet à appliquer
 * * @param {string} magicalId - Type d'effet à appliquer
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
async function processImageWithAILab(imageBlob, effectType, magicalId) {
  try {
    let processedImageUrl;
    // Préparer les données pour l'API
    if (magicalId === 'carricature'){
     const caricatureResponse = await axios.post(
                    'https://proxy.cors.sh/https://api.lightxeditor.com/external/api/v1/caricature',
                    {
                        imageUrl: imageUrl,
                        styleImageUrl: "", // Remplacez par l'URL de l'image de style si nécessaire
                        textPrompt: selectedType // Remplacez par le texte approprié
                    },{
                        headers: {
                            'x-api-key': '5c3f8ca0cbb94ee191ffe9ec4c86d8f1_6740bbef11114053828a6346ebfdd5f5_andoraitools',
                            'Content-Type': 'application/json',
                            'x-cors-api-key':'temp_3c85bd9782d2d0a181a2b83e6e6a71fc'
                        }
                    }
                );
                
                // const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
                // await delay(5000);
                
                const orderId = caricatureResponse.data.body.orderId;
                console.log(orderId);
                
                
                // Deuxième appel API pour obtenir le statut de la commande
                async function getOrderStatus(orderId) {
                    let attempt = 0;
                    while (attempt < 10) { // Limite à 10 tentatives
                        console.log(`Tentative ${attempt + 1} pour récupérer l'image...`);
        
                        const orderStatusResponse = await axios.post(
                            'https://proxy.cors.sh/https://api.lightxeditor.com/external/api/v1/order-status',
                            {
                                orderId: orderId
                            }, {
                                headers: {
                                    'x-api-key': '5c3f8ca0cbb94ee191ffe9ec4c86d8f1_6740bbef11114053828a6346ebfdd5f5_andoraitools',
                                    'Content-Type': 'application/json',
                                    'x-cors-api-key': 'temp_3c85bd9782d2d0a181a2b83e6e6a71fc'
                                }
                            }
                        );
        
                        const outputUrl = orderStatusResponse.data.body.output;
        
                        if (outputUrl) {
                            console.log("URL de l'image:", outputUrl);
                            return outputUrl;
                        }
        
                        console.log("Image pas encore prête, nouvelle tentative dans 5 secondes...");
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Attente de 5 secondes avant la prochaine tentative
                        attempt++;
                    }
        
                    throw new Error("L'image n'a pas été générée après plusieurs tentatives.");
                }

               processedImageUrl = await getOrderStatus(orderId);
                console.log("L'image est prête :", processedImageUrl);

             }else if(( (magicalId === 'univers' && effectType !== 'animation3d') || (magicalId === 'sketch' && effectType === 0) )){
              
              const formData = new FormData();
              formData.append('index', effectType);
              formData.append('image', imageBlob);
              formData.append('task_type', "async");

              const response = await axios.post(
                    'https://www.ailabapi.com/api/image/effects/ai-anime-generator',
                    formData,
                    {
                        headers: {
                            'ailabapi-api-key': import.meta.env.VITE_AILAB_API_KEY,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                if (response.data.error_code !== 0) {
                    throw new Error(response.data.error_msg || 'Erreur lors du traitement de l\'image');
                }
                 const taskID = response.data.task_id;
                 console.log("Le task ID est :", taskID);

                 async function getOrderStatus(taskID) {
                    let attempt = 0;
                    while (attempt < 20) { // Limite à 10 tentatives
                        console.log(`Tentative ${attempt + 1} pour récupérer l'image...`);
        
                        const orderStatusResponse = await axios.get(
                            'https://www.ailabapi.com/api/common/query-async-task-result',
                            {
                                params: {
                                    'task_id': taskID // Utilisez directement la variable taskID
                                },
                                headers: {
                                    'ailabapi-api-key': import.meta.env.VITE_AILAB_API_KEY
                                }
                            }
                        );
                        console.log("Voici est la reponse",orderStatusResponse);
                        const outputUrl = orderStatusResponse.data.task_status;
        
                        if (outputUrl == 2) {
                            console.log("URL de l'image:", outputUrl);
                            return orderStatusResponse.data.data.result_url;
                        }
        
                        console.log("Image pas encore prête, nouvelle tentative dans 5 secondes...");
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Attente de 5 secondes avant la prochaine tentative
                        attempt++;
                    }
        
                    throw new Error("L'image n'a pas été générée après plusieurs tentatives.");
                }

               processedImageUrl = await getOrderStatus(taskID);
                console.log("L'image est prête :", processedImageUrl);
            
             }else{
    
    
    console.log("itito koa leleka ny magical id ah", magicalId);
    const formData = new FormData();
    console.log("Itito koa ny blob les namana", imageBlob);
    console.log("Itotohoekana ny effecttype",effectType);
    const objectUrl = URL.createObjectURL(imageBlob);    
      formData.append('type', effectType);
      formData.append('image', imageBlob);

    // Appeler l'API
      const response = await axios.post(
      'https://www.ailabapi.com/api/portrait/effects/portrait-animation',
      formData,
      {
        headers: {
          'ailabapi-api-key': import.meta.env.VITE_AILAB_API_KEY,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    // Vérifier la réponse
    if (response.data.error_code !== 0) {
      throw new Error(response.data.error_msg || `Erreur lors du traitement de l'image avec l'effet ${effectType}`);
    }

    // Récupérer l'URL de l'image traitée
     processedImageUrl = response.data.data.image_url;
    }
    // Convertir l'URL en canvas
    return await urlToCanvas(processedImageUrl);
  } catch (error) {
    console.error(`Erreur lors du traitement avec AILab (${effectType}):`, error);
    throw error;
  }
}

/**
 * Convertit une URL d'image en canvas
 * @param {string} url - URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas contenant l'image
 */
async function urlToCanvas(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = (error) => {
      reject(error);
    };
    img.src = url;
  });
}
