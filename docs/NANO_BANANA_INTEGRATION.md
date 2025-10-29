# Intégration API Nano Banana

## Vue d'ensemble

L'API Nano Banana a été intégrée dans la route `/apply-effects` du service serveur pour permettre le traitement d'images avec des effets de style personnalisés.

## Configuration

### Variables d'environnement requises

Ajoutez la variable suivante à votre fichier `.env` :

```env
NANO_BANANA_API_KEY=your-nano-banana-api-key-here
```

### Configuration de l'API

- **URL de base** : `https://api.nanobanana.com/v1/transform`
- **Méthode** : POST
- **Authentification** : Bearer Token
- **Format** : multipart/form-data

## Utilisation

### Paramètres de la requête

Pour utiliser l'API Nano Banana, envoyez une requête POST à `/apply-effects` avec les paramètres suivants :

```json
{
  "magicalId": "nano_banana",
  "effectType": "cartoon",
  "image": "fichier_image"
}
```

### Paramètres supportés

- **magicalId** : `"nano_banana"` (obligatoire pour déclencher l'API Nano Banana)
- **effectType** : Type d'effet à appliquer (ex: "cartoon", "sketch", "anime", etc.)
- **image** : Fichier image à traiter (format JPEG/PNG)

### Réponse de l'API

```json
{
  "imageUrl": "https://api.nanobanana.com/result/processed-image-url"
}
```

## Implémentation technique

### Code ajouté dans server.js

```javascript
// ---------------------- Nano Banana API ----------------------
else if (magicalId === 'nano_banana') {
  console.log('🍌 Traitement avec Nano Banana API');
  
  // Créer un fichier temporaire
  const tempFilePath = path.join(tmpdir(), `temp_image_${Date.now()}.jpg`);
  writeFileSync(tempFilePath, imageBuffer);
  
  try {
    const formData = new FormData();
    formData.append('image', createReadStream(tempFilePath));
    formData.append('style', effectType || 'cartoon');
    formData.append('quality', 'high');
    
    console.log('📤 Envoi de la requête vers Nano Banana API...');
    
    const nanoBananaRes = await axios.post(
      'https://api.nanobanana.com/v1/transform',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.NANO_BANANA_API_KEY || 'your-api-key-here'}`,
          'Content-Type': 'multipart/form-data',
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30 secondes de timeout
      }
    );
    
    // Nettoyer le fichier temporaire
    fs.unlinkSync(tempFilePath);
    
    console.log('✅ Réponse Nano Banana reçue:', nanoBananaRes.data);
    
    if (nanoBananaRes.data.success) {
      processedImageUrl = nanoBananaRes.data.result_url;
    } else {
      throw new Error(nanoBananaRes.data.error || 'Nano Banana : Erreur inconnue');
    }
    
  } catch (error) {
    // Nettoyer le fichier temporaire en cas d'erreur
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    console.error('❌ Erreur Nano Banana:', error.message);
    throw new Error(`Nano Banana API : ${error.message}`);
  }
}
```

## Gestion des erreurs

L'intégration gère les erreurs suivantes :

1. **Erreurs de réseau** : Timeout de 30 secondes
2. **Erreurs d'authentification** : Vérification de la clé API
3. **Erreurs de traitement** : Gestion des réponses d'erreur de l'API
4. **Nettoyage des fichiers temporaires** : Suppression automatique en cas d'erreur

## Logs et débogage

Les logs suivants sont générés :

- `🍌 Traitement avec Nano Banana API` : Début du traitement
- `📤 Envoi de la requête vers Nano Banana API...` : Envoi de la requête
- `✅ Réponse Nano Banana reçue:` : Réponse reçue avec succès
- `❌ Erreur Nano Banana:` : Erreur lors du traitement

## Tests

Pour tester l'intégration :

1. Configurez la variable d'environnement `NANO_BANANA_API_KEY`
2. Envoyez une requête POST à `/apply-effects` avec `magicalId: "nano_banana"`
3. Vérifiez les logs pour confirmer le traitement
4. Vérifiez que l'URL de l'image traitée est retournée

## Notes importantes

- L'API Nano Banana est positionnée avant l'API AILab Portrait dans la logique de traitement
- Les fichiers temporaires sont automatiquement nettoyés après traitement
- Le timeout est fixé à 30 secondes pour éviter les blocages
- La qualité est fixée à "high" par défaut
