import { Logger } from './logger';
import { notify } from './notifications';

const logger = new Logger('Printer');

export async function printPhoto(photoUrl, quantity = 1) {
  try {
    logger.info('Préparation de l\'impression', { photoUrl, quantity });

    // Créer un élément image caché pour charger la photo
    const img = new Image();
    img.style.display = 'none';
    document.body.appendChild(img);

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Impossible de charger l\'image'));
      img.src = photoUrl;
    });

    // Créer un élément iframe caché pour l'impression
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);

    // Préparer le contenu HTML pour l'impression
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impression Photo</title>
          <style>
            @page {
              size: 15cm 10cm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${photoUrl}" alt="Photo à imprimer">
        </body>
      </html>
    `;

    // Écrire le contenu dans l'iframe
    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(printContent);
    frameDoc.close();

    // Attendre que l'image soit chargée dans l'iframe
    await new Promise(resolve => {
      const frameImg = frameDoc.querySelector('img');
      if (frameImg.complete) {
        resolve();
      } else {
        frameImg.onload = resolve;
      }
    });

    logger.info('Lancement de l\'impression', { quantity });

    // Imprimer le nombre de copies demandé
    for (let i = 0; i < quantity; i++) {
      printFrame.contentWindow.print();
      if (i < quantity - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Nettoyer les éléments créés
    document.body.removeChild(img);
    document.body.removeChild(printFrame);

    logger.info('Impression terminée avec succès');
    notify.success(`Photo imprimée en ${quantity} exemplaire${quantity > 1 ? 's' : ''}`);
    return true;
  } catch (error) {
    logger.error('Erreur lors de l\'impression', error);
    notify.error('Impossible d\'imprimer la photo');
    throw error;
  }
}