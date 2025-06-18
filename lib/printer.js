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

    // Préparer le contenu HTML pour l'impression avec paramètres pour DNP DS RX1
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impression Photo - DNP DS RX1</title>
          <style>
            @page {
              /* Format 10x15cm (4x6") pour DNP DS RX1 */
              size: 15.2cm 10.2cm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: white;
            }
            img {
              width: 15.2cm;
              height: 10.2cm;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${photoUrl}" alt="Photo à imprimer pour DNP DS RX1">
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

    logger.info('Lancement de l\'impression sur DNP DS RX1', { quantity });

    // Configuration pour l'impression DNP DS RX1
    const printOptions = {
      // Ces options ne fonctionnent que si le navigateur les prend en charge
      // et si l'imprimante DNP DS RX1 est configurée comme imprimante par défaut
      printer: 'DNP DS RX1',
      silent: false,
      printBackground: true,
      color: true,
      landscape: false,
      scale: 1.0
    };

    // Informer l'utilisateur de vérifier les paramètres
    notify.info('Assurez-vous que la DNP DS RX1 est configurée comme imprimante par défaut');
    
    // Imprimer le nombre de copies demandé
    for (let i = 0; i < quantity; i++) {
      try {
        printFrame.contentWindow.print();
        logger.info(`Copie ${i+1}/${quantity} envoyée à l'imprimante`);
        
        if (i < quantity - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Délai plus long pour DNP
        }
      } catch (err) {
        logger.error(`Erreur lors de l'impression de la copie ${i+1}`, err);
        throw err;
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